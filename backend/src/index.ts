import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './utils/config.js';
import { rateLimitMiddleware } from './api/middleware/rateLimit.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import authRoutes from './api/routes/auth.js';
import jobsRoutes from './api/routes/jobs.js';
import checklistRoutes from './api/routes/checklist.js';
import uploadRoutes from './api/routes/upload.js';
import notificationRoutes from './api/routes/notification.js';
import syncRoutes from './api/routes/sync.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased for base64 image uploads

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting
app.use(rateLimitMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/jobs', checklistRoutes); // Mounted under /api/jobs/:jobId/checklist
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sync', syncRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
