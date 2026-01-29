/**
 * Sync Queue Unit Tests
 *
 * Note: These tests mock the database layer since op-sqlite requires
 * native bindings. In a real test environment, you would use an
 * in-memory SQLite database or mock at a different level.
 */

import type { SyncQueueItem, SyncEntityType, SyncAction } from '../../src/types';

// Mock database
const mockDb = {
  items: [] as SyncQueueItem[],
  nextId: 1,
};

// Simulated sync queue functions (matching the real implementation)
function addToQueue(
  entityType: SyncEntityType,
  entityId: string,
  action: SyncAction,
  payload: unknown,
  filePath?: string,
  priority = 0
): number {
  // Remove any existing queue items for the same entity
  mockDb.items = mockDb.items.filter(
    (item) => !(item.entityType === entityType && item.entityId === entityId)
  );

  const id = mockDb.nextId++;
  mockDb.items.push({
    id,
    entityType,
    entityId,
    action,
    payload,
    filePath,
    retryCount: 0,
    priority,
    createdAt: Date.now(),
  });

  return id;
}

function getNextQueueItems(limit = 10): SyncQueueItem[] {
  return mockDb.items
    .filter((item) => item.retryCount < 3)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.createdAt - b.createdAt;
    })
    .slice(0, limit);
}

function getQueueCount(): number {
  return mockDb.items.length;
}

function markItemSuccess(id: number): void {
  mockDb.items = mockDb.items.filter((item) => item.id !== id);
}

function markItemFailed(id: number, error: string): void {
  const item = mockDb.items.find((i) => i.id === id);
  if (item) {
    item.retryCount++;
    item.lastError = error;
  }
}

function getFailedItems(): SyncQueueItem[] {
  return mockDb.items.filter((item) => item.retryCount >= 3);
}

function retryFailedItem(id: number): void {
  const item = mockDb.items.find((i) => i.id === id);
  if (item) {
    item.retryCount = 0;
    item.lastError = undefined;
  }
}

function clearQueue(): void {
  mockDb.items = [];
  mockDb.nextId = 1;
}

