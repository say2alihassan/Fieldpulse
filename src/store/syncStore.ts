import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { AxiosError } from 'axios';
import * as syncQueueRepo from '../db/repositories/syncQueue';
import * as jobsRepo from '../db/repositories/jobs';
import { apiClient } from '../api/client';
import type { NetworkStatus, SyncConflict, SyncQueueItem } from '../types';

interface SyncState {
  networkStatus: NetworkStatus;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  conflicts: SyncConflict[];
  error: string | null;

  // Actions
  initializeSync: () => void;
  startSync: () => Promise<void>;
  pullChanges: () => Promise<void>;
  pushChanges: () => Promise<void>;
  resolveConflict: (
    conflictId: number,
    resolution: 'local' | 'server'
  ) => Promise<void>;
  updatePendingCount: () => Promise<void>;
  clearError: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  networkStatus: 'unknown',
  isSyncing: false,
  lastSyncedAt: null,
  pendingCount: 0,
  conflicts: [],
  error: null,

  initializeSync: () => {
    // Get initial network state
    NetInfo.fetch().then((state) => {
      const status: NetworkStatus = state.isConnected === true ? 'online' : 'offline';
      set({ networkStatus: status });

      // Initial sync if online
      if (status === 'online' && !get().isSyncing) {
        get().startSync();
      }
    });

    // Listen for network changes
    NetInfo.addEventListener((state) => {
    
      const previousStatus = get().networkStatus;
      const newStatus: NetworkStatus = state.isConnected === true ? 'online' : 'offline';

      // Only update if status actually changed
      if (previousStatus !== newStatus) {
        set({ networkStatus: newStatus });

        // Auto-sync when coming back online
        if (newStatus === 'online' && !get().isSyncing) {
          get().startSync();
        }
      }
    });

    // Update pending count
    get().updatePendingCount();
  },

  startSync: async () => {
    const { networkStatus, isSyncing } = get();

    if (networkStatus !== 'online' || isSyncing) {
      return;
    }

    set({ isSyncing: true, error: null });

    try {
      // Pull first, then push
      await get().pullChanges();
      await get().pushChanges();

      set({
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
      });

      get().updatePendingCount();
    } catch (error) {
      set({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  },

  pullChanges: async () => {
    const { lastSyncedAt } = get();

    try {
      const response = await retryWithBackoff(() =>
        apiClient.post('/sync/pull', {
          lastSyncedAt: lastSyncedAt || new Date(0).toISOString(),
          entities: ['jobs', 'customers'],
        })
      );

      const { jobs, syncedAt } = response.data;

      // Save updated jobs
      if (jobs?.updated) {
        await jobsRepo.saveJobs(jobs.updated, true);
      }

      // Handle deleted jobs
      if (jobs?.deleted) {
        for (const jobId of jobs.deleted) {
          await jobsRepo.deleteJob(jobId);
        }
      }

      set({ lastSyncedAt: syncedAt });
    } catch (error) {
      console.error('Pull sync failed:', error);
      // Don't throw for rate limit errors - just log and continue
      if (isRateLimitError(error)) {
        console.log('Pull sync rate limited, will retry later');
        return;
      }
      throw error;
    }
  },

  pushChanges: async () => {
    const items = await syncQueueRepo.getNextQueueItems(10);

    for (const item of items) {
      try {
        await retryWithBackoff(() => processQueueItem(item));
        await syncQueueRepo.markItemSuccess(item.id);
      } catch (error) {
        // Check for version conflict (409 status or VERSION_CONFLICT code)
        const isConflict = isVersionConflict(error);

        if (isConflict) {
          // Handle conflict - fetch latest and apply server wins strategy
          console.log('[Sync] Version conflict detected, applying server-wins strategy');
          await handleConflictServerWins(item);
          await syncQueueRepo.removeFromQueue(item.id);
        } else if (isRateLimitError(error)) {
          // Rate limited after retries - stop processing and try later
          console.log('[Sync] Rate limited, stopping push and will retry later');
          break;
        } else {
          const message = error instanceof Error ? error.message : 'Unknown error';
          await syncQueueRepo.markItemFailed(item.id, message);
        }
      }
    }

    // Update pending count after processing
    get().updatePendingCount();
  },

  resolveConflict: async (conflictId: number, resolution: 'local' | 'server') => {
    const { conflicts } = get();
    const conflict = conflicts.find((c) => c.id === conflictId);

    if (!conflict) return;

    if (resolution === 'local') {
      // Re-queue the local change with incremented version
      await syncQueueRepo.addToQueue(
        conflict.entityType,
        conflict.entityId,
        'update',
        conflict.localData,
        undefined,
        10 // High priority
      );
    } else {
      // Apply server data locally
      if (conflict.entityType === 'job') {
        await jobsRepo.saveJob(conflict.serverData as Parameters<typeof jobsRepo.saveJob>[0], true);
      }
    }

    // Remove from conflicts
    set({
      conflicts: conflicts.filter((c) => c.id !== conflictId),
    });

    // Trigger sync to process the re-queued item
    if (resolution === 'local') {
      await get().pushChanges();
    }
  },

  updatePendingCount: async () => {
    const count = await syncQueueRepo.getQueueCount();
    set({ pendingCount: count });
  },

  clearError: () => {
    set({ error: null });
  },
}));

async function processQueueItem(item: SyncQueueItem): Promise<void> {
  switch (item.entityType) {
    case 'job':
      if (item.action === 'update') {
        const payload = item.payload as {
          status?: string;
          actualStart?: string;
          version: number;
        };

        await apiClient.patch(`/jobs/${item.entityId}`, payload);
      }
      break;

    case 'checklist_response':
      if (item.action === 'update') {
        const payload = item.payload as {
          responses: Array<{ fieldId: string; value: unknown; isDraft: boolean }>;
          completeJob?: boolean;
          version?: number;
        };

        if (payload.completeJob && payload.version) {
          await apiClient.post(`/jobs/${item.entityId}/complete`, {
            responses: payload.responses,
            version: payload.version,
          });
        } else {
          await apiClient.post(`/jobs/${item.entityId}/checklist/batch`, {
            responses: payload.responses,
          });
        }
      }
      break;

    case 'photo':
    case 'signature':
      // Photo/signature uploads are handled separately
      break;
  }
}

// Check if error is a version conflict (409 status)
function isVersionConflict(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 409 ||
           error.response?.data?.code === 'VERSION_CONFLICT';
  }
  return false;
}

// Server-wins conflict resolution: fetch latest from server and update local
async function handleConflictServerWins(item: SyncQueueItem): Promise<void> {
  try {
    if (item.entityType === 'job') {
      // Fetch the latest job from server
      const response = await apiClient.get(`/jobs/${item.entityId}`);
      const serverJob = response.data;

      // Update local database with server version
      await jobsRepo.saveJob(serverJob, true);
      console.log(`[Sync] Resolved conflict for job ${item.entityId} with server data`);
    }
  } catch (fetchError) {
    console.error('[Sync] Failed to fetch server data for conflict resolution:', fetchError);
  }
}

// Check if error is a rate limit error (429 status)
function isRateLimitError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 429;
  }
  return false;
}

// Retry function with exponential backoff for rate limiting
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on rate limit errors
      if (!isRateLimitError(error)) {
        throw error;
      }

      // Check if we have retries left
      if (attempt < maxRetries - 1) {
        // Calculate delay with exponential backoff (1s, 2s, 4s, etc.)
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[Sync] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// Helper to sleep for a given duration
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
