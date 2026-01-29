import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import {
  getPresignedUploadUrl,
  generatePhotoKey,
  generateSignatureKey,
} from '../../storage/s3.js';
import { db } from '../../db/index.js';
import {
  uploadRequestSchema,
  confirmPhotoSchema,
  confirmSignatureSchema,
} from '../validators/upload.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';

// Setup upload directory for direct uploads (fallback when S3 is not accessible from mobile)
const uploadDir = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const router = Router();

router.use(authMiddleware);

// POST /api/upload/request - Get presigned upload URL
router.post(
  '/request',
  asyncHandler(async (req, res) => {
    console.log('[Upload] Request received:', req.body);
    const { jobId, type, filename } = uploadRequestSchema.parse(req.body);

    // Verify job exists
    const job = await db
      .selectFrom('jobs')
      .select('id')
      .where('id', '=', jobId)
      .executeTakeFirst();

    if (!job) {
      console.log('[Upload] Job not found:', jobId);
      throw new NotFoundError('Job');
    }

    const key =
      type === 'photo'
        ? generatePhotoKey(jobId, filename)
        : generateSignatureKey(jobId);

    const contentType = type === 'photo' ? 'image/jpeg' : 'image/png';

    const { url, expiresIn } = await getPresignedUploadUrl(key, contentType);

    console.log('[Upload] Generated presigned URL:', { key, url, expiresIn });
    res.json({ uploadUrl: url, key, expiresIn });
  })
);

// POST /api/photos - Confirm photo upload
router.post(
  '/photos',
  asyncHandler(async (req, res) => {
    const data = confirmPhotoSchema.parse(req.body);

    const photo = await db
      .insertInto('photos')
      .values({
        id: uuidv4(),
        job_id: data.jobId,
        storage_key: data.key,
        checklist_response_id: data.checklistResponseId ?? null,
        latitude: data.latitude?.toString() ?? null,
        longitude: data.longitude?.toString() ?? null,
        captured_at: data.capturedAt ? new Date(data.capturedAt) : new Date(),
        uploaded_at: new Date(),
        width: data.width ?? null,
        height: data.height ?? null,
        size_bytes: data.sizeBytes ?? null,
        mime_type: 'image/jpeg',
      })
      .returningAll()
      .executeTakeFirst();

    res.json({
      photo: {
        id: photo!.id,
        jobId: photo!.job_id,
        storageKey: photo!.storage_key,
        capturedAt: photo!.captured_at.toISOString(),
      },
    });
  })
);

// POST /api/signatures - Confirm signature upload
router.post(
  '/signatures',
  asyncHandler(async (req, res) => {
    const data = confirmSignatureSchema.parse(req.body);

    const signature = await db
      .insertInto('signatures')
      .values({
        id: uuidv4(),
        job_id: data.jobId,
        storage_key: data.key,
        checklist_response_id: data.checklistResponseId ?? null,
        signer_name: data.signerName ?? null,
        captured_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    res.json({
      signature: {
        id: signature!.id,
        jobId: signature!.job_id,
        storageKey: signature!.storage_key,
        signerName: signature!.signer_name,
        capturedAt: signature!.captured_at.toISOString(),
      },
    });
  })
);

// POST /api/upload/direct - Direct upload endpoint (bypasses S3 for dev)
// Accepts base64 encoded image data
router.post(
  '/direct',
  asyncHandler(async (req, res) => {
    console.log('[Upload] Direct upload request received');
    const { jobId, filename, base64Data } = req.body;

    if (!jobId || !filename || !base64Data) {
      res.status(400).json({ error: 'Missing required fields: jobId, filename, base64Data' });
      return;
    }

    // Verify job exists
    const job = await db
      .selectFrom('jobs')
      .select('id')
      .where('id', '=', jobId)
      .executeTakeFirst();

    if (!job) {
      throw new NotFoundError('Job');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `photos/${jobId}/${timestamp}_${sanitizedFilename}`;
    const filePath = path.join(uploadDir, `${timestamp}_${sanitizedFilename}`);

    // Decode base64 and save file
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    console.log('[Upload] Direct upload saved:', { key, filePath, size: buffer.length });

    res.json({
      success: true,
      key,
      filePath,
      size: buffer.length,
      // Return URL to access the file
      url: `/uploads/photos/${timestamp}_${sanitizedFilename}`,
    });
  })
);

// GET /api/upload/file/:filename - Serve uploaded files
router.get('/file/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  res.sendFile(filePath);
});

export default router;
