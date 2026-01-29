// Re-export shared types
export * from '../../shared/types';

// Mobile-specific types

export interface ProcessedPhoto {
  uri: string;
  localPath: string;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface LocalJob {
  id: string;
  data: string; // JSON stringified Job
  serverVersion: number | null;
  localVersion: number;
  isDirty: boolean;
  lastSyncedAt: number | null;
  createdAt: number;
}

export interface LocalChecklistResponse {
  id: string;
  jobId: string;
  fieldId: string;
  data: string; // JSON stringified response
  isDirty: boolean;
  isDraft: boolean;
  lastSyncedAt: number | null;
}

export interface LocalPhoto {
  id: string;
  jobId: string;
  localPath: string;
  uploaded: boolean;
  uploadAttempts: number;
  createdAt: number;
}

export type NetworkStatus = 'online' | 'offline' | 'unknown';

export interface AppState {
  isReady: boolean;
  networkStatus: NetworkStatus;
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  BiometricUnlock: undefined;
};

export type MainTabParamList = {
  Jobs: undefined;
  Settings: undefined;
};

export type JobsStackParamList = {
  JobList: undefined;
  JobDetails: { jobId: string };
  Checklist: { jobId: string };
  PhotoCapture: { jobId: string; fieldId: string; maxPhotos?: number };
  PhotoPreview: {
    jobId: string;
    fieldId: string;
    photoUri: string;
    latitude: number | null;
    longitude: number | null;
    maxPhotos?: number;
  };
  SignatureCapture: { jobId: string; fieldId?: string };
};

// Form state
export interface FormFieldState {
  value: unknown;
  error: string | null;
  touched: boolean;
  isDirty: boolean;
}

export type FormState = Record<string, FormFieldState>;

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
