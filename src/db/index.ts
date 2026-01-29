import { open, type DB } from '@op-engineering/op-sqlite';

let db: DB | null = null;
let initialized = false;

export function getDatabase(): DB {
  if (!db) {
    db = open({
      name: 'fieldpulse.db',
    });
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;

  const database = getDatabase();

  // Jobs table - mirrors server data for offline
  await database.execute(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      server_version INTEGER,
      local_version INTEGER NOT NULL DEFAULT 1,
      is_dirty INTEGER NOT NULL DEFAULT 0,
      last_synced_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Customers table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      last_synced_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Checklist responses
  await database.execute(`
    CREATE TABLE IF NOT EXISTS checklist_responses (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      field_id TEXT NOT NULL,
      data TEXT NOT NULL,
      is_dirty INTEGER NOT NULL DEFAULT 0,
      is_draft INTEGER NOT NULL DEFAULT 1,
      last_synced_at INTEGER,
      UNIQUE(job_id, field_id)
    )
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_responses_job
    ON checklist_responses(job_id)
  `);

  // Sync queue for pending operations
  await database.execute(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      file_path TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      priority INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_sync_queue_priority
    ON sync_queue(priority DESC, created_at ASC)
  `);

  // Sync conflicts
  await database.execute(`
    CREATE TABLE IF NOT EXISTS sync_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      local_data TEXT NOT NULL,
      server_data TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      resolution TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Photos metadata (files stored in filesystem)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      field_id TEXT,
      local_path TEXT NOT NULL,
      uploaded INTEGER NOT NULL DEFAULT 0,
      upload_attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_photos_job
    ON photos(job_id)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_photos_uploaded
    ON photos(uploaded)
  `);

  // Signatures metadata
  await database.execute(`
    CREATE TABLE IF NOT EXISTS signatures (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      field_id TEXT,
      local_path TEXT NOT NULL,
      uploaded INTEGER NOT NULL DEFAULT 0,
      upload_attempts INTEGER NOT NULL DEFAULT 0,
      signer_name TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // App state
  await database.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  initialized = true;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    initialized = false;
  }
}
