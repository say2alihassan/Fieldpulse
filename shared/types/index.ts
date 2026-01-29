// Shared types between mobile and backend

// ============ User & Auth ============
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'technician' | 'dispatcher';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ============ Customer ============
export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

// ============ Job ============
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Job {
  id: string;
  jobNumber: string;
  customerId: string;
  assignedTo: string;
  status: JobStatus;
  priority: JobPriority;
  title: string;
  description: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  checklistTemplateId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobWithDetails extends Job {
  customer: Customer;
  checklistTemplate: ChecklistTemplate | null;
  responses: ChecklistResponse[];
}

// ============ Checklist ============
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'time'
  | 'photo'
  | 'signature'
  | 'checkbox';

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  options?: string[]; // For select/multi-select
  validation?: FieldValidation;
  defaultValue?: unknown;
  maxPhotos?: number; // For photo fields - default is 5
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  fields: FieldDefinition[];
  createdAt: string;
}

export interface ChecklistResponse {
  id: string;
  jobId: string;
  fieldId: string;
  fieldType: FieldType;
  value: unknown;
  isDraft: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ============ Photo & Signature ============
export interface Photo {
  id: string;
  jobId: string;
  checklistResponseId: string | null;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  uploadedAt: string;
}

export interface Signature {
  id: string;
  jobId: string;
  checklistResponseId: string | null;
  storageKey: string;
  signerName: string | null;
  capturedAt: string;
}

// ============ API Pagination ============
export interface PaginatedRequest {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ============ Job List Filters ============
export interface JobFilters {
  status?: JobStatus[];
  search?: string;
  assignedTo?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

// ============ Sync ============
export type SyncAction = 'create' | 'update' | 'delete';
export type SyncEntityType = 'job' | 'checklist_response' | 'photo' | 'signature';

export interface SyncQueueItem {
  id: number;
  entityType: SyncEntityType;
  entityId: string;
  action: SyncAction;
  payload: unknown;
  filePath?: string;
  retryCount: number;
  lastError?: string;
  priority: number;
  createdAt: number;
}

export interface SyncPullRequest {
  lastSyncedAt: string;
  entities: SyncEntityType[];
}

export interface SyncPullResponse {
  jobs: { updated: Job[]; deleted: string[] };
  customers: { updated: Customer[]; deleted: string[] };
  syncedAt: string;
}

export interface SyncPushChange {
  entityType: SyncEntityType;
  entityId: string;
  action: SyncAction;
  data: unknown;
  localVersion: number;
}

export interface SyncPushResult {
  entityId: string;
  status: 'success' | 'conflict' | 'error';
  serverVersion?: number;
  serverData?: unknown;
  error?: string;
}

export interface SyncConflict {
  id: number;
  entityType: SyncEntityType;
  entityId: string;
  localData: unknown;
  serverData: unknown;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
  createdAt: number;
}

// ============ Upload ============
export interface UploadRequest {
  jobId: string;
  type: 'photo' | 'signature';
  filename: string;
}

export interface UploadResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

// ============ API Error ============
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
