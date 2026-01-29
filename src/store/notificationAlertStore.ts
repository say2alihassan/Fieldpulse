import { create } from 'zustand';

export interface NotificationAlert {
  id: string;
  title: string;
  body: string;
  type: 'job_assigned' | 'job_updated' | 'job_reminder' | 'job_cancelled' | 'info';
  jobId?: string;
  jobNumber?: string;
  timestamp: number;
}

interface NotificationAlertState {
  currentAlert: NotificationAlert | null;

  showAlert: (alert: Omit<NotificationAlert, 'id' | 'timestamp'>) => void;
  dismissAlert: () => void;
}

export const useNotificationAlertStore = create<NotificationAlertState>((set) => ({
  currentAlert: null,

  showAlert: (alert) => {
    set({
      currentAlert: {
        ...alert,
        id: `alert-${Date.now()}`,
        timestamp: Date.now(),
      },
    });
  },

  dismissAlert: () => {
    set({ currentAlert: null });
  },
}));
