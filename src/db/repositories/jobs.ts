import { getDatabase } from '../index';
import type { Job } from '../../types';

interface LocalJob {
  id: string;
  data: string;
  server_version: number | null;
  local_version: number;
  is_dirty: number;
  last_synced_at: number | null;
  created_at: number;
}

export async function getAllJobs(): Promise<Job[]> {
  const db = getDatabase();
  const result = await db.execute('SELECT * FROM jobs ORDER BY created_at DESC');

  return result.rows.map((row) => {
    const localJob = row as unknown as LocalJob;
    return JSON.parse(localJob.data) as Job;
  });
}

export async function getJobsByStatus(statuses: string[]): Promise<Job[]> {
  const db = getDatabase();
  const result = await db.execute('SELECT * FROM jobs ORDER BY created_at DESC');

  return result.rows
    .map((row) => {
      const localJob = row as unknown as LocalJob;
      return JSON.parse(localJob.data) as Job;
    })
    .filter((job) => statuses.includes(job.status));
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const db = getDatabase();
  const result = await db.execute('SELECT * FROM jobs WHERE id = ?', [jobId]);

  if (result.rows.length === 0) {
    return null;
  }

  const localJob = result.rows[0] as unknown as LocalJob;
  return JSON.parse(localJob.data) as Job;
}

export async function saveJob(job: Job, fromServer = false): Promise<void> {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  const existing = await db.execute('SELECT * FROM jobs WHERE id = ?', [job.id]);

  if (existing.rows.length > 0) {
    const localJob = existing.rows[0] as unknown as LocalJob;

    if (fromServer) {
      // Server update - only update if not dirty or server version is newer
      if (!localJob.is_dirty || job.version > (localJob.server_version ?? 0)) {
        await db.execute(
          `UPDATE jobs SET data = ?, server_version = ?, last_synced_at = ?, is_dirty = 0
           WHERE id = ?`,
          [JSON.stringify(job), job.version, now, job.id]
        );
      }
    } else {
      // Local update
      await db.execute(
        `UPDATE jobs SET data = ?, local_version = local_version + 1, is_dirty = 1
         WHERE id = ?`,
        [JSON.stringify(job), job.id]
      );
    }
  } else {
    // Insert new job
    await db.execute(
      `INSERT INTO jobs (id, data, server_version, local_version, is_dirty, last_synced_at, created_at)
       VALUES (?, ?, ?, 1, ?, ?, ?)`,
      [
        job.id,
        JSON.stringify(job),
        fromServer ? job.version : null,
        fromServer ? 0 : 1,
        fromServer ? now : null,
        now,
      ]
    );
  }
}

export async function saveJobs(jobs: Job[], fromServer = false): Promise<void> {
  const db = getDatabase();
  await db.transaction(async (tx) => {
    const now = Math.floor(Date.now() / 1000);

    for (const job of jobs) {
      const existing = await tx.execute('SELECT * FROM jobs WHERE id = ?', [job.id]);

      if (existing.rows.length > 0) {
        const localJob = existing.rows[0] as unknown as LocalJob;

        if (fromServer) {
          if (!localJob.is_dirty || job.version > (localJob.server_version ?? 0)) {
            await tx.execute(
              `UPDATE jobs SET data = ?, server_version = ?, last_synced_at = ?, is_dirty = 0
               WHERE id = ?`,
              [JSON.stringify(job), job.version, now, job.id]
            );
          }
        } else {
          await tx.execute(
            `UPDATE jobs SET data = ?, local_version = local_version + 1, is_dirty = 1
             WHERE id = ?`,
            [JSON.stringify(job), job.id]
          );
        }
      } else {
        await tx.execute(
          `INSERT INTO jobs (id, data, server_version, local_version, is_dirty, last_synced_at, created_at)
           VALUES (?, ?, ?, 1, ?, ?, ?)`,
          [
            job.id,
            JSON.stringify(job),
            fromServer ? job.version : null,
            fromServer ? 0 : 1,
            fromServer ? now : null,
            now,
          ]
        );
      }
    }
  });
}

export async function markJobSynced(jobId: string, serverVersion: number): Promise<void> {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  await db.execute(
    `UPDATE jobs SET server_version = ?, is_dirty = 0, last_synced_at = ?
     WHERE id = ?`,
    [serverVersion, now, jobId]
  );
}

export async function getDirtyJobs(): Promise<Array<{ job: Job; localVersion: number }>> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM jobs WHERE is_dirty = 1 ORDER BY created_at ASC'
  );

  return result.rows.map((row) => {
    const localJob = row as unknown as LocalJob;
    return {
      job: JSON.parse(localJob.data) as Job,
      localVersion: localJob.local_version,
    };
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM jobs WHERE id = ?', [jobId]);
}

export async function deleteAllJobs(): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM jobs');
}

export async function searchJobs(query: string): Promise<Job[]> {
  const jobs = await getAllJobs();
  const lowerQuery = query.toLowerCase();

  return jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(lowerQuery) ||
      job.jobNumber.toLowerCase().includes(lowerQuery) ||
      job.description?.toLowerCase().includes(lowerQuery)
  );
}
