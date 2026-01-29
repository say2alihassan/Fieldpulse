import type { Request } from 'express';

// Re-export shared types
export * from '../../../shared/types';

// Database row types (snake_case from Postgres)
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: Date;
}

export interface JobRow {
  id: string;
  job_number: string;
  customer_id: string;
  assigned_to: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  scheduled_start: Date | null;
  scheduled_end: Date | null;
  actual_start: Date | null;
  actual_end: Date | null;
  checklist_template_id: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface ChecklistTemplateRow {
  id: string;
  name: string;
  fields: unknown; // JSONB
  created_at: Date;
}

export interface ChecklistResponseRow {
  id: string;
  job_id: string;
  field_id: string;
  field_type: string;
  value: unknown; // JSONB
  is_draft: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface PhotoRow {
  id: string;
  job_id: string;
  checklist_response_id: string | null;
  storage_key: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  latitude: string | null;
  longitude: string | null;
  captured_at: Date;
  uploaded_at: Date;
}

export interface SignatureRow {
  id: string;
  job_id: string;
  checklist_response_id: string | null;
  storage_key: string;
  signer_name: string | null;
  captured_at: Date;
}

export interface DeviceTokenRow {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  device_id: string | null;
  device_name: string | null;
  app_version: string | null;
  created_at: Date;
  last_used_at: Date | null;
}

export interface NotificationRow {
  id: string;
  type: string;
  user_id: string;
  title: string;
  content: string;
  related_id: string | null;
  related_type: string | null;
  data: unknown; // JSONB
  priority: string;
  category: string;
  read: boolean;
  read_at: Date | null;
  dismissed: boolean;
  dismissed_at: Date | null;
  created_by: string | null;
  created_at: Date;
  expires_at: Date | null;
}

// Database interface for Kysely
export interface Database {
  users: UserRow;
  refresh_tokens: RefreshTokenRow;
  customers: CustomerRow;
  jobs: JobRow;
  checklist_templates: ChecklistTemplateRow;
  checklist_responses: ChecklistResponseRow;
  photos: PhotoRow;
  signatures: SignatureRow;
  device_tokens: DeviceTokenRow;
  notifications: NotificationRow;
}

// Express extensions
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// JWT Payload
export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// Cursor pagination
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
