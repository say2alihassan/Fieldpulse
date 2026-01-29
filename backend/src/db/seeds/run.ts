import { Kysely, PostgresDialect, sql } from 'kysely';
import * as pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import type { Database } from '../../types/index.js';

const { Pool } = pg;

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});

// Seed data generators
const firstNames = [
  'John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa',
  'Tom', 'Anna', 'James', 'Emma', 'Robert', 'Mary', 'William', 'Patricia',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson',
];

const streetNames = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St',
  'Washington Blvd', 'Park Ave', 'Lake Dr', 'Hill Rd', 'River St', 'Valley Rd',
];

const cities = [
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
  { city: 'Fresno', state: 'CA', lat: 36.7378, lng: -119.7871 },
];

const jobTitles = [
  'HVAC Maintenance',
  'Plumbing Repair',
  'Electrical Inspection',
  'AC Unit Installation',
  'Water Heater Replacement',
  'Furnace Tune-up',
  'Drain Cleaning',
  'Circuit Breaker Repair',
  'Thermostat Installation',
  'Pipe Leak Repair',
  'Generator Maintenance',
  'Air Duct Cleaning',
  'Garbage Disposal Installation',
  'Smoke Detector Installation',
  'Sump Pump Repair',
];

const jobDescriptions = [
  'Customer reported issues. Needs inspection and repair.',
  'Routine maintenance scheduled.',
  'Follow-up from previous service call.',
  'New installation requested by customer.',
  'Emergency service request.',
  'Annual inspection due.',
  'Customer complaint requires attention.',
  'Upgrade from previous system.',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  return `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@${randomElement(domains)}`;
}

