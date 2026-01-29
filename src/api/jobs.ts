import { apiClient } from './client';
import type {
  Job,
  JobWithDetails,
  JobFilters,
  PaginatedResponse,
  ChecklistResponse,
} from '../types';

export async function getJobs(
  filters: JobFilters & { cursor?: string; limit?: number }
): Promise<PaginatedResponse<Job>> {
  const params = new URLSearchParams();

  if (filters.status && filters.status.length > 0) {
    params.append('status', filters.status.join(','));
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  if (filters.cursor) {
    params.append('cursor', filters.cursor);
  }
  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }

  const response = await apiClient.get<PaginatedResponse<Job>>(
    `/jobs?${params.toString()}`
  );
  return response.data;
}

export async function getJobById(jobId: string): Promise<JobWithDetails> {
  const response = await apiClient.get<JobWithDetails>(`/jobs/${jobId}`);
  return response.data;
}

export async function updateJobStatus(
  jobId: string,
  status: string,
  version: number
): Promise<Job> {
  const response = await apiClient.patch<{ job: Job }>(`/jobs/${jobId}`, {
    status,
    version,
  });
  return response.data.job;
}

export async function startJob(jobId: string, version: number): Promise<Job> {
  const response = await apiClient.patch<{ job: Job }>(`/jobs/${jobId}`, {
    status: 'in_progress',
    actualStart: new Date().toISOString(),
    version,
  });
  return response.data.job;
}

export async function completeJob(
  jobId: string,
  responses: Array<{ fieldId: string; value: unknown; isDraft: boolean }>,
  version: number
): Promise<Job> {
  const response = await apiClient.post<{ job: Job }>(`/jobs/${jobId}/complete`, {
    responses,
    version,
  });
  return response.data.job;
}

export async function saveChecklistResponse(
  jobId: string,
  fieldId: string,
  value: unknown,
  isDraft: boolean
): Promise<ChecklistResponse> {
  const response = await apiClient.put<{ response: ChecklistResponse }>(
    `/jobs/${jobId}/checklist/${fieldId}`,
    { value, isDraft }
  );
  return response.data.response;
}

export async function saveChecklistResponses(
  jobId: string,
  responses: Array<{ fieldId: string; value: unknown; isDraft: boolean }>
): Promise<ChecklistResponse[]> {
  const response = await apiClient.post<{ responses: ChecklistResponse[] }>(
    `/jobs/${jobId}/checklist/batch`,
    { responses }
  );
  return response.data.responses;
}
