import { z } from 'zod';

export const subscribePushSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android']),
  deviceId: z.string().min(1, 'Device ID is required'),
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
});

export const unsubscribePushSchema = z.object({
  token: z.string().optional(),
  deviceId: z.string().optional(),
}).refine(
  (data) => data.token || data.deviceId,
  { message: 'Either token or deviceId is required' }
);

export const updatePushSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  notificationTypes: z.record(z.string(), z.boolean()).optional(),
});

export type SubscribePushInput = z.infer<typeof subscribePushSchema>;
export type UnsubscribePushInput = z.infer<typeof unsubscribePushSchema>;
export type UpdatePushSettingsInput = z.infer<typeof updatePushSettingsSchema>;
