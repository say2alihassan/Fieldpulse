import { Router } from 'express';
import { getJobs, getJobById, createJob, updateJob, completeJob } from '../../services/jobs.js';
import { batchUpsertResponses, markResponsesAsSubmitted } from '../../services/checklist.js';
import {
  jobFiltersSchema,
  createJobSchema,
  updateJobSchema,
  completeJobSchema,
} from '../validators/jobs.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest, FieldType } from '../../types/index.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/jobs
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const filters = jobFiltersSchema.parse(req.query);

    const result = await getJobs(
      {
        status: filters.status,
        search: filters.search,
        assignedTo: authReq.user.role === 'technician' ? authReq.user.id : undefined,
      },
      {
        cursor: filters.cursor,
        limit: filters.limit,
      }
    );

    res.json(result);
  })
);

// POST /api/jobs
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const data = createJobSchema.parse(req.body);

    const job = await createJob(data, authReq.user.id);

    res.status(201).json({ job });
  })
);

// GET /api/jobs/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const job = await getJobById(req.params.id);
    res.json(job);
  })
);

// PATCH /api/jobs/:id
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const updates = updateJobSchema.parse(req.body);

    const job = await updateJob(
      req.params.id,
      {
        status: updates.status,
        priority: updates.priority,
        assignedTo: updates.assignedTo,
        actualStart: updates.actualStart,
        actualEnd: updates.actualEnd,
      },
      updates.version,
      authReq.user.id
    );

    res.json({ job });
  })
);

// POST /api/jobs/:id/complete
router.post(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const { responses, version } = completeJobSchema.parse(req.body);

    // Get job to get template for field types
    const jobDetails = await getJobById(req.params.id);

    // Build field type map from template
    const fieldTypeMap = new Map<string, FieldType>();
    if (jobDetails.checklistTemplate) {
      for (const field of jobDetails.checklistTemplate.fields) {
        fieldTypeMap.set(field.id, field.type);
      }
    }

    // Save all responses
    if (responses.length > 0) {
      await batchUpsertResponses(
        req.params.id,
        responses.map((r) => ({
          fieldId: r.fieldId,
          fieldType: fieldTypeMap.get(r.fieldId) || 'text',
          value: r.value,
          isDraft: false,
        }))
      );
    }

    // Mark all drafts as submitted
    await markResponsesAsSubmitted(req.params.id);

    // Complete the job
    const job = await completeJob(req.params.id, version);

    res.json({ job });
  })
);

export default router;
