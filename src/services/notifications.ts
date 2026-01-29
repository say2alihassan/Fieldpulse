import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { navigationRef } from '../navigation/RootNavigator';
import { apiClient } from '../api/client';
import { useNotificationAlertStore, NotificationAlert } from '../store/notificationAlertStore';

// Notification payload types
interface JobNotificationData {
  type: 'job_assigned' | 'job_updated' | 'job_reminder' | 'job_cancelled';
  jobId: string;
  jobNumber?: string;
  title?: string;
}

class NotificationService {
  private initialized = false;
  private currentToken: string | null = null;

  /**
   * Initialize the notification service
   * Call this on app startup after authentication
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Request permissions
    const permissionGranted = await this.requestPermissions();

    if (permissionGranted) {
      // Set up message handlers
      this.setupMessageHandlers();

      // Get and register FCM token
      await this.registerToken();

      // Listen for token refresh
      this.setupTokenRefreshListener();
    }

    this.initialized = true;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    // Request Firebase messaging permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Notification permission not granted');
      return false;
    }

    // iOS specific: register for remote notifications
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }

    return true;
  }

  /**
   * Get the FCM token for this device
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      // Log full token for testing - remove in production
      console.log('[Push] FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.warn('[Push] No FCM token available');
        return;
      }

      // Skip if token hasn't changed
      if (token === this.currentToken) {
        console.log('[Push] Token unchanged, skipping registration');
        return;
      }

      const deviceId = await DeviceInfo.getUniqueId();
      const deviceName = await DeviceInfo.getDeviceName();
      const appVersion = DeviceInfo.getVersion();

      await apiClient.post('/notifications/push/subscribe', {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId,
        deviceName,
        appVersion,
      });

      this.currentToken = token;
      console.log('[Push] Token registered with backend successfully');
    } catch (error) {
      console.error('[Push] Failed to register token with backend:', error);
    }
  }

  /**
   * Unregister FCM token from backend (call on logout)
   */
  async unregisterToken(): Promise<void> {
    try {
      if (!this.currentToken) {
        console.log('[Push] No token to unregister');
        return;
      }

      const deviceId = await DeviceInfo.getUniqueId();

      await apiClient.post('/notifications/push/unsubscribe', {
        token: this.currentToken,
        deviceId,
      });

      this.currentToken = null;
      console.log('[Push] Token unregistered from backend successfully');
    } catch (error) {
      console.error('[Push] Failed to unregister token from backend:', error);
    }
  }

  /**
   * Set up token refresh listener
   */
  private setupTokenRefreshListener(): void {
    messaging().onTokenRefresh(async (newToken) => {
      console.log('[Push] Token refreshed:', newToken.substring(0, 20) + '...');
      this.currentToken = null; // Force re-registration
      await this.registerToken();
    });
  }

  /**
   * Set up Firebase message handlers
   */
  private setupMessageHandlers(): void {
    // Handle messages when app is in background and opened via notification
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationPress(remoteMessage.data as unknown as JobNotificationData);
    });

    // Handle messages when app is in foreground - show in-app alert
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      const data = remoteMessage.data as unknown as JobNotificationData | undefined;

      // Show in-app alert
      this.showInAppAlert({
        title: remoteMessage.notification?.title || 'FieldPulse',
        body: remoteMessage.notification?.body || '',
        type: data?.type || 'info',
        jobId: data?.jobId,
        jobNumber: data?.jobNumber,
      });
    });

    // Check if app was opened from a notification (cold start)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from quit state via notification:', remoteMessage);
          // Delay navigation to ensure app is fully mounted
          setTimeout(() => {
            this.handleNotificationPress(remoteMessage.data as unknown as JobNotificationData);
          }, 1000);
        }
      });
  }

  /**
   * Show in-app notification alert (for foreground messages)
   */
  private showInAppAlert(alert: {
    title: string;
    body: string;
    type: NotificationAlert['type'];
    jobId?: string;
    jobNumber?: string;
  }): void {
    const { showAlert } = useNotificationAlertStore.getState();
    showAlert(alert);
  }

  /**
   * Handle notification press - navigate to appropriate screen
   */
  private handleNotificationPress(data?: JobNotificationData): void {
    if (!data) return;

    const { type, jobId } = data;

    // Ensure navigation is ready
    if (!navigationRef.isReady()) {
      console.warn('Navigation not ready, deferring notification handling');
      setTimeout(() => this.handleNotificationPress(data), 500);
      return;
    }

    switch (type) {
      case 'job_assigned':
      case 'job_updated':
      case 'job_reminder':
        // Navigate to job details
        if (jobId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigationRef.navigate as any)('Main', {
            screen: 'Jobs',
            params: {
              screen: 'JobDetails',
              params: { jobId },
            },
          });
        }
        break;
      case 'job_cancelled':
        // Navigate to job list
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigationRef.navigate as any)('Main', {
          screen: 'Jobs',
          params: {
            screen: 'JobList',
          },
        });
        break;
      default:
        console.log('Unknown notification type:', type);
    }
  }

  /**
   * Reset notification service (call on logout)
   */
  async reset(): Promise<void> {
    await this.unregisterToken();
    this.initialized = false;
    this.currentToken = null;
  }
}

// Background message handler - must be registered at module level
export function setupBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    // The notification is automatically displayed by FCM
  });
}

// Export singleton instance
export const notificationService = new NotificationService();
