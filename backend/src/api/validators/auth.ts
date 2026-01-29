import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const registerDeviceSchema = z.object({
  token: z.string().min(1, 'Device token is required'),
  platform: z.enum(['ios', 'android']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
