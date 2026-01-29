import { sql } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import type { ChecklistResponse, FieldType } from '../types/index.js';
import { NotFoundError, ConflictError } from '../api/middleware/errorHandler.js';

function rowToResponse(row: {
  id: string;
  job_id: string;
  field_id: string;
  field_type: string;
  value: unknown;
  is_draft: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
}): ChecklistResponse {
  return {
    id: row.id,
    jobId: row.job_id,
    fieldId: row.field_id,
    fieldType: row.field_type as FieldType,
    value: row.value,
    isDraft: row.is_draft,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getResponsesByJobId(
  jobId: string
): Promise<ChecklistResponse[]> {
  const rows = await db
    .selectFrom('checklist_responses')
    .selectAll()
    .where('job_id', '=', jobId)
    .execute();

  return rows.map(rowToResponse);
}

export async function upsertResponse(
  jobId: string,
  fieldId: string,
  fieldType: FieldType,
  value: unknown,
  isDraft: boolean,
  expectedVersion?: number
): Promise<ChecklistResponse> {
  // Check if response exists
  const existing = await db
    .selectFrom('checklist_responses')
    .selectAll()
    .where('job_id', '=', jobId)
    .where('field_id', '=', fieldId)
    .executeTakeFirst();

  if (existing) {
    // Update existing
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new ConflictError('Response has been modified', {
        expectedVersion,
        currentVersion: existing.version,
      });
    }

    const result = await db
      .updateTable('checklist_responses')
      .set({
        value: JSON.stringify(value),
        is_draft: isDraft,
        version: sql`version + 1`,
        updated_at: new Date(),
      })
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirst();

    return rowToResponse(result!);
  }

  // Create new
  const result = await db
    .insertInto('checklist_responses')
    .values({
      id: uuidv4(),
      job_id: jobId,
      field_id: fieldId,
      field_type: fieldType,
      value: JSON.stringify(value),
      is_draft: isDraft,
      version: 1,
    })
    .returningAll()
    .executeTakeFirst();

  return rowToResponse(result!);
}

export async function batchUpsertResponses(
  jobId: string,
  responses: Array<{
    fieldId: string;
    fieldType: FieldType;
    value: unknown;
    isDraft: boolean;
  }>
): Promise<ChecklistResponse[]> {
  // Verify job exists
  const job = await db
    .selectFrom('jobs')
    .select('id')
    .where('id', '=', jobId)
    .executeTakeFirst();

  if (!job) {
    throw new NotFoundError('Job');
  }

  const results: ChecklistResponse[] = [];

  for (const response of responses) {
    const result = await upsertResponse(
      jobId,
      response.fieldId,
      response.fieldType,
      response.value,
      response.isDraft
    );
    results.push(result);
  }

  return results;
}

export async function markResponsesAsSubmitted(
  jobId: string
): Promise<number> {
  const result = await db
    .updateTable('checklist_responses')
    .set({
      is_draft: false,
      updated_at: new Date(),
    })
    .where('job_id', '=', jobId)
    .where('is_draft', '=', true)
    .execute();

  return Number(result[0]?.numUpdatedRows ?? 0);
}
