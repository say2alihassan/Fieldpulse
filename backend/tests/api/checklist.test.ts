import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Checklist API', () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing token' });
    }
    (req as any).user = { id: 'user-1', email: 'tech@fieldpulse.com', role: 'technician' };
    next();
  });

  // Mock responses storage
  const mockResponses: Record<string, any[]> = {
    'job-1': [],
  };

  // PUT /api/jobs/:jobId/checklist/:fieldId
  app.put('/api/jobs/:jobId/checklist/:fieldId', (req, res) => {
    const { jobId, fieldId } = req.params;
    const { value, isDraft } = req.body;

    if (!mockResponses[jobId]) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found' });
    }

    const existingIndex = mockResponses[jobId].findIndex((r) => r.fieldId === fieldId);
    const response = {
      id: `response-${jobId}-${fieldId}`,
      jobId,
      fieldId,
      fieldType: 'text',
      value,
      isDraft,
      version: existingIndex >= 0 ? mockResponses[jobId][existingIndex].version + 1 : 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      mockResponses[jobId][existingIndex] = response;
    } else {
      mockResponses[jobId].push(response);
    }

    res.json({ response });
  });

  // POST /api/jobs/:jobId/checklist/batch
  app.post('/api/jobs/:jobId/checklist/batch', (req, res) => {
    const { jobId } = req.params;
    const { responses } = req.body;

    if (!mockResponses[jobId]) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found' });
    }

    if (!Array.isArray(responses)) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Responses must be an array',
      });
    }

    const savedResponses = responses.map((r: any) => ({
      id: `response-${jobId}-${r.fieldId}`,
      jobId,
      fieldId: r.fieldId,
      fieldType: 'text',
      value: r.value,
      isDraft: r.isDraft ?? true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    mockResponses[jobId] = savedResponses;

    res.json({ responses: savedResponses });
  });

  // POST /api/jobs/:jobId/complete
  app.post('/api/jobs/:jobId/complete', (req, res) => {
    const { jobId } = req.params;
    const { responses, version } = req.body;

    if (!mockResponses[jobId]) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found' });
    }

    if (!version) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Version is required',
      });
    }

    // Save responses as non-draft
    const savedResponses = responses.map((r: any) => ({
      id: `response-${jobId}-${r.fieldId}`,
      jobId,
      fieldId: r.fieldId,
      value: r.value,
      isDraft: false,
      version: 1,
    }));

    mockResponses[jobId] = savedResponses;

    res.json({
      job: {
        id: jobId,
        status: 'completed',
        actualEnd: new Date().toISOString(),
        version: version + 1,
      },
    });
  });

  describe('PUT /api/jobs/:jobId/checklist/:fieldId', () => {
    it('creates a new response', async () => {
      const res = await request(app)
        .put('/api/jobs/job-1/checklist/field-1')
        .set('Authorization', 'Bearer mock-token')
        .send({ value: 'Test value', isDraft: true });

      expect(res.status).toBe(200);
      expect(res.body.response.fieldId).toBe('field-1');
      expect(res.body.response.value).toBe('Test value');
      expect(res.body.response.isDraft).toBe(true);
      expect(res.body.response.version).toBe(1);
    });

    it('updates existing response and increments version', async () => {
      // First create
      await request(app)
        .put('/api/jobs/job-1/checklist/field-2')
        .set('Authorization', 'Bearer mock-token')
        .send({ value: 'Initial', isDraft: true });

      // Then update
      const res = await request(app)
        .put('/api/jobs/job-1/checklist/field-2')
        .set('Authorization', 'Bearer mock-token')
        .send({ value: 'Updated', isDraft: false });

      expect(res.status).toBe(200);
      expect(res.body.response.value).toBe('Updated');
      expect(res.body.response.isDraft).toBe(false);
      expect(res.body.response.version).toBe(2);
    });

    it('returns 404 for non-existent job', async () => {
      const res = await request(app)
        .put('/api/jobs/non-existent/checklist/field-1')
        .set('Authorization', 'Bearer mock-token')
        .send({ value: 'Test', isDraft: true });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/jobs/:jobId/checklist/batch', () => {
    it('saves multiple responses at once', async () => {
      const res = await request(app)
        .post('/api/jobs/job-1/checklist/batch')
        .set('Authorization', 'Bearer mock-token')
        .send({
          responses: [
            { fieldId: 'notes', value: 'Test notes', isDraft: false },
            { fieldId: 'rating', value: 5, isDraft: false },
            { fieldId: 'status', value: 'completed', isDraft: false },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.responses).toHaveLength(3);
      expect(res.body.responses[0].fieldId).toBe('notes');
      expect(res.body.responses[1].fieldId).toBe('rating');
      expect(res.body.responses[2].fieldId).toBe('status');
    });

    it('returns 400 for invalid responses format', async () => {
      const res = await request(app)
        .post('/api/jobs/job-1/checklist/batch')
        .set('Authorization', 'Bearer mock-token')
        .send({ responses: 'not-an-array' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/jobs/:jobId/complete', () => {
    it('completes job with responses', async () => {
      const res = await request(app)
        .post('/api/jobs/job-1/complete')
        .set('Authorization', 'Bearer mock-token')
        .send({
          responses: [
            { fieldId: 'notes', value: 'Work completed' },
            { fieldId: 'signature', value: { uri: 'file://sig.png' } },
          ],
          version: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.job.status).toBe('completed');
      expect(res.body.job.version).toBe(2);
      expect(res.body.job.actualEnd).toBeDefined();
    });

    it('returns 400 if version is missing', async () => {
      const res = await request(app)
        .post('/api/jobs/job-1/complete')
        .set('Authorization', 'Bearer mock-token')
        .send({
          responses: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for non-existent job', async () => {
      const res = await request(app)
        .post('/api/jobs/non-existent/complete')
        .set('Authorization', 'Bearer mock-token')
        .send({ responses: [], version: 1 });

      expect(res.status).toBe(404);
    });
  });
});
