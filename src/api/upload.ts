import { apiClient } from './client';
import type { UploadResponse, Photo, Signature } from '../types';

export async function requestUploadUrl(
  jobId: string,
  type: 'photo' | 'signature',
  filename: string
): Promise<UploadResponse> {
  const response = await apiClient.post<UploadResponse>('/upload/request', {
    jobId,
    type,
    filename,
  });
  return response.data;
}

// Direct upload to backend (bypasses S3 for development)
export async function directUpload(
  jobId: string,
  filename: string,
  base64Data: string,
  contentType: string = 'image/jpeg'
): Promise<{ success: boolean; key: string; url: string }> {
  const response = await apiClient.post('/upload/direct', {
    jobId,
    filename,
    base64Data,
    contentType,
  });
  return response.data;
}

export async function uploadToS3(
  uploadUrl: string,
  fileUri: string,
  contentType: string
): Promise<void> {
  // Read file and upload
  const response = await fetch(fileUri);
  const blob = await response.blob();

  await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': contentType,
    },
  });
}

export async function confirmPhotoUpload(params: {
  jobId: string;
  key: string;
  checklistResponseId?: string;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}): Promise<Photo> {
  const response = await apiClient.post<{ photo: Photo }>('/upload/photos', params);
  return response.data.photo;
}

export async function confirmSignatureUpload(params: {
  jobId: string;
  key: string;
  checklistResponseId?: string;
  signerName?: string;
}): Promise<Signature> {
  const response = await apiClient.post<{ signature: Signature }>(
    '/upload/signatures',
    params
  );
  return response.data.signature;
}
