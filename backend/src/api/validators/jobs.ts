import { z } from 'zod';

export const jobFiltersSchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean)),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
});

export const createJobSchema = z.object({
  jobNumber: z.string().min(1, 'Job number is required'),
  customerId: z.string().uuid('Invalid customer ID'),
  assignedTo: z.string().uuid('Invalid user ID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  checklistTemplateId: z.string().uuid().optional(),
});

export const updateJobSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional(),
  actualStart: z.string().datetime().optional().nullable(),
  actualEnd: z.string().datetime().optional().nullable(),
  version: z.number().int().positive('Version is required'),
});

export const completeJobSchema = z.object({
  responses: z.array(
    z.object({
      fieldId: z.string().min(1),
      value: z.unknown(),
      isDraft: z.boolean().default(false),
    })
  ),
  version: z.number().int().positive(),
});

export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type CompleteJobInput = z.infer<typeof completeJobSchema>;
