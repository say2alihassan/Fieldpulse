#!/usr/bin/env tsx
/**
 * Test Push Notification Script
 *
 * Usage:
 *   npm run notify                           # Send test notification to first user
 *   npm run notify -- --email=user@test.com  # Send to specific user by email
 *   npm run notify -- --user-id=uuid         # Send to specific user by ID
 *   npm run notify -- --type=job_assigned    # Specify notification type
 *   npm run notify -- --job-id=uuid          # Use specific job
 *   npm run notify -- --list-users           # List all users with FCM tokens
 *   npm run notify -- --list-jobs            # List jobs for a user
 */

import { db } from '../db/index.js';
import { pushService } from '../services/push.js';
import { config } from '../utils/config.js';

// Parse command line arguments
function parseArgs(): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};

  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value ?? true;
    }
  });

  return args;
}

async function listUsersWithTokens() {
  console.log('\n📱 Users with registered FCM tokens:\n');

  const users = await db
    .selectFrom('users')
    .innerJoin('device_tokens', 'users.id', 'device_tokens.user_id')
    .select([
      'users.id',
      'users.email',
      'users.full_name',
      'device_tokens.platform',
      'device_tokens.device_name',
      'device_tokens.last_used_at',
    ])
    .execute();

  if (users.length === 0) {
    console.log('  No users with registered FCM tokens found.');
    console.log('  Make sure you have logged into the app on a device.\n');
    return;
  }

  const grouped = users.reduce((acc, user) => {
    if (!acc[user.id]) {
      acc[user.id] = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        devices: [],
      };
    }
    acc[user.id].devices.push({
      platform: user.platform,
      deviceName: user.device_name,
      lastUsed: user.last_used_at,
    });
    return acc;
  }, {} as Record<string, any>);

  Object.values(grouped).forEach((user: any) => {
    console.log(`  👤 ${user.fullName} (${user.email})`);
    console.log(`     ID: ${user.id}`);
    user.devices.forEach((device: any) => {
      console.log(`     📱 ${device.platform} - ${device.deviceName}`);
      if (device.lastUsed) {
        console.log(`        Last used: ${new Date(device.lastUsed).toLocaleString()}`);
      }
    });
    console.log('');
  });
}

async function listJobsForUser(userId: string) {
  console.log('\n📋 Jobs for user:\n');

  const jobs = await db
    .selectFrom('jobs')
    .select(['id', 'job_number', 'title', 'status', 'scheduled_start'])
    .where('assigned_to', '=', userId)
    .orderBy('scheduled_start', 'desc')
    .limit(10)
    .execute();

  if (jobs.length === 0) {
    console.log('  No jobs found for this user.\n');
    return;
  }

  jobs.forEach(job => {
    const scheduled = job.scheduled_start
      ? new Date(job.scheduled_start).toLocaleString()
      : 'Not scheduled';
    console.log(`  📝 Job #${job.job_number}: ${job.title}`);
    console.log(`     ID: ${job.id}`);
    console.log(`     Status: ${job.status}`);
    console.log(`     Scheduled: ${scheduled}`);
    console.log('');
  });
}

