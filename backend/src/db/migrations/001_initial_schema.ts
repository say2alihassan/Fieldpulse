import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('full_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('role', 'varchar(50)', (col) => col.defaultTo('technician'))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  // Refresh tokens table
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('token_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_user')
    .on('refresh_tokens')
    .column('user_id')
    .execute();

  // Customers table
  await db.schema
    .createTable('customers')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)')
    .addColumn('phone', 'varchar(50)')
    .addColumn('address_line1', 'varchar(255)')
    .addColumn('address_line2', 'varchar(255)')
    .addColumn('city', 'varchar(100)')
    .addColumn('state', 'varchar(50)')
    .addColumn('zip', 'varchar(20)')
    .addColumn('latitude', 'decimal(10, 8)')
    .addColumn('longitude', 'decimal(11, 8)')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  // Checklist templates table
  await db.schema
    .createTable('checklist_templates')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('fields', 'jsonb', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  // Jobs table
  await db.schema
    .createTable('jobs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('job_number', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('customer_id', 'uuid', (col) =>
      col.references('customers.id').onDelete('set null')
    )
    .addColumn('assigned_to', 'uuid', (col) =>
      col.references('users.id').onDelete('set null')
    )
    .addColumn('status', 'varchar(50)', (col) => col.defaultTo('pending'))
    .addColumn('priority', 'varchar(20)', (col) => col.defaultTo('normal'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('scheduled_start', 'timestamptz')
    .addColumn('scheduled_end', 'timestamptz')
    .addColumn('actual_start', 'timestamptz')
    .addColumn('actual_end', 'timestamptz')
    .addColumn('checklist_template_id', 'uuid', (col) =>
      col.references('checklist_templates.id').onDelete('set null')
    )
    .addColumn('version', 'integer', (col) => col.defaultTo(1).notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_jobs_assigned')
    .on('jobs')
    .columns(['assigned_to', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_jobs_status')
    .on('jobs')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_jobs_scheduled')
    .on('jobs')
    .column('scheduled_start')
    .execute();

  // Checklist responses table
  await db.schema
    .createTable('checklist_responses')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('job_id', 'uuid', (col) =>
      col.notNull().references('jobs.id').onDelete('cascade')
    )
    .addColumn('field_id', 'varchar(100)', (col) => col.notNull())
    .addColumn('field_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('value', 'jsonb')
    .addColumn('is_draft', 'boolean', (col) => col.defaultTo(true))
    .addColumn('version', 'integer', (col) => col.defaultTo(1).notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_checklist_responses_job_field')
    .on('checklist_responses')
    .columns(['job_id', 'field_id'])
    .unique()
    .execute();

  // Photos table
  await db.schema
    .createTable('photos')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('job_id', 'uuid', (col) =>
      col.notNull().references('jobs.id').onDelete('cascade')
    )
    .addColumn('checklist_response_id', 'uuid', (col) =>
      col.references('checklist_responses.id').onDelete('set null')
    )
    .addColumn('storage_key', 'varchar(500)', (col) => col.notNull())
    .addColumn('original_filename', 'varchar(255)')
    .addColumn('mime_type', 'varchar(100)', (col) =>
      col.defaultTo('image/jpeg')
    )
    .addColumn('size_bytes', 'integer')
    .addColumn('width', 'integer')
    .addColumn('height', 'integer')
    .addColumn('latitude', 'decimal(10, 8)')
    .addColumn('longitude', 'decimal(11, 8)')
    .addColumn('captured_at', 'timestamptz')
    .addColumn('uploaded_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_photos_job')
    .on('photos')
    .column('job_id')
    .execute();

  // Signatures table
  await db.schema
    .createTable('signatures')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('job_id', 'uuid', (col) =>
      col.notNull().references('jobs.id').onDelete('cascade')
    )
    .addColumn('checklist_response_id', 'uuid', (col) =>
      col.references('checklist_responses.id').onDelete('set null')
    )
    .addColumn('storage_key', 'varchar(500)', (col) => col.notNull())
    .addColumn('signer_name', 'varchar(255)')
    .addColumn('captured_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  // Device tokens for push notifications
  await db.schema
    .createTable('device_tokens')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('token', 'varchar(500)', (col) => col.notNull())
    .addColumn('platform', 'varchar(20)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`NOW()`).notNull()
    )
    .execute();

  await db.schema
    .createIndex('idx_device_tokens_user_token')
    .on('device_tokens')
    .columns(['user_id', 'token'])
    .unique()
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('device_tokens').ifExists().execute();
  await db.schema.dropTable('signatures').ifExists().execute();
  await db.schema.dropTable('photos').ifExists().execute();
  await db.schema.dropTable('checklist_responses').ifExists().execute();
  await db.schema.dropTable('jobs').ifExists().execute();
  await db.schema.dropTable('checklist_templates').ifExists().execute();
  await db.schema.dropTable('customers').ifExists().execute();
  await db.schema.dropTable('refresh_tokens').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
}
