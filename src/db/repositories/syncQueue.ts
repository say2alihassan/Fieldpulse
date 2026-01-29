import { getDatabase } from '../index';
import type { SyncQueueItem, SyncAction, SyncEntityType } from '../../types';

interface SyncQueueRow {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  payload: string;
  file_path: string | null;
  retry_count: number;
  last_error: string | null;
  priority: number;
  created_at: number;
}

function rowToItem(row: SyncQueueRow): SyncQueueItem {
  return {
    id: row.id,
    entityType: row.entity_type as SyncEntityType,
    entityId: row.entity_id,
    action: row.action as SyncAction,
    payload: JSON.parse(row.payload),
    filePath: row.file_path ?? undefined,
    retryCount: row.retry_count,
    lastError: row.last_error ?? undefined,
    priority: row.priority,
    createdAt: row.created_at,
  };
}

export async function addToQueue(
  entityType: SyncEntityType,
  entityId: string,
  action: SyncAction,
  payload: unknown,
  filePath?: string,
  priority = 0
): Promise<number> {
  const db = getDatabase();

  // Remove any existing queue items for the same entity
  await db.execute(
    'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ?',
    [entityType, entityId]
  );

  const result = await db.execute(
    `INSERT INTO sync_queue (entity_type, entity_id, action, payload, file_path, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entityType, entityId, action, JSON.stringify(payload), filePath ?? null, priority]
  );

  return result.insertId ?? 0;
}

export async function getNextQueueItems(limit = 10): Promise<SyncQueueItem[]> {
  const db = getDatabase();
  const result = await db.execute(
    `SELECT * FROM sync_queue
     WHERE retry_count < 3
     ORDER BY priority DESC, created_at ASC
     LIMIT ?`,
    [limit]
  );

  return result.rows.map((row) => rowToItem(row as unknown as SyncQueueRow));
}

export async function getQueueCount(): Promise<number> {
  const db = getDatabase();
  const result = await db.execute('SELECT COUNT(*) as count FROM sync_queue');
  return (result.rows[0] as { count: number }).count;
}

export async function getQueueItem(id: number): Promise<SyncQueueItem | null> {
  const db = getDatabase();
  const result = await db.execute('SELECT * FROM sync_queue WHERE id = ?', [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return rowToItem(result.rows[0] as unknown as SyncQueueRow);
}

export async function markItemSuccess(id: number): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export async function markItemFailed(id: number, error: string): Promise<void> {
  const db = getDatabase();
  await db.execute(
    `UPDATE sync_queue
     SET retry_count = retry_count + 1, last_error = ?
     WHERE id = ?`,
    [error, id]
  );
}

export async function removeFromQueue(id: number): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export async function clearQueue(): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM sync_queue');
}

export async function getFailedItems(): Promise<SyncQueueItem[]> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM sync_queue WHERE retry_count >= 3 ORDER BY created_at ASC'
  );

  return result.rows.map((row) => rowToItem(row as unknown as SyncQueueRow));
}

export async function retryFailedItem(id: number): Promise<void> {
  const db = getDatabase();
  await db.execute(
    'UPDATE sync_queue SET retry_count = 0, last_error = NULL WHERE id = ?',
    [id]
  );
}
