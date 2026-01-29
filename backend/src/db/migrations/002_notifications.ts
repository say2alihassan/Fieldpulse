import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // device_tokens table already exists in 001_initial_schema
  // Add additional columns if needed
  try {
    await db.schema
      .alterTable('device_tokens')
      .addColumn('device_id', 'varchar(255)')
      .execute();
  } catch {
    // Column may already exist
  }

  try {
    await db.schema
      .alterTable('device_tokens')
      .addColumn('device_name', 'varchar(255)')
      .execute();
  } catch {
    // Column may already exist
  }

  try {
    await db.schema
      .alterTable('device_tokens')
      .addColumn('app_version', 'varchar(50)')
      .execute();
  } catch {
    // Column may already exist
  }

  try {
    await db.schema
      .alterTable('device_tokens')
      .addColumn('last_used_at', 'timestamptz')
      .execute();
  } catch {
    // Column may already exist
  }

  // Create notifications table
  await db.schema
    .createTable('notifications')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('type', 'varchar(50)', (col) => col.notNull())
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('related_id', 'uuid')
    .addColumn('related_type', 'varchar(50)')
    .addColumn('data', 'jsonb')
    .addColumn('priority', 'varchar(20)', (col) => col.defaultTo('normal').notNull())
    .addColumn('category', 'varchar(50)', (col) => col.notNull())
    .addColumn('read', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('read_at', 'timestamptz')
    .addColumn('dismissed', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('dismissed_at', 'timestamptz')
    .addColumn('created_by', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('expires_at', 'timestamptz')
    .execute();

  // Create indexes for notifications
  await db.schema
    .createIndex('idx_notifications_user_id')
    .ifNotExists()
    .on('notifications')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_notifications_user_read')
    .ifNotExists()
    .on('notifications')
    .columns(['user_id', 'read'])
    .execute();

  await db.schema
    .createIndex('idx_notifications_user_category')
    .ifNotExists()
    .on('notifications')
    .columns(['user_id', 'category'])
    .execute();

  await db.schema
    .createIndex('idx_notifications_created_at')
    .ifNotExists()
    .on('notifications')
    .column('created_at')
    .execute();

  await db.schema
    .createIndex('idx_notifications_expires_at')
    .ifNotExists()
    .on('notifications')
    .column('expires_at')
    .execute();

  console.log('✅ Migration 002_notifications completed');
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('notifications').ifExists().execute();

  // Don't drop device_tokens as it's managed by 001_initial_schema
  // Just remove the columns we added
  try {
    await db.schema.alterTable('device_tokens').dropColumn('device_id').execute();
  } catch {
    // Column may not exist
  }
  try {
    await db.schema.alterTable('device_tokens').dropColumn('device_name').execute();
  } catch {
    // Column may not exist
  }
  try {
    await db.schema.alterTable('device_tokens').dropColumn('app_version').execute();
  } catch {
    // Column may not exist
  }
  try {
    await db.schema.alterTable('device_tokens').dropColumn('last_used_at').execute();
  } catch {
    // Column may not exist
  }

  console.log('✅ Migration 002_notifications rolled back');
}
