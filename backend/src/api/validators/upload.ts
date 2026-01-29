import { z } from 'zod';

export const uploadRequestSchema = z.object({
  jobId: z.string().uuid(),
  type: z.enum(['photo', 'signature']),
  filename: z.string().min(1),
});

export const confirmPhotoSchema = z.object({
  jobId: z.string().uuid(),
  key: z.string().min(1),
  checklistResponseId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capturedAt: z.string().datetime().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sizeBytes: z.number().int().positive().optional(),
});

export const confirmSignatureSchema = z.object({
  jobId: z.string().uuid(),
  key: z.string().min(1),
  checklistResponseId: z.string().uuid().optional(),
  signerName: z.string().optional(),
});

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
export type ConfirmPhotoInput = z.infer<typeof confirmPhotoSchema>;
export type ConfirmSignatureInput = z.infer<typeof confirmSignatureSchema>;