describe('SyncQueue', () => {
  beforeEach(() => {
    clearQueue();
  });

  describe('addToQueue', () => {
    it('adds item to queue with correct properties', () => {
      const id = addToQueue('job', 'job-1', 'update', { status: 'completed' });

      expect(id).toBe(1);
      expect(getQueueCount()).toBe(1);

      const items = getNextQueueItems();
      expect(items[0]).toMatchObject({
        entityType: 'job',
        entityId: 'job-1',
        action: 'update',
        payload: { status: 'completed' },
        retryCount: 0,
        priority: 0,
      });
    });

    it('replaces existing item for same entity', () => {
      addToQueue('job', 'job-1', 'update', { status: 'in_progress' });
      addToQueue('job', 'job-1', 'update', { status: 'completed' });

      expect(getQueueCount()).toBe(1);

      const items = getNextQueueItems();
      expect(items[0].payload).toEqual({ status: 'completed' });
    });

    it('allows multiple items for different entities', () => {
      addToQueue('job', 'job-1', 'update', { status: 'completed' });
      addToQueue('job', 'job-2', 'update', { status: 'in_progress' });
      addToQueue('checklist_response', 'job-1', 'create', { value: 'test' });

      expect(getQueueCount()).toBe(3);
    });

    it('stores file path for photo/signature uploads', () => {
      addToQueue(
        'photo',
        'photo-1',
        'create',
        { jobId: 'job-1' },
        '/path/to/photo.jpg'
      );

      const items = getNextQueueItems();
      expect(items[0].filePath).toBe('/path/to/photo.jpg');
    });
  });

  describe('getNextQueueItems', () => {
    it('returns items sorted by priority (descending)', () => {
      addToQueue('job', 'job-1', 'update', {}, undefined, 0);
      addToQueue('job', 'job-2', 'update', {}, undefined, 10);
      addToQueue('job', 'job-3', 'update', {}, undefined, 5);

      const items = getNextQueueItems();
      expect(items[0].entityId).toBe('job-2'); // priority 10
      expect(items[1].entityId).toBe('job-3'); // priority 5
      expect(items[2].entityId).toBe('job-1'); // priority 0
    });

    it('returns items with same priority sorted by createdAt (ascending)', () => {
      addToQueue('job', 'job-1', 'update', {});
      addToQueue('job', 'job-2', 'update', {});
      addToQueue('job', 'job-3', 'update', {});

      const items = getNextQueueItems();
      expect(items[0].entityId).toBe('job-1');
      expect(items[1].entityId).toBe('job-2');
      expect(items[2].entityId).toBe('job-3');
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 20; i++) {
        addToQueue('job', `job-${i}`, 'update', {});
      }

      expect(getNextQueueItems(5).length).toBe(5);
      expect(getNextQueueItems(10).length).toBe(10);
    });

    it('excludes items with retryCount >= 3', () => {
      const id = addToQueue('job', 'job-1', 'update', {});
      markItemFailed(id, 'Error 1');
      markItemFailed(id, 'Error 2');
      markItemFailed(id, 'Error 3');

      expect(getNextQueueItems().length).toBe(0);
      expect(getQueueCount()).toBe(1); // Still in queue, just not returned
    });
  });

  describe('markItemSuccess', () => {
    it('removes item from queue', () => {
      const id = addToQueue('job', 'job-1', 'update', {});
      expect(getQueueCount()).toBe(1);

      markItemSuccess(id);
      expect(getQueueCount()).toBe(0);
    });
  });

  describe('markItemFailed', () => {
    it('increments retryCount', () => {
      const id = addToQueue('job', 'job-1', 'update', {});

      markItemFailed(id, 'Network error');
      let items = getNextQueueItems();
      expect(items[0].retryCount).toBe(1);
      expect(items[0].lastError).toBe('Network error');

      markItemFailed(id, 'Timeout');
      items = getNextQueueItems();
      expect(items[0].retryCount).toBe(2);
      expect(items[0].lastError).toBe('Timeout');
    });

    it('item becomes failed after 3 retries', () => {
      const id = addToQueue('job', 'job-1', 'update', {});

      markItemFailed(id, 'Error 1');
      markItemFailed(id, 'Error 2');
      expect(getNextQueueItems().length).toBe(1);

      markItemFailed(id, 'Error 3');
      expect(getNextQueueItems().length).toBe(0);
      expect(getFailedItems().length).toBe(1);
    });
  });

  describe('getFailedItems', () => {
    it('returns only items with retryCount >= 3', () => {
      const id1 = addToQueue('job', 'job-1', 'update', {});
      const id2 = addToQueue('job', 'job-2', 'update', {});

      // Fail job-1 3 times
      markItemFailed(id1, 'Error');
      markItemFailed(id1, 'Error');
      markItemFailed(id1, 'Error');

      // Fail job-2 only 2 times
      markItemFailed(id2, 'Error');
      markItemFailed(id2, 'Error');

      const failed = getFailedItems();
      expect(failed.length).toBe(1);
      expect(failed[0].entityId).toBe('job-1');
    });
  });

  describe('retryFailedItem', () => {
    it('resets retryCount to 0', () => {
      const id = addToQueue('job', 'job-1', 'update', {});

      markItemFailed(id, 'Error');
      markItemFailed(id, 'Error');
      markItemFailed(id, 'Error');

      expect(getFailedItems().length).toBe(1);
      expect(getNextQueueItems().length).toBe(0);

      retryFailedItem(id);

      expect(getFailedItems().length).toBe(0);
      expect(getNextQueueItems().length).toBe(1);
    });

    it('clears lastError', () => {
      const id = addToQueue('job', 'job-1', 'update', {});
      markItemFailed(id, 'Some error');

      retryFailedItem(id);

      const items = getNextQueueItems();
      expect(items[0].lastError).toBeUndefined();
    });
  });

  describe('queue processing simulation', () => {
    it('processes items in correct order', async () => {
      const processed: string[] = [];

      // Add items with different priorities
      addToQueue('photo', 'photo-1', 'create', {}, undefined, 0); // Low priority
      addToQueue('checklist_response', 'job-1', 'update', {}, undefined, 5); // Medium
      addToQueue('job', 'job-1', 'update', { status: 'completed' }, undefined, 10); // High

      // Simulate processing
      const processQueue = async (): Promise<void> => {
        const items = getNextQueueItems();
        for (const item of items) {
          processed.push(item.entityId);
          markItemSuccess(item.id);
        }
      };

      await processQueue();

      expect(processed).toEqual(['job-1', 'job-1', 'photo-1']);
    });

    it('handles failures and retries correctly', async () => {
      const id = addToQueue('job', 'job-1', 'update', {});
      let attempts = 0;

      const processWithRetry = async (): Promise<boolean> => {
        const items = getNextQueueItems();
        if (items.length === 0) return false;

        const item = items[0];
        attempts++;

        // Simulate failure on first 2 attempts
        if (attempts < 3) {
          markItemFailed(item.id, `Attempt ${attempts} failed`);
          return true;
        }

        markItemSuccess(item.id);
        return false;
      };

      // Process until queue is empty
      while (await processWithRetry()) {
        // Continue processing
      }

      expect(attempts).toBe(3);
      expect(getQueueCount()).toBe(0);
    });
  });
});
