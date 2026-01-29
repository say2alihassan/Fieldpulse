import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import * as uploadApi from '../api/upload';

export interface PhotoUploadItem {
  id: string;
  jobId: string;
  fieldId: string;
  localPath: string;
  uri: string;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  width: number;
  height: number;
  sizeBytes: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress: number;
  errorMessage?: string;
  retryCount: number;
  createdAt: number;
  serverKey?: string;
}

interface PhotoUploadState {
  queue: PhotoUploadItem[];
  isProcessing: boolean;
  currentUploadId: string | null;

  // Actions
  queuePhoto: (photo: Omit<PhotoUploadItem, 'id' | 'status' | 'progress' | 'retryCount' | 'createdAt'>) => void;
  removeFromQueue: (id: string) => void;
  startProcessing: () => Promise<void>;
  retryUpload: (id: string) => void;
  clearCompleted: () => void;
  getQueueForJob: (jobId: string) => PhotoUploadItem[];
  getQueueForField: (fieldId: string) => PhotoUploadItem[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

export const usePhotoUploadStore = create<PhotoUploadState>((set, get) => ({
  queue: [],
  isProcessing: false,
  currentUploadId: null,

  queuePhoto: (photo) => {
    const newItem: PhotoUploadItem = {
      ...photo,
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      createdAt: Date.now(),
    };

    set((state) => ({
      queue: [...state.queue, newItem],
    }));

    // Start processing if not already running
    const { isProcessing } = get();
    if (!isProcessing) {
      get().startProcessing();
    }
  },

  removeFromQueue: (id) => {
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    }));
  },

  startProcessing: async () => {
    const { isProcessing, queue } = get();

    if (isProcessing) return;

    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // Schedule retry when online
      const unsubscribe = NetInfo.addEventListener((state) => {
        if (state.isConnected) {
          unsubscribe();
          get().startProcessing();
        }
      });
      return;
    }

    set({ isProcessing: true });

    while (true) {
      const { queue: currentQueue } = get();
      const pendingItem = currentQueue.find(
        (item) => item.status === 'pending' || (item.status === 'error' && item.retryCount < MAX_RETRIES)
      );

      if (!pendingItem) {
        break;
      }

      set({ currentUploadId: pendingItem.id });

      // Update status to uploading
      set((state) => ({
        queue: state.queue.map((item) =>
          item.id === pendingItem.id
            ? { ...item, status: 'uploading' as const, progress: 0 }
            : item
        ),
      }));

      try {
        const filename = pendingItem.localPath.split('/').pop() || 'photo.jpg';
        console.log('[PhotoUpload] Starting direct upload for:', filename);

        // Update progress
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === pendingItem.id ? { ...item, progress: 20 } : item
          ),
        }));

        // Read file as base64
        const filePath = pendingItem.uri.replace('file://', '');
        console.log('[PhotoUpload] Reading file:', filePath);
        const base64Data = await RNFS.readFile(filePath, 'base64');

        // Update progress
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === pendingItem.id ? { ...item, progress: 50 } : item
          ),
        }));

        // Direct upload to backend
        console.log('[PhotoUpload] Uploading to backend...');
        const uploadResponse = await uploadApi.directUpload(
          pendingItem.jobId,
          filename,
          base64Data,
          'image/jpeg'
        );

        console.log('[PhotoUpload] Upload response:', uploadResponse);

        // Update progress
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === pendingItem.id ? { ...item, progress: 80 } : item
          ),
        }));

        // Confirm upload with server (save metadata to DB)
        await uploadApi.confirmPhotoUpload({
          jobId: pendingItem.jobId,
          key: uploadResponse.key,
          latitude: pendingItem.latitude ?? undefined,
          longitude: pendingItem.longitude ?? undefined,
          capturedAt: pendingItem.capturedAt,
          width: pendingItem.width,
          height: pendingItem.height,
          sizeBytes: pendingItem.sizeBytes,
        });

        // Mark as complete
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === pendingItem.id
              ? { ...item, status: 'complete' as const, progress: 100, serverKey: uploadResponse.key }
              : item
          ),
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        console.error('[PhotoUpload] Upload failed:', error);

        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === pendingItem.id
              ? {
                  ...item,
                  status: 'error' as const,
                  errorMessage,
                  retryCount: item.retryCount + 1,
                }
              : item
          ),
        }));

        // Wait before retry
        if (pendingItem.retryCount + 1 < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    set({ isProcessing: false, currentUploadId: null });
  },

  retryUpload: (id) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id
          ? { ...item, status: 'pending' as const, retryCount: 0, errorMessage: undefined }
          : item
      ),
    }));

    // Start processing
    const { isProcessing } = get();
    if (!isProcessing) {
      get().startProcessing();
    }
  },

  clearCompleted: () => {
    set((state) => ({
      queue: state.queue.filter((item) => item.status !== 'complete'),
    }));
  },

  getQueueForJob: (jobId) => {
    return get().queue.filter((item) => item.jobId === jobId);
  },

  getQueueForField: (fieldId) => {
    return get().queue.filter((item) => item.fieldId === fieldId);
  },
}));
