import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../../db/index.js';
import type { Job } from '../../types/index.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

interface SyncPullRequest {
  lastSyncedAt: string;
  entities: string[];
}

interface SyncPullResponse {
  jobs?: {
    updated: Job[];
    deleted: string[];
  };
  syncedAt: string;
}

function rowToJob(row: {
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
}): Job {
  return {
    id: row.id,
    jobNumber: row.job_number,
    customerId: row.customer_id,
    assignedTo: row.assigned_to,
    status: row.status as Job['status'],
    priority: row.priority as Job['priority'],
    title: row.title,
    description: row.description,
    scheduledStart: row.scheduled_start?.toISOString() ?? null,
    scheduledEnd: row.scheduled_end?.toISOString() ?? null,
    actualStart: row.actual_start?.toISOString() ?? null,
    actualEnd: row.actual_end?.toISOString() ?? null,
    checklistTemplateId: row.checklist_template_id,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/**
 * POST /api/sync/pull
 * Pull changes from server since last sync
 */
router.post('/pull', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lastSyncedAt, entities } = req.body as SyncPullRequest;
    const userId = req.user!.id;
    const syncTime = new Date();
    const lastSync = new Date(lastSyncedAt);

    const response: SyncPullResponse = {
      syncedAt: syncTime.toISOString(),
    };

    // Pull jobs if requested
    if (entities.includes('jobs')) {
      // Get jobs updated since last sync for this user
      const updatedJobs = await db
        .selectFrom('jobs')
        .selectAll()
        .where('assigned_to', '=', userId)
        .where('updated_at', '>', lastSync)
        .execute();

      response.jobs = {
        updated: updatedJobs.map(rowToJob),
        deleted: [], // TODO: Implement soft delete tracking if needed
      };
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sync/push
 * Push local changes to server (batch)
 */
router.post('/push', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { changes } = req.body as {
      changes: Array<{
        entityType: string;
        entityId: string;
        action: 'create' | 'update' | 'delete';
        data: Record<string, unknown>;
        version?: number;
      }>;
    };

    const results: Array<{
      entityType: string;
      entityId: string;
      success: boolean;
      error?: string;
      serverVersion?: number;
    }> = [];

    for (const change of changes) {
      try {
        if (change.entityType === 'job' && change.action === 'update') {
          const result = await db
            .updateTable('jobs')
            .set({
              ...(change.data.status && { status: change.data.status as string }),
              ...(change.data.actualStart !== undefined && {
                actual_start: change.data.actualStart
                  ? new Date(change.data.actualStart as string)
                  : null,
              }),
              ...(change.data.actualEnd !== undefined && {
                actual_end: change.data.actualEnd
                  ? new Date(change.data.actualEnd as string)
                  : null,
              }),
              updated_at: new Date(),
            })
            .where('id', '=', change.entityId)
            .where('version', '=', change.version ?? 0)
            .returning(['version'])
            .executeTakeFirst();

          if (result) {
            results.push({
              entityType: change.entityType,
              entityId: change.entityId,
              success: true,
              serverVersion: result.version,
            });
          } else {
            // Version conflict
            const current = await db
              .selectFrom('jobs')
              .select(['version'])
              .where('id', '=', change.entityId)
              .executeTakeFirst();

            results.push({
              entityType: change.entityType,
              entityId: change.entityId,
              success: false,
              error: 'VERSION_CONFLICT',
              serverVersion: current?.version,
            });
          }
        }
      } catch (error) {
        results.push({
          entityType: change.entityType,
          entityId: change.entityId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({ results, syncedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

export default router;
