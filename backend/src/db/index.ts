import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from '../types/index.js';
import { config } from '../utils/config.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: config.databaseUrl,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

export async function checkConnection(): Promise<boolean> {
  try {
    await db.selectFrom('users').select('id').limit(1).execute();
    return true;
  } catch {
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  await db.destroy();
}