async function sendTestNotification(args: Record<string, string | boolean>) {
  const type = (args['type'] as string) || 'job_assigned';

  // Find user
  let user;
  if (args['user-id']) {
    user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', args['user-id'] as string)
      .executeTakeFirst();
  } else if (args['email']) {
    user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', args['email'] as string)
      .executeTakeFirst();
  } else {
    // Get first user with FCM token
    const userWithToken = await db
      .selectFrom('users')
      .innerJoin('device_tokens', 'users.id', 'device_tokens.user_id')
      .select(['users.id', 'users.email', 'users.full_name'])
      .limit(1)
      .executeTakeFirst();

    if (userWithToken) {
      user = await db
        .selectFrom('users')
        .selectAll()
        .where('id', '=', userWithToken.id)
        .executeTakeFirst();
    }
  }

  if (!user) {
    console.error('\n❌ No user found. Make sure you have logged into the app.\n');
    console.log('Available options:');
    console.log('  --email=user@test.com  Send to specific user by email');
    console.log('  --user-id=uuid         Send to specific user by ID');
    console.log('  --list-users           List all users with FCM tokens\n');
    process.exit(1);
  }

  console.log(`\n👤 Sending to: ${user.full_name} (${user.email})`);

  // Find job
  let job;
  if (args['job-id']) {
    job = await db
      .selectFrom('jobs')
      .selectAll()
      .where('id', '=', args['job-id'] as string)
      .executeTakeFirst();
  } else {
    job = await db
      .selectFrom('jobs')
      .selectAll()
      .where('assigned_to', '=', user.id)
      .orderBy('scheduled_start', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  if (!job) {
    console.log('\n⚠️  No job found. Sending generic test notification...\n');

    const result = await pushService.sendToUser(user.id, {
      title: 'Test Notification',
      body: 'This is a test notification from FieldPulse',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      console.log('✅ Test notification sent successfully!');
      console.log(`   Devices: ${result.total}, Successful: ${result.successful}, Failed: ${result.failed}\n`);
    } else {
      console.log('❌ Failed to send notification');
      console.log(`   Error: ${result.error}\n`);
    }
    return;
  }

  console.log(`📋 Job: #${job.job_number} - ${job.title}`);
  console.log(`📨 Type: ${type}\n`);

  // Create payload based on type
  let payload;
  switch (type) {
    case 'job_updated':
      payload = pushService.createJobUpdatedPayload(job.job_number, job.title, job.id);
      break;
    case 'job_reminder':
      const scheduledTime = job.scheduled_start
        ? new Date(job.scheduled_start).toLocaleString()
        : 'soon';
      payload = pushService.createJobReminderPayload(job.job_number, job.title, job.id, scheduledTime);
      break;
    case 'job_cancelled':
      payload = pushService.createJobCancelledPayload(job.job_number, job.title);
      break;
    case 'job_assigned':
    default:
      payload = pushService.createJobAssignedPayload(job.job_number, job.title, job.id);
      break;
  }

  console.log('Payload:');
  console.log(`  Title: ${payload.title}`);
  console.log(`  Body: ${payload.body}`);
  console.log(`  Data: ${JSON.stringify(payload.data)}\n`);

  const result = await pushService.sendToUser(user.id, payload);

  if (result.success) {
    console.log('✅ Notification sent successfully!');
    console.log(`   Devices: ${result.total}, Successful: ${result.successful}, Failed: ${result.failed}`);
    console.log('\n🔔 Check your device for the notification!\n');
  } else {
    console.log('❌ Failed to send notification');
    console.log(`   Error: ${result.error}\n`);
  }
}

async function main() {
  console.log('\n🔔 FieldPulse Push Notification Test Script');
  console.log('==========================================');

  // Check FCM status
  const status = pushService.getStatus();
  if (!status.initialized) {
    console.error('\n❌ Firebase Cloud Messaging is not initialized!');
    console.log('   Make sure FIREBASE_SERVICE_ACCOUNT_PATH is set in .env\n');
    process.exit(1);
  }
  console.log('✅ FCM initialized\n');

  const args = parseArgs();

  try {
    if (args['list-users']) {
      await listUsersWithTokens();
    } else if (args['list-jobs']) {
      const userId = args['user-id'] as string;
      if (!userId) {
        // Get first user with token
        const user = await db
          .selectFrom('users')
          .innerJoin('device_tokens', 'users.id', 'device_tokens.user_id')
          .select(['users.id'])
          .limit(1)
          .executeTakeFirst();

        if (user) {
          await listJobsForUser(user.id);
        } else {
          console.log('No users found. Use --user-id=uuid to specify a user.\n');
        }
      } else {
        await listJobsForUser(userId);
      }
    } else {
      await sendTestNotification(args);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
