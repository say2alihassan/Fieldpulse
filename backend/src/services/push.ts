import admin from 'firebase-admin';
import { db } from '../db/index.js';
import { config } from '../utils/config.js';
import fs from 'fs';

interface FCMPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  icon?: string;
  badge?: number;
  sound?: string;
  tag?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
}

class PushService {
  private fcmInitialized = false;

  constructor() {
    this.initFCM();
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private initFCM(): void {
    const serviceAccountPath = config.firebase?.serviceAccountPath;

    if (!serviceAccountPath) {
      console.warn('⚠️  Firebase service account path not configured');
      return;
    }

    try {
      // Check if file exists
      if (!fs.existsSync(serviceAccountPath)) {
        console.error('❌ Firebase service account file not found at:', serviceAccountPath);
        return;
      }

      // Read and parse service account file
      const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountKey),
          projectId: serviceAccountKey.project_id,
        });
      }

      this.fcmInitialized = true;
      console.log('✅ Firebase Cloud Messaging initialized successfully');
      console.log('   Project ID:', serviceAccountKey.project_id);
    } catch (error) {
      console.error('❌ Failed to initialize FCM:', error);
    }
  }

  /**
   * Stringify all values in data object (FCM requires string values)
   */
  private stringifyDataValues(data?: Record<string, unknown>): Record<string, string> {
    if (!data) return {};

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        result[key] = '';
      } else if (typeof value === 'object') {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = String(value);
      }
    }
    return result;
  }

  /**
   * Send FCM push notification to a single token
   */
  async sendFCM(token: string, payload: FCMPayload): Promise<SendResult> {
    if (!this.fcmInitialized) {
      return { success: false, error: 'fcm_not_initialized', message: 'FCM not initialized' };
    }

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
      },
      data: this.stringifyDataValues(payload.data as Record<string, unknown>),
      android: {
        priority: 'high',
        notification: {
          icon: payload.icon || 'ic_notification',
          color: '#2196F3',
          sound: payload.sound || 'default',
          tag: payload.tag,
          channelId: 'fieldpulse-jobs',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: payload.badge,
            sound: payload.sound || 'default',
          },
        },
      },
    };

    try {
      const result = await admin.messaging().send(message);
      return { success: true, messageId: result };
    } catch (error: any) {
      console.error('FCM error:', error);

      if (error.code === 'messaging/registration-token-not-registered') {
        return { success: false, error: 'token_not_registered', message: 'FCM token is not registered' };
      } else if (error.code === 'messaging/invalid-registration-token') {
        return { success: false, error: 'invalid_token', message: 'FCM token is invalid' };
      }

      return { success: false, error: 'fcm_failed', message: error.message };
    }
  }

  /**
   * Send push notification to a user (all their devices)
   */
  async sendToUser(userId: string, payload: FCMPayload): Promise<{
    success: boolean;
    total: number;
    successful: number;
    failed: number;
    error?: string;
  }> {
    try {
      // Get user's FCM tokens
      const tokens = await db
        .selectFrom('device_tokens')
        .selectAll()
        .where('user_id', '=', userId)
        .execute();

      if (tokens.length === 0) {
        console.log(`[Push] No FCM tokens for user ${userId}`);
        return { success: false, total: 0, successful: 0, failed: 0, error: 'No FCM tokens registered' };
      }

      console.log(`[Push] Sending to ${tokens.length} device(s) for user ${userId}`);

      // Send to all tokens
      const results = await Promise.allSettled(
        tokens.map((tokenObj) => this.sendFCM(tokenObj.token, payload))
      );

      // Track results
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      const failed = results.length - successful;

      // Clean up invalid tokens
      const invalidTokenIds: string[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const error = result.value.error;
          if (error === 'token_not_registered' || error === 'invalid_token') {
            invalidTokenIds.push(tokens[index].id);
          }
        }
      });

      if (invalidTokenIds.length > 0) {
        console.log(`[Push] Removing ${invalidTokenIds.length} invalid token(s) for user ${userId}`);
        await db
          .deleteFrom('device_tokens')
          .where('id', 'in', invalidTokenIds)
          .execute();
      }

      // Update last_used_at for successful tokens
      const validTokenIds = tokens
        .filter((_, index) => {
          const result = results[index];
          return result.status === 'fulfilled' && result.value.success;
        })
        .map((t) => t.id);

      if (validTokenIds.length > 0) {
        await db
          .updateTable('device_tokens')
          .set({ last_used_at: new Date() })
          .where('id', 'in', validTokenIds)
          .execute();
      }

      console.log(`[Push] Results for user ${userId}: ${successful} successful, ${failed} failed`);

      return {
        success: successful > 0,
        total: tokens.length,
        successful,
        failed,
      };
    } catch (error: any) {
      console.error(`[Push] Error sending to user ${userId}:`, error);
      return { success: false, total: 0, successful: 0, failed: 0, error: error.message };
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    payload: FCMPayload,
    options: { batchSize?: number; batchDelay?: number } = {}
  ): Promise<{
    success: boolean;
    totalUsers: number;
    successful: number;
    failed: number;
  }> {
    const { batchSize = 10, batchDelay = 100 } = options;
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((userId) => this.sendToUser(userId, payload))
      );

      results.forEach((result) => {
        if (result.success) successful++;
        else failed++;
      });

      // Delay between batches
      if (i + batchSize < userIds.length && batchDelay) {
        await new Promise((resolve) => setTimeout(resolve, batchDelay));
      }
    }

    return {
      success: successful > 0,
      totalUsers: userIds.length,
      successful,
      failed,
    };
  }

  /**
   * Send push notification to a topic
   */
  async sendToTopic(topic: string, payload: FCMPayload): Promise<SendResult> {
    if (!this.fcmInitialized) {
      return { success: false, error: 'fcm_not_initialized', message: 'FCM not initialized' };
    }

    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
      },
      data: this.stringifyDataValues(payload.data as Record<string, unknown>),
    };

    try {
      const result = await admin.messaging().send(message);
      return { success: true, messageId: result };
    } catch (error: any) {
      console.error('Topic notification error:', error);
      return { success: false, error: 'topic_failed', message: error.message };
    }
  }

  /**
   * Register a device token for a user
   */
  async registerToken(
    userId: string,
    data: {
      token: string;
      platform: 'ios' | 'android';
      deviceId: string;
      deviceName?: string;
      appVersion?: string;
    }
  ): Promise<{ success: boolean; tokenCount: number }> {
    try {
      // Check if token already exists
      const existing = await db
        .selectFrom('device_tokens')
        .selectAll()
        .where((eb) =>
          eb.or([
            eb('token', '=', data.token),
            eb.and([
              eb('user_id', '=', userId),
              eb('device_id', '=', data.deviceId),
            ]),
          ])
        )
        .executeTakeFirst();

      if (existing) {
        // Update existing token
        await db
          .updateTable('device_tokens')
          .set({
            token: data.token,
            platform: data.platform,
            device_name: data.deviceName,
            app_version: data.appVersion,
            last_used_at: new Date(),
          })
          .where('id', '=', existing.id)
          .execute();
      } else {
        // Insert new token
        await db
          .insertInto('device_tokens')
          .values({
            id: crypto.randomUUID(),
            user_id: userId,
            token: data.token,
            platform: data.platform,
            device_id: data.deviceId,
            device_name: data.deviceName || 'Unknown Device',
            app_version: data.appVersion || '1.0.0',
            created_at: new Date(),
            last_used_at: new Date(),
          })
          .execute();
      }

      // Get token count
      const tokens = await db
        .selectFrom('device_tokens')
        .select(db.fn.count('id').as('count'))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      console.log(`[Push] Token registered for user ${userId} on ${data.platform}`);

      return {
        success: true,
        tokenCount: Number(tokens?.count || 0),
      };
    } catch (error: any) {
      console.error('[Push] Register token error:', error);
      throw error;
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterToken(
    userId: string,
    data: { token?: string; deviceId?: string }
  ): Promise<{ success: boolean; removedCount: number }> {
    try {
      let query = db.deleteFrom('device_tokens').where('user_id', '=', userId);

      if (data.token) {
        query = query.where('token', '=', data.token);
      } else if (data.deviceId) {
        query = query.where('device_id', '=', data.deviceId);
      } else {
        throw new Error('Either token or deviceId is required');
      }

      const result = await query.execute();

      console.log(`[Push] Token unregistered for user ${userId}`);

      return {
        success: true,
        removedCount: Number(result.length) || 1,
      };
    } catch (error: any) {
      console.error('[Push] Unregister token error:', error);
      throw error;
    }
  }

  /**
   * Get user's registered devices
   */
  async getUserDevices(userId: string): Promise<
    Array<{
      deviceId: string;
      deviceName: string;
      platform: string;
      appVersion: string;
      createdAt: Date;
      lastUsedAt: Date | null;
    }>
  > {
    const tokens = await db
      .selectFrom('device_tokens')
      .select(['device_id', 'device_name', 'platform', 'app_version', 'created_at', 'last_used_at'])
      .where('user_id', '=', userId)
      .execute();

    return tokens.map((t) => ({
      deviceId: t.device_id || '',
      deviceName: t.device_name || 'Unknown Device',
      platform: t.platform,
      appVersion: t.app_version || '1.0.0',
      createdAt: t.created_at,
      lastUsedAt: t.last_used_at,
    }));
  }

  /**
   * Get FCM initialization status
   */
  getStatus(): { initialized: boolean; serviceAccountConfigured: boolean } {
    return {
      initialized: this.fcmInitialized,
      serviceAccountConfigured: !!config.firebase?.serviceAccountPath,
    };
  }

  /**
   * Create job-specific notification payloads
   */
  createJobAssignedPayload(jobNumber: string, jobTitle: string, jobId: string): FCMPayload {
    return {
      title: 'New Job Assigned',
      body: `Job #${jobNumber}: ${jobTitle}`,
      data: {
        type: 'job_assigned',
        jobId,
        jobNumber,
      },
      tag: 'job_assigned',
    };
  }

  createJobUpdatedPayload(jobNumber: string, jobTitle: string, jobId: string): FCMPayload {
    return {
      title: 'Job Updated',
      body: `Job #${jobNumber}: ${jobTitle} has been updated`,
      data: {
        type: 'job_updated',
        jobId,
        jobNumber,
      },
      tag: 'job_updated',
    };
  }

  createJobReminderPayload(
    jobNumber: string,
    jobTitle: string,
    jobId: string,
    scheduledTime: string
  ): FCMPayload {
    return {
      title: 'Job Reminder',
      body: `Job #${jobNumber}: ${jobTitle} scheduled for ${scheduledTime}`,
      data: {
        type: 'job_reminder',
        jobId,
        jobNumber,
      },
      tag: 'job_reminder',
    };
  }

  createJobCancelledPayload(jobNumber: string, jobTitle: string): FCMPayload {
    return {
      title: 'Job Cancelled',
      body: `Job #${jobNumber}: ${jobTitle} has been cancelled`,
      data: {
        type: 'job_cancelled',
        jobNumber,
      },
      tag: 'job_cancelled',
    };
  }
}

export const pushService = new PushService();
