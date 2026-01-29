import { Router } from 'express';
import { pushService } from '../../services/push.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  subscribePushSchema,
  unsubscribePushSchema,
  updatePushSettingsSchema,
} from '../validators/notification.js';
import type { AuthenticatedRequest } from '../../types/index.js';
import { db } from '../../db/index.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============ Push Notification Routes ============

/**
 * POST /api/notifications/push/subscribe
 * Subscribe to push notifications (register FCM token)
 */
router.post(
  '/push/subscribe',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const data = subscribePushSchema.parse(req.body);
    const userId = authReq.user.id;

    const result = await pushService.registerToken(userId, data);

    console.log(`[Push] Token registered for user ${userId} on ${data.platform}`);

    res.status(200).json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      data: {
        tokenCount: result.tokenCount,
        platform: data.platform,
      },
    });
  })
);

/**
 * POST /api/notifications/push/unsubscribe
 * Unsubscribe from push notifications (remove FCM token)
 */
router.post(
  '/push/unsubscribe',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const data = unsubscribePushSchema.parse(req.body);
    const userId = authReq.user.id;

    const result = await pushService.unregisterToken(userId, data);

    console.log(`[Push] Token unregistered for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
      data: {
        removedCount: result.removedCount,
      },
    });
  })
);

/**
 * GET /api/notifications/push/settings
 * Get push notification settings
 */
router.get(
  '/push/settings',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const devices = await pushService.getUserDevices(userId);

    res.status(200).json({
      success: true,
      data: {
        enabled: true,
        devices,
      },
    });
  })
);

/**
 * PUT /api/notifications/push/settings
 * Update push notification settings
 */
router.put(
  '/push/settings',
  asyncHandler(async (req, res) => {
    const data = updatePushSettingsSchema.parse(req.body);

    res.status(200).json({
      success: true,
      message: 'Push notification settings updated',
      data: {
        enabled: data.enabled ?? true,
        notificationTypes: data.notificationTypes ?? {},
      },
    });
  })
);

/**
 * GET /api/notifications/push/status
 * Get push notification service status
 */
router.get(
  '/push/status',
  asyncHandler(async (_req, res) => {
    const status = pushService.getStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  })
);

/**
 * POST /api/notifications/push/test
 * Send a test push notification (for debugging)
 */
router.post(
  '/push/test',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const result = await pushService.sendToUser(userId, {
      title: 'Test Notification',
      body: 'This is a test notification from FieldPulse',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    res.status(200).json({
      success: result.success,
      message: result.success
        ? 'Test notification sent successfully'
        : 'Failed to send test notification',
      data: result,
    });
  })
);

/**
 * POST /api/notifications/push/test-job
 * Send a test push notification with a real job (for testing deep links)
 */
router.post(
  '/push/test-job',
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const { jobId, type = 'job_assigned' } = req.body;

    // Get a job - either specified or the first one assigned to user
    let job;
    if (jobId) {
      job = await db
        .selectFrom('jobs')
        .selectAll()
        .where('id', '=', jobId)
        .executeTakeFirst();
    } else {
      job = await db
        .selectFrom('jobs')
        .selectAll()
        .where('assigned_to', '=', userId)
        .orderBy('scheduled_start', 'desc')
        .limit(1)
        .executeTakeFirst();
    }

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'No job found. Please specify a jobId or ensure you have jobs assigned.',
      });
      return;
    }

    // Create appropriate payload based on type
    let payload;
    switch (type) {
      case 'job_updated':
        payload = pushService.createJobUpdatedPayload(
          job.job_number,
          job.title,
          job.id
        );
        break;
      case 'job_reminder':
        const scheduledTime = job.scheduled_start
          ? new Date(job.scheduled_start).toLocaleString()
          : 'soon';
        payload = pushService.createJobReminderPayload(
          job.job_number,
          job.title,
          job.id,
          scheduledTime
        );
        break;
      case 'job_cancelled':
        payload = pushService.createJobCancelledPayload(job.job_number, job.title);
        break;
      case 'job_assigned':
      default:
        payload = pushService.createJobAssignedPayload(
          job.job_number,
          job.title,
          job.id
        );
        break;
    }

    const result = await pushService.sendToUser(userId, payload);

    res.status(200).json({
      success: result.success,
      message: result.success
        ? `Test ${type} notification sent for Job #${job.job_number}`
        : 'Failed to send test notification',
      data: {
        ...result,
        job: {
          id: job.id,
          jobNumber: job.job_number,
          title: job.title,
        },
        notificationType: type,
      },
    });
  })
);

export default router;
