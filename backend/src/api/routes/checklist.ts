import { Router } from 'express';
import { getJobById } from '../../services/jobs.js';
import { upsertResponse, batchUpsertResponses } from '../../services/checklist.js';
import { updateResponseSchema, batchResponsesSchema } from '../validators/checklist.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import type { FieldType } from '../../types/index.js';

const router = Router();

router.use(authMiddleware);

// PUT /api/jobs/:jobId/checklist/:fieldId
router.put(
  '/:jobId/checklist/:fieldId',
  asyncHandler(async (req, res) => {
    const { jobId, fieldId } = req.params;
    const { value, isDraft, version } = updateResponseSchema.parse(req.body);

    // Get job to determine field type
    const job = await getJobById(jobId);

    let fieldType: FieldType = 'text';
    if (job.checklistTemplate) {
      const field = job.checklistTemplate.fields.find((f) => f.id === fieldId);
      if (field) {
        fieldType = field.type;
      } else {
        throw new NotFoundError('Field');
      }
    }

    const response = await upsertResponse(
      jobId,
      fieldId,
      fieldType,
      value,
      isDraft,
      version
    );

    res.json({ response });
  })
);

// POST /api/jobs/:jobId/checklist/batch
router.post(
  '/:jobId/checklist/batch',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const { responses } = batchResponsesSchema.parse(req.body);

    // Get job to determine field types
    const job = await getJobById(jobId);

    const fieldTypeMap = new Map<string, FieldType>();
    if (job.checklistTemplate) {
      for (const field of job.checklistTemplate.fields) {
        fieldTypeMap.set(field.id, field.type);
      }
    }

    const result = await batchUpsertResponses(
      jobId,
      responses.map((r) => ({
        fieldId: r.fieldId,
        fieldType: fieldTypeMap.get(r.fieldId) || 'text',
        value: r.value,
        isDraft: r.isDraft,
      }))
    );

    res.json({ responses: result });
  })
);

export default router;
