import { z } from 'zod';

export const updateResponseSchema = z.object({
  value: z.unknown(),
  isDraft: z.boolean().default(true),
  version: z.number().int().positive().optional(),
});

export const batchResponsesSchema = z.object({
  responses: z.array(
    z.object({
      fieldId: z.string().min(1),
      value: z.unknown(),
      isDraft: z.boolean().default(true),
    })
  ),
});

export type UpdateResponseInput = z.infer<typeof updateResponseSchema>;
export type BatchResponsesInput = z.infer<typeof batchResponsesSchema>;
