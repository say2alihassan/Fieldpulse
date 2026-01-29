import { create } from 'zustand';
import * as jobsApi from '../api/jobs';
import * as jobsRepo from '../db/repositories/jobs';
import * as syncQueue from '../db/repositories/syncQueue';
import type { Job, JobWithDetails, JobStatus, JobFilters } from '../types';

interface JobsState {
  jobs: Job[];
  currentJob: JobWithDetails | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  filters: JobFilters;
  nextCursor: string | null;
  hasMore: boolean;

  // Actions
  fetchJobs: (refresh?: boolean) => Promise<void>;
  fetchMoreJobs: () => Promise<void>;
  fetchJobById: (jobId: string) => Promise<void>;
  updateJobStatus: (jobId: string, status: JobStatus) => Promise<void>;
  startJob: (jobId: string) => Promise<void>;
  setFilters: (filters: Partial<JobFilters>) => void;
  clearFilters: () => void;
  clearCurrentJob: () => void;
  clearError: () => void;

  // Offline support
  loadJobsFromCache: () => Promise<void>;
  getJobFromCache: (jobId: string) => Promise<Job | null>;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  currentJob: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  filters: {},
  nextCursor: null,
  hasMore: true,

  fetchJobs: async (refresh = true) => {
    const { filters } = get();
    set({ isLoading: true, error: null });

    if (refresh) {
      set({ nextCursor: null, hasMore: true });
    }

    try {
      const response = await jobsApi.getJobs({
        ...filters,
        limit: 20,
      });

      // Save to local cache
      await jobsRepo.saveJobs(response.data, true);

      set({
        jobs: response.data,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
        isLoading: false,
      });
    } catch {
      // Fall back to cached data
      const cachedJobs = await jobsRepo.getAllJobs();
      let filteredJobs = cachedJobs;

      // Filter by status
      if (filters.status && filters.status.length > 0) {
        filteredJobs = filteredJobs.filter((j) => filters.status!.includes(j.status));
      }

      // Filter by date range (using scheduledStart)
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredJobs = filteredJobs.filter((j) => {
          if (!j.scheduledStart) return false;
          return new Date(j.scheduledStart) >= startDate;
        });
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredJobs = filteredJobs.filter((j) => {
          if (!j.scheduledStart) return false;
          return new Date(j.scheduledStart) <= endDate;
        });
      }

      set({
        jobs: filteredJobs,
        isLoading: false,
        error: 'Failed to fetch jobs. Showing cached data.',
      });
    }
  },

  fetchMoreJobs: async () => {
    const { filters, nextCursor, hasMore, isLoadingMore } = get();

    if (!hasMore || isLoadingMore || !nextCursor) {
      return;
    }

    set({ isLoadingMore: true });

    try {
      const response = await jobsApi.getJobs({
        ...filters,
        cursor: nextCursor,
        limit: 20,
      });

      // Save to local cache
      await jobsRepo.saveJobs(response.data, true);

      set((state) => ({
        jobs: [...state.jobs, ...response.data],
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
        isLoadingMore: false,
      }));
    } catch  {
      set({ isLoadingMore: false });
    }
  },

  fetchJobById: async (jobId: string) => {
    set({ isLoading: true, error: null, currentJob: null });

    try {
      const job = await jobsApi.getJobById(jobId);
      set({ currentJob: job, isLoading: false });
    } catch {
      // Try to get from cache
      const cachedJob = await jobsRepo.getJobById(jobId);

      if (cachedJob) {
        set({
          currentJob: {
            ...cachedJob,
            customer: null as unknown as JobWithDetails['customer'],
            checklistTemplate: null,
            responses: [],
          },
          isLoading: false,
          error: 'Showing cached data. Some details may be unavailable.',
        });
      } else {
        set({
          isLoading: false,
          error: 'Failed to load job details',
        });
      }
    }
  },

  updateJobStatus: async (jobId: string, status: JobStatus) => {
    const { jobs, currentJob } = get();

    // Optimistic update
    const updatedJobs = jobs.map((j) =>
      j.id === jobId ? { ...j, status } : j
    );
    set({ jobs: updatedJobs });

    if (currentJob?.id === jobId) {
      set({ currentJob: { ...currentJob, status } });
    }

    try {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) throw new Error('Job not found');

      const updatedJob = await jobsApi.updateJobStatus(
        jobId,
        status,
        job.version
      );

      // Update with server response
      await jobsRepo.saveJob(updatedJob, true);

      set({
        jobs: jobs.map((j) => (j.id === jobId ? updatedJob : j)),
        currentJob:
          currentJob?.id === jobId
            ? { ...currentJob, ...updatedJob }
            : currentJob,
      });
    } catch {
      // Queue for sync
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        const updatedJob = { ...job, status };
        await jobsRepo.saveJob(updatedJob, false);

        await syncQueue.addToQueue('job', jobId, 'update', {
          status,
          version: job.version,
        });
      }

      set({ error: 'Update queued for sync' });
    }
  },

  startJob: async (jobId: string) => {
    const { jobs, currentJob } = get();
    const job = jobs.find((j) => j.id === jobId);

    if (!job) return;

    // Optimistic update
    const now = new Date().toISOString();
    const updatedJobs = jobs.map((j) =>
      j.id === jobId ? { ...j, status: 'in_progress' as JobStatus, actualStart: now } : j
    );
    set({ jobs: updatedJobs });

    if (currentJob?.id === jobId) {
      set({
        currentJob: {
          ...currentJob,
          status: 'in_progress',
          actualStart: now,
        },
      });
    }

    try {
      const updatedJob = await jobsApi.startJob(jobId, job.version);
      await jobsRepo.saveJob(updatedJob, true);

      set({
        jobs: jobs.map((j) => (j.id === jobId ? updatedJob : j)),
        currentJob:
          currentJob?.id === jobId
            ? { ...currentJob, ...updatedJob }
            : currentJob,
      });
    } catch  {
      // Queue for sync
      const updatedJob = { ...job, status: 'in_progress' as JobStatus, actualStart: now };
      await jobsRepo.saveJob(updatedJob, false);

      await syncQueue.addToQueue('job', jobId, 'update', {
        status: 'in_progress',
        actualStart: now,
        version: job.version,
      });

      set({ error: 'Update queued for sync' });
    }
  },

  setFilters: (newFilters: Partial<JobFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  clearCurrentJob: () => {
    set({ currentJob: null });
  },

  clearError: () => {
    set({ error: null });
  },

  loadJobsFromCache: async () => {
    const { filters } = get();
    const cachedJobs = await jobsRepo.getAllJobs();
    const filteredJobs = filters.status
      ? cachedJobs.filter((j) => filters.status!.includes(j.status))
      : cachedJobs;

    set({ jobs: filteredJobs });
  },

  getJobFromCache: async (jobId: string) => {
    return await jobsRepo.getJobById(jobId);
  },
}));