async function seed() {
  console.log('Starting seed...');

  // Clear existing data
  await sql`TRUNCATE TABLE device_tokens, signatures, photos, checklist_responses, jobs, checklist_templates, customers, refresh_tokens, users CASCADE`.execute(db);

  console.log('Cleared existing data');

  // Create users
  const passwordHash = await bcrypt.hash('password123', 10);

  const seedTime = new Date();

  const users = [
    {
      id: uuidv4(),
      email: 'admin@fieldpulse.com',
      password_hash: passwordHash,
      full_name: 'Admin User',
      role: 'admin',
      created_at: seedTime,
      updated_at: seedTime,
    },
    {
      id: uuidv4(),
      email: 'dispatcher@fieldpulse.com',
      password_hash: passwordHash,
      full_name: 'Dispatcher User',
      role: 'dispatcher',
      created_at: seedTime,
      updated_at: seedTime,
    },
    {
      id: uuidv4(),
      email: 'tech@fieldpulse.com',
      password_hash: passwordHash,
      full_name: 'John Technician',
      role: 'technician',
      created_at: seedTime,
      updated_at: seedTime,
    },
    {
      id: uuidv4(),
      email: 'tech2@fieldpulse.com',
      password_hash: passwordHash,
      full_name: 'Jane Technician',
      role: 'technician',
      created_at: seedTime,
      updated_at: seedTime,
    },
  ];

  await db.insertInto('users').values(users).execute();
  console.log(`Created ${users.length} users`);

  // Create customers (50)
  const customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    address_line1: string;
    city: string;
    state: string;
    zip: string;
    latitude: string;
    longitude: string;
    created_at: Date;
  }> = [];

  for (let i = 0; i < 50; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const location = randomElement(cities);

    customers.push({
      id: uuidv4(),
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName),
      phone: generatePhone(),
      address_line1: `${randomInt(100, 9999)} ${randomElement(streetNames)}`,
      city: location.city,
      state: location.state,
      zip: `${randomInt(90000, 96999)}`,
      latitude: String(location.lat + (Math.random() - 0.5) * 0.1),
      longitude: String(location.lng + (Math.random() - 0.5) * 0.1),
      created_at: seedTime,
    });
  }

  await db.insertInto('customers').values(customers).execute();
  console.log(`Created ${customers.length} customers`);

  // Create checklist templates
  const checklistTemplates = [
    {
      id: uuidv4(),
      name: 'HVAC Service Checklist',
      fields: JSON.stringify([
        { id: 'arrival_time', type: 'time', label: 'Arrival Time', validation: { required: true } },
        { id: 'equipment_model', type: 'text', label: 'Equipment Model', validation: { required: true } },
        { id: 'serial_number', type: 'text', label: 'Serial Number' },
        { id: 'filter_replaced', type: 'checkbox', label: 'Filter Replaced' },
        { id: 'refrigerant_level', type: 'select', label: 'Refrigerant Level', options: ['Low', 'Normal', 'High'], validation: { required: true } },
        { id: 'issues_found', type: 'multi-select', label: 'Issues Found', options: ['Leak', 'Noise', 'Poor Airflow', 'Electrical', 'None'] },
        { id: 'temperature_reading', type: 'number', label: 'Temperature Reading (F)', validation: { min: 0, max: 150 } },
        { id: 'work_notes', type: 'textarea', label: 'Work Notes', validation: { maxLength: 1000 } },
        { id: 'equipment_photo', type: 'photo', label: 'Equipment Photo' },
        { id: 'customer_signature', type: 'signature', label: 'Customer Signature', validation: { required: true } },
      ]),
      created_at: seedTime,
    },
    {
      id: uuidv4(),
      name: 'Plumbing Inspection Checklist',
      fields: JSON.stringify([
        { id: 'inspection_date', type: 'date', label: 'Inspection Date', validation: { required: true } },
        { id: 'water_pressure', type: 'number', label: 'Water Pressure (PSI)', validation: { min: 0, max: 200 } },
        { id: 'leak_locations', type: 'multi-select', label: 'Leak Locations', options: ['Kitchen', 'Bathroom', 'Basement', 'Laundry', 'Outdoor', 'None'] },
        { id: 'pipe_condition', type: 'select', label: 'Pipe Condition', options: ['Good', 'Fair', 'Poor', 'Critical'], validation: { required: true } },
        { id: 'repairs_needed', type: 'textarea', label: 'Repairs Needed' },
        { id: 'parts_used', type: 'text', label: 'Parts Used' },
        { id: 'before_photo', type: 'photo', label: 'Before Photo' },
        { id: 'after_photo', type: 'photo', label: 'After Photo' },
        { id: 'customer_signature', type: 'signature', label: 'Customer Signature', validation: { required: true } },
      ]),
      created_at: seedTime,
    },
    {
      id: uuidv4(),
      name: 'Electrical Service Checklist',
      fields: JSON.stringify([
        { id: 'service_type', type: 'select', label: 'Service Type', options: ['Inspection', 'Repair', 'Installation', 'Upgrade'], validation: { required: true } },
        { id: 'circuit_tested', type: 'checkbox', label: 'All Circuits Tested' },
        { id: 'voltage_reading', type: 'number', label: 'Voltage Reading', validation: { min: 0, max: 500 } },
        { id: 'safety_issues', type: 'multi-select', label: 'Safety Issues', options: ['Exposed Wiring', 'Overloaded Circuit', 'Faulty Breaker', 'Grounding Issue', 'None'] },
        { id: 'work_completed', type: 'textarea', label: 'Work Completed', validation: { required: true } },
        { id: 'panel_photo', type: 'photo', label: 'Panel Photo' },
        { id: 'customer_signature', type: 'signature', label: 'Customer Signature', validation: { required: true } },
      ]),
      created_at: seedTime,
    },
  ];

  await db.insertInto('checklist_templates').values(checklistTemplates).execute();
  console.log(`Created ${checklistTemplates.length} checklist templates`);

  // Create jobs (120+)
  const technicians = users.filter((u) => u.role === 'technician');
  const statuses = ['pending', 'pending', 'pending', 'in_progress', 'in_progress', 'completed', 'completed', 'completed', 'completed', 'cancelled'];
  const priorities = ['low', 'normal', 'normal', 'normal', 'high', 'urgent'];

  const jobs: Array<{
    id: string;
    job_number: string;
    customer_id: string;
    assigned_to: string;
    status: string;
    priority: string;
    title: string;
    description: string;
    scheduled_start: Date;
    scheduled_end: Date;
    actual_start: Date | null;
    actual_end: Date | null;
    checklist_template_id: string;
    version: number;
    created_at: Date;
    updated_at: Date;
  }> = [];

  const now = new Date();

  for (let i = 0; i < 500; i++) {
    const status = randomElement(statuses);
    const daysOffset = randomInt(-30, 30);
    const scheduledStart = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    scheduledStart.setHours(randomInt(8, 16), 0, 0, 0);
    const scheduledEnd = new Date(scheduledStart.getTime() + randomInt(1, 4) * 60 * 60 * 1000);

    let actualStart: Date | null = null;
    let actualEnd: Date | null = null;

    if (status === 'in_progress' || status === 'completed') {
      actualStart = new Date(scheduledStart.getTime() + randomInt(-30, 30) * 60 * 1000);
    }
    if (status === 'completed') {
      actualEnd = new Date(actualStart!.getTime() + randomInt(30, 180) * 60 * 1000);
    }

    jobs.push({
      id: uuidv4(),
      job_number: `JOB-${String(2024001 + i).padStart(7, '0')}`,
      customer_id: randomElement(customers).id,
      assigned_to: randomElement(technicians).id,
      status,
      priority: randomElement(priorities),
      title: randomElement(jobTitles),
      description: randomElement(jobDescriptions),
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      actual_start: actualStart,
      actual_end: actualEnd,
      checklist_template_id: randomElement(checklistTemplates).id,
      version: 1,
      created_at: seedTime,
      updated_at: seedTime,
    });
  }

  await db.insertInto('jobs').values(jobs).execute();
  console.log(`Created ${jobs.length} jobs`);

  await db.destroy();
  console.log('Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('  Admin: admin@fieldpulse.com / password123');
  console.log('  Technician: tech@fieldpulse.com / password123');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
