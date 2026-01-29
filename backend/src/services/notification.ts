import { pushService } from './push.js';

// Notification types specific to FieldPulse
type NotificationType =
  | 'job_assigned'
  | 'job_updated'
  | 'job_reminder'
  | 'job_cancelled'
  | 'checklist_submitted'
  | 'sync_conflict'
  | 'system';

interface NotificationTemplate {
  title: string;
  message: string;
}

interface SendNotificationData {
  type: NotificationType;
  userId: string;
  jobId?: string;
  jobNumber?: string;
  jobTitle?: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private templates: Map<NotificationType, NotificationTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates(): void {
    this.templates.set('job_assigned', {
      title: 'New Job Assigned',
      message: 'Job #{{jobNumber}}: {{jobTitle}} has been assigned to you',
    });

    this.templates.set('job_updated', {
      title: 'Job Updated',
      message: 'Job #{{jobNumber}}: {{jobTitle}} has been updated',
    });

    this.templates.set('job_reminder', {
      title: 'Job Reminder',
      message: 'Job #{{jobNumber}}: {{jobTitle}} is scheduled for {{scheduledTime}}',
    });

    this.templates.set('job_cancelled', {
      title: 'Job Cancelled',
      message: 'Job #{{jobNumber}}: {{jobTitle}} has been cancelled',
    });

    this.templates.set('checklist_submitted', {
      title: 'Checklist Submitted',
      message: 'Checklist for Job #{{jobNumber}} has been submitted',
    });

    this.templates.set('sync_conflict', {
      title: 'Sync Conflict',
      message: 'A conflict was detected while syncing {{entityType}}',
    });

    this.templates.set('system', {
      title: 'System Notification',
      message: '{{message}}',
    });
  }

  /**
   * Process template placeholders
   */
  private processTemplate(
    template: NotificationTemplate,
    data: Record<string, unknown>
  ): { title: string; message: string } {
    let title = template.title;
    let message = template.message;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return { title, message };
  }

  /**
   * Send a push notification (no database storage)
   */
  async sendNotification(notificationData: SendNotificationData): Promise<{ success: boolean }> {
    const { type, userId, jobId, jobNumber, jobTitle, data = {} } = notificationData;

    try {
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Merge job data with custom data
      const templateData = { jobId, jobNumber, jobTitle, ...data };
      const { title, message } = this.processTemplate(template, templateData);

      // Send push notification directly
      const result = await pushService.sendToUser(userId, {
        title,
        body: message,
        data: {
          type,
          jobId: jobId || '',
          jobNumber: jobNumber || '',
          ...data,
        },
        tag: type,
      });

      return { success: result.success };
    } catch (error) {
      console.error('Failed to send notification:', error);
      return { success: false };
    }
  }

  // ============ Convenience methods for job notifications ============

  /**
   * Notify user of job assignment
   */
  async notifyJobAssigned(
    userId: string,
    jobId: string,
    jobNumber: string,
    jobTitle: string
  ): Promise<{ success: boolean }> {
    return this.sendNotification({
      type: 'job_assigned',
      userId,
      jobId,
      jobNumber,
      jobTitle,
    });
  }

  /**
   * Notify user of job update
   */
  async notifyJobUpdated(
    userId: string,
    jobId: string,
    jobNumber: string,
    jobTitle: string
  ): Promise<{ success: boolean }> {
    return this.sendNotification({
      type: 'job_updated',
      userId,
      jobId,
      jobNumber,
      jobTitle,
    });
  }

  /**
   * Notify user of job reminder
   */
  async notifyJobReminder(
    userId: string,
    jobId: string,
    jobNumber: string,
    jobTitle: string,
    scheduledTime: string
  ): Promise<{ success: boolean }> {
    return this.sendNotification({
      type: 'job_reminder',
      userId,
      jobId,
      jobNumber,
      jobTitle,
      data: { scheduledTime },
    });
  }

  /**
   * Notify user of job cancellation
   */
  async notifyJobCancelled(
    userId: string,
    jobNumber: string,
    jobTitle: string
  ): Promise<{ success: boolean }> {
    return this.sendNotification({
      type: 'job_cancelled',
      userId,
      jobNumber,
      jobTitle,
    });
  }

  /**
   * Notify of sync conflict
   */
  async notifySyncConflict(
    userId: string,
    entityType: string,
    entityId: string
  ): Promise<{ success: boolean }> {
    return this.sendNotification({
      type: 'sync_conflict',
      userId,
      data: { entityType, entityId },
    });
  }
}

export const notificationService = new NotificationService();
