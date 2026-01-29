import { sql } from 'kysely';
import { db } from '../db/index.js';
import type {
  Job,
  JobWithDetails,
  Customer,
  ChecklistTemplate,
  ChecklistResponse,
  CursorPaginationParams,
  CursorPaginationResult,
  FieldDefinition,
} from '../types/index.js';
import { NotFoundError, ConflictError } from '../api/middleware/errorHandler.js';
import { notificationService } from './notification.js';

interface JobFilters {
  status?: string[];
  search?: string;
  assignedTo?: string;
}

function rowToJob(row: {
  id: string;
  job_number: string;
  customer_id: string;
  assigned_to: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  scheduled_start: Date | null;
  scheduled_end: Date | null;
  actual_start: Date | null;
  actual_end: Date | null;
  checklist_template_id: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}): Job {
  return {
    id: row.id,
    jobNumber: row.job_number,
    customerId: row.customer_id,
    assignedTo: row.assigned_to,
    status: row.status as Job['status'],
    priority: row.priority as Job['priority'],
    title: row.title,
    description: row.description,
    scheduledStart: row.scheduled_start?.toISOString() ?? null,
    scheduledEnd: row.scheduled_end?.toISOString() ?? null,
    actualStart: row.actual_start?.toISOString() ?? null,
    actualEnd: row.actual_end?.toISOString() ?? null,
    checklistTemplateId: row.checklist_template_id,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createJob(
  data: {
    jobNumber: string;
    customerId: string;
    assignedTo: string;
    title: string;
    description?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    scheduledStart?: string;
    scheduledEnd?: string;
    checklistTemplateId?: string;
  },
  
): Promise<Job> {
  const id = crypto.randomUUID();

  const result = await db
    .insertInto('jobs')
    .values({
      id,
      job_number: data.jobNumber,
      customer_id: data.customerId,
      assigned_to: data.assignedTo,
      title: data.title,
      description: data.description || null,
      status: 'pending',
      priority: data.priority || 'normal',
      scheduled_start: data.scheduledStart ? new Date(data.scheduledStart) : null,
      scheduled_end: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
      checklist_template_id: data.checklistTemplateId || null,
      version: 1,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const job = rowToJob(result);

  // Send notification to assigned technician
  if (data.assignedTo) {
    notificationService.notifyJobAssigned(
      data.assignedTo,
      id,
      job.jobNumber,
      job.title,
    ).catch((err) => console.error('Failed to send job assignment notification:', err));
  }

  return job;
}

export async function getJobs(
  filters: JobFilters,
  pagination: CursorPaginationParams
): Promise<CursorPaginationResult<Job>> {
  let query = db
    .selectFrom('jobs')
    .selectAll()
    .orderBy('scheduled_start', 'asc')
    .orderBy('id', 'asc');

  // Apply filters
  if (filters.assignedTo) {
    query = query.where('assigned_to', '=', filters.assignedTo);
  }

  if (filters.status && filters.status.length > 0) {
    query = query.where('status', 'in', filters.status);
  }

  if (filters.search) {
    const searchTerm = `%${filters.search.toLowerCase()}%`;
    query = query.where((eb) =>
      eb.or([
        eb('title', 'ilike', searchTerm),
        eb('job_number', 'ilike', searchTerm),
        eb('description', 'ilike', searchTerm),
      ])
    );
  }

  // Apply cursor
  if (pagination.cursor) {
    const [cursorDate, cursorId] = pagination.cursor.split('_');
    query = query.where((eb) =>
      eb.or([
        eb('scheduled_start', '>', new Date(cursorDate)),
        eb.and([
          eb('scheduled_start', '=', new Date(cursorDate)),
          eb('id', '>', cursorId),
        ]),
      ])
    );
  }

  // Fetch one extra to determine hasMore
  const rows = await query.limit(pagination.limit + 1).execute();

  const hasMore = rows.length > pagination.limit;
  const data = rows.slice(0, pagination.limit).map(rowToJob);

  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    nextCursor = `${lastItem.scheduledStart ?? new Date().toISOString()}_${lastItem.id}`;
  }

  return { data, nextCursor, hasMore };
}

export async function getJobById(jobId: string): Promise<JobWithDetails> {
  const jobRow = await db
    .selectFrom('jobs')
    .selectAll()
    .where('id', '=', jobId)
    .executeTakeFirst();

  if (!jobRow) {
    throw new NotFoundError('Job');
  }

  const job = rowToJob(jobRow);

  // Get customer
  let customer: Customer | null = null;
  if (jobRow.customer_id) {
    const customerRow = await db
      .selectFrom('customers')
      .selectAll()
      .where('id', '=', jobRow.customer_id)
      .executeTakeFirst();

    if (customerRow) {
      customer = {
        id: customerRow.id,
        name: customerRow.name,
        email: customerRow.email,
        phone: customerRow.phone,
        addressLine1: customerRow.address_line1,
        addressLine2: customerRow.address_line2,
        city: customerRow.city,
        state: customerRow.state,
        zip: customerRow.zip,
        latitude: customerRow.latitude ? parseFloat(customerRow.latitude) : null,
        longitude: customerRow.longitude ? parseFloat(customerRow.longitude) : null,
        createdAt: customerRow.created_at.toISOString(),
      };
    }
  }

  // Get checklist template
  let checklistTemplate: ChecklistTemplate | null = null;
  if (jobRow.checklist_template_id) {
    const templateRow = await db
      .selectFrom('checklist_templates')
      .selectAll()
      .where('id', '=', jobRow.checklist_template_id)
      .executeTakeFirst();

    if (templateRow) {
      checklistTemplate = {
        id: templateRow.id,
        name: templateRow.name,
        fields: templateRow.fields as FieldDefinition[],
        createdAt: templateRow.created_at.toISOString(),
      };
    }
  }

  // Get responses
  const responseRows = await db
    .selectFrom('checklist_responses')
    .selectAll()
    .where('job_id', '=', jobId)
    .execute();

  const responses: ChecklistResponse[] = responseRows.map((row) => ({
    id: row.id,
    jobId: row.job_id,
    fieldId: row.field_id,
    fieldType: row.field_type as ChecklistResponse['fieldType'],
    value: row.value,
    isDraft: row.is_draft,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));

  return {
    ...job,
    customer: customer!,
    checklistTemplate,
    responses,
  };
}

export async function updateJob(
  jobId: string,
  updates: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    actualStart?: string | null;
    actualEnd?: string | null;
  },
  expectedVersion: number,
): Promise<Job> {
  // Get current job to check for assignment changes
  const currentJob = await db
    .selectFrom('jobs')
    .select(['assigned_to', 'job_number', 'title'])
    .where('id', '=', jobId)
    .executeTakeFirst();

  const result = await db
    .updateTable('jobs')
    .set({
      ...(updates.status && { status: updates.status }),
      ...(updates.priority && { priority: updates.priority }),
      ...(updates.assignedTo && { assigned_to: updates.assignedTo }),
      ...(updates.actualStart !== undefined && {
        actual_start: updates.actualStart ? new Date(updates.actualStart) : null,
      }),
      ...(updates.actualEnd !== undefined && {
        actual_end: updates.actualEnd ? new Date(updates.actualEnd) : null,
      }),
      version: sql`version + 1`,
      updated_at: new Date(),
    })
    .where('id', '=', jobId)
    .where('version', '=', expectedVersion)
    .returningAll()
    .executeTakeFirst();

  if (!result) {
    // Check if job exists
    const exists = await db
      .selectFrom('jobs')
      .select('id')
      .where('id', '=', jobId)
      .executeTakeFirst();

    if (!exists) {
      throw new NotFoundError('Job');
    }

    // Version conflict
    const current = await db
      .selectFrom('jobs')
      .select(['version'])
      .where('id', '=', jobId)
      .executeTakeFirst();

    throw new ConflictError('Job has been modified', {
      expectedVersion,
      currentVersion: current?.version,
    });
  }

  const job = rowToJob(result);

  // Send notification if job was reassigned to a different user
  if (updates.assignedTo && currentJob && updates.assignedTo !== currentJob.assigned_to) {
    notificationService.notifyJobAssigned(
      updates.assignedTo,
      jobId,
      job.jobNumber,
      job.title,
    ).catch((err) => console.error('Failed to send job assignment notification:', err));
  }

  return job;
}

export async function completeJob(
  jobId: string,
  expectedVersion: number
): Promise<Job> {
  return updateJob(
    jobId,
    {
      status: 'completed',
      actualEnd: new Date().toISOString(),
    },
    expectedVersion
  );
}
