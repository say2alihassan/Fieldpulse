import { getDatabase } from '../index';
import type { ChecklistResponse, FieldType } from '../../types';

interface LocalResponse {
  id: string;
  job_id: string;
  field_id: string;
  data: string;
  is_dirty: number;
  is_draft: number;
  last_synced_at: number | null;
}

function parseResponse(row: LocalResponse): ChecklistResponse {
  const data = JSON.parse(row.data);
  return {
    id: row.id,
    jobId: row.job_id,
    fieldId: row.field_id,
    fieldType: data.fieldType as FieldType,
    value: data.value,
    isDraft: row.is_draft === 1,
    version: data.version ?? 1,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function getResponsesByJobId(jobId: string): Promise<ChecklistResponse[]> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM checklist_responses WHERE job_id = ?',
    [jobId]
  );

  return result.rows.map((row) => parseResponse(row as unknown as LocalResponse));
}

export async function getResponse(
  jobId: string,
  fieldId: string
): Promise<ChecklistResponse | null> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM checklist_responses WHERE job_id = ? AND field_id = ?',
    [jobId, fieldId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return parseResponse(result.rows[0] as unknown as LocalResponse);
}

export async function saveResponse(
  jobId: string,
  fieldId: string,
  fieldType: FieldType,
  value: unknown,
  isDraft: boolean,
  fromServer = false
): Promise<void> {
  const db = getDatabase();
  const id = `${jobId}_${fieldId}`;
  const now = new Date().toISOString();
  const timestamp = Math.floor(Date.now() / 1000);

  const data = JSON.stringify({
    fieldType,
    value,
    version: 1,
    createdAt: now,
    updatedAt: now,
  });

  const existing = await db.execute(
    'SELECT * FROM checklist_responses WHERE job_id = ? AND field_id = ?',
    [jobId, fieldId]
  );

  if (existing.rows.length > 0) {
    const localRow = existing.rows[0] as unknown as LocalResponse;

    if (fromServer) {
      // Only update if not dirty
      if (!localRow.is_dirty) {
        await db.execute(
          `UPDATE checklist_responses
           SET data = ?, is_draft = ?, is_dirty = 0, last_synced_at = ?
           WHERE job_id = ? AND field_id = ?`,
          [data, isDraft ? 1 : 0, timestamp, jobId, fieldId]
        );
      }
    } else {
      await db.execute(
        `UPDATE checklist_responses
         SET data = ?, is_draft = ?, is_dirty = 1
         WHERE job_id = ? AND field_id = ?`,
        [data, isDraft ? 1 : 0, jobId, fieldId]
      );
    }
  } else {
    await db.execute(
      `INSERT INTO checklist_responses (id, job_id, field_id, data, is_draft, is_dirty, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        jobId,
        fieldId,
        data,
        isDraft ? 1 : 0,
        fromServer ? 0 : 1,
        fromServer ? timestamp : null,
      ]
    );
  }
}

export async function saveResponses(
  jobId: string,
  responses: Array<{
    fieldId: string;
    fieldType: FieldType;
    value: unknown;
    isDraft: boolean;
  }>,
  fromServer = false
): Promise<void> {
  const db = getDatabase();
  await db.transaction(async (tx) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const now = new Date().toISOString();

    for (const response of responses) {
      const id = `${jobId}_${response.fieldId}`;
      const data = JSON.stringify({
        fieldType: response.fieldType,
        value: response.value,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      const existing = await tx.execute(
        'SELECT * FROM checklist_responses WHERE job_id = ? AND field_id = ?',
        [jobId, response.fieldId]
      );

      if (existing.rows.length > 0) {
        const localRow = existing.rows[0] as unknown as LocalResponse;

        if (fromServer) {
          if (!localRow.is_dirty) {
            await tx.execute(
              `UPDATE checklist_responses
               SET data = ?, is_draft = ?, is_dirty = 0, last_synced_at = ?
               WHERE job_id = ? AND field_id = ?`,
              [data, response.isDraft ? 1 : 0, timestamp, jobId, response.fieldId]
            );
          }
        } else {
          await tx.execute(
            `UPDATE checklist_responses
             SET data = ?, is_draft = ?, is_dirty = 1
             WHERE job_id = ? AND field_id = ?`,
            [data, response.isDraft ? 1 : 0, jobId, response.fieldId]
          );
        }
      } else {
        await tx.execute(
          `INSERT INTO checklist_responses (id, job_id, field_id, data, is_draft, is_dirty, last_synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            jobId,
            response.fieldId,
            data,
            response.isDraft ? 1 : 0,
            fromServer ? 0 : 1,
            fromServer ? timestamp : null,
          ]
        );
      }
    }
  });
}

export async function getDirtyResponses(
  jobId: string
): Promise<Array<{ fieldId: string; value: unknown }>> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM checklist_responses WHERE job_id = ? AND is_dirty = 1',
    [jobId]
  );

  return result.rows.map((row) => {
    const localRow = row as unknown as LocalResponse;
    const data = JSON.parse(localRow.data);
    return {
      fieldId: localRow.field_id,
      value: data.value,
    };
  });
}

export async function markResponsesSynced(jobId: string): Promise<void> {
  const db = getDatabase();
  const timestamp = Math.floor(Date.now() / 1000);

  await db.execute(
    `UPDATE checklist_responses
     SET is_dirty = 0, last_synced_at = ?
     WHERE job_id = ?`,
    [timestamp, jobId]
  );
}

export async function deleteResponsesByJobId(jobId: string): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM checklist_responses WHERE job_id = ?', [jobId]);
}
