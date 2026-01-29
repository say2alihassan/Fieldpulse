import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Jobs API', () => {
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

  // Mock jobs data
  const mockJobs = Array.from({ length: 25 }, (_, i) => ({
    id: `job-${i + 1}`,
    jobNumber: `JOB-202400${String(i + 1).padStart(2, '0')}`,
    customerId: 'customer-1',
    assignedTo: 'user-1',
    status: i < 10 ? 'pending' : i < 20 ? 'in_progress' : 'completed',
    priority: 'normal',
    title: `Job ${i + 1}`,
    description: `Description for job ${i + 1}`,
    scheduledStart: new Date(2024, 0, i + 1).toISOString(),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // GET /api/jobs
  app.get('/api/jobs', (req, res) => {
    const { status, search, cursor, limit = '20' } = req.query;
    let filtered = [...mockJobs];

    if (status) {
      const statuses = (status as string).split(',');
      filtered = filtered.filter((j) => statuses.includes(j.status));
    }

    if (search) {
      const query = (search as string).toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(query) ||
          j.jobNumber.toLowerCase().includes(query)
      );
    }

    const limitNum = parseInt(limit as string, 10);
    let startIndex = 0;
    if (cursor) {
      startIndex = filtered.findIndex((j) => j.id === cursor) + 1;
    }

    const data = filtered.slice(startIndex, startIndex + limitNum);
    const hasMore = startIndex + limitNum < filtered.length;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    res.json({ data, nextCursor, hasMore });
  });

  // GET /api/jobs/:id
  app.get('/api/jobs/:id', (req, res) => {
    const job = mockJobs.find((j) => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found' });
    }
    res.json({
      ...job,
      customer: {
        id: 'customer-1',
        name: 'John Smith',
        phone: '(555) 123-4567',
        addressLine1: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
      },
      checklistTemplate: {
        id: 'template-1',
        name: 'Service Checklist',
        fields: [],
      },
      responses: [],
    });
  });

  // PATCH /api/jobs/:id
  app.patch('/api/jobs/:id', (req, res) => {
    const job = mockJobs.find((j) => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found' });
    }

    const { version } = req.body;
    if (version !== job.version) {
      return res.status(409).json({
        code: 'VERSION_CONFLICT',
        message: 'Job has been modified',
        details: { expectedVersion: version, currentVersion: job.version },
      });
    }

    const updatedJob = { ...job, ...req.body, version: job.version + 1 };
    res.json({ job: updatedJob });
  });

  describe('GET /api/jobs', () => {
    it('returns paginated jobs list', async () => {
      const res = await request(app)
        .get('/api/jobs?limit=10')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
      expect(res.body).toHaveProperty('nextCursor');
      expect(res.body.hasMore).toBe(true);
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/jobs?status=pending')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.data.every((j: any) => j.status === 'pending')).toBe(true);
    });

    it('filters by multiple statuses', async () => {
      const res = await request(app)
        .get('/api/jobs?status=pending,in_progress')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(
        res.body.data.every((j: any) =>
          ['pending', 'in_progress'].includes(j.status)
        )
      ).toBe(true);
    });

    it('searches by title', async () => {
      const res = await request(app)
        .get('/api/jobs?search=Job 1')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(
        res.body.data.every((j: any) => j.title.includes('Job 1'))
      ).toBe(true);
    });

    it('supports cursor pagination', async () => {
      const firstPage = await request(app)
        .get('/api/jobs?limit=5')
        .set('Authorization', 'Bearer mock-token');

      expect(firstPage.body.data).toHaveLength(5);
      expect(firstPage.body.nextCursor).toBeDefined();

      const secondPage = await request(app)
        .get(`/api/jobs?limit=5&cursor=${firstPage.body.nextCursor}`)
        .set('Authorization', 'Bearer mock-token');

      expect(secondPage.body.data).toHaveLength(5);
      expect(secondPage.body.data[0].id).not.toBe(firstPage.body.data[0].id);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/jobs');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('returns job with details', async () => {
      const res = await request(app)
        .get('/api/jobs/job-1')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('job-1');
      expect(res.body).toHaveProperty('customer');
      expect(res.body).toHaveProperty('checklistTemplate');
      expect(res.body).toHaveProperty('responses');
    });

    it('returns 404 for non-existent job', async () => {
      const res = await request(app)
        .get('/api/jobs/non-existent')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/jobs/:id', () => {
    it('updates job status', async () => {
      const res = await request(app)
        .patch('/api/jobs/job-1')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'in_progress', version: 1 });

      expect(res.status).toBe(200);
      expect(res.body.job.status).toBe('in_progress');
      expect(res.body.job.version).toBe(2);
    });

    it('returns 409 on version conflict', async () => {
      const res = await request(app)
        .patch('/api/jobs/job-1')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'in_progress', version: 99 });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('VERSION_CONFLICT');
      expect(res.body.details.expectedVersion).toBe(99);
      expect(res.body.details.currentVersion).toBe(1);
    });

    it('returns 404 for non-existent job', async () => {
      const res = await request(app)
        .patch('/api/jobs/non-existent')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'in_progress', version: 1 });

      expect(res.status).toBe(404);
    });
  });
});
