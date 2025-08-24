#!/usr/bin/env tsx

/**
 * ProofPay Seed Data Script
 * 
 * Creates realistic test data for demo and E2E testing:
 * - 2 test users (payer/worker) with avatars
 * - 1 Soft task with proof submission flow
 * - 1 zkTLS task with instant verification
 * - 1 Hybrid task with timer scenarios
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import fetch from 'node-fetch';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mchiibkcxzejravsckzc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Test users
const TEST_USERS = {
  payer: {
    wallet_address: 'xion1payer123456789abcdef123456789abcdef1234',
    username: 'alice_payer',
    display_name: 'Alice (Payer)',
    profile_picture: null as string | null,
  },
  worker: {
    wallet_address: 'xion1worker123456789abcdef123456789abcdef1234',
    username: 'bob_worker', 
    display_name: 'Bob (Worker)',
    profile_picture: null as string | null,
  }
};

// Test tasks data
const TEST_TASKS = {
  soft: {
    id: 'task_soft_demo_001',
    payer: TEST_USERS.payer.wallet_address,
    worker: TEST_USERS.worker.wallet_address,
    amount: 50,
    denom: 'uxion',
    proof_type: 'soft' as const,
    status: 'pending' as const,
    description: 'Create a social media post about ProofPay with hashtag #ProofPay',
    endpoint: 'https://twitter.com/user/status/example',
    review_window_secs: 86400, // 24 hours
    deadline_ts: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  },
  zktls: {
    id: 'task_zktls_demo_001', 
    payer: TEST_USERS.payer.wallet_address,
    worker: TEST_USERS.worker.wallet_address,
    amount: 100,
    denom: 'uxion',
    proof_type: 'zktls' as const,
    status: 'pending' as const,
    description: 'Complete GitHub commit with specific message',
    endpoint: 'https://api.github.com/repos/user/repo/commits',
    review_window_secs: 3600, // 1 hour
    deadline_ts: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
  },
  hybrid: {
    id: 'task_hybrid_demo_001',
    payer: TEST_USERS.payer.wallet_address,
    worker: TEST_USERS.worker.wallet_address,
    amount: 200,
    denom: 'uxion', 
    proof_type: 'hybrid' as const,
    status: 'pending' as const,
    description: 'Submit verified API response with zkTLS proof + manual review',
    endpoint: 'https://api.example.com/data',
    review_window_secs: 1800, // 30 minutes for demo
    deadline_ts: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
  }
};

async function createMockAvatar(username: string): Promise<Buffer> {
  // Create a simple colored square as avatar
  const canvas = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="${username.includes('payer') ? '#3B82F6' : '#10B981'}"/>
      <text x="50" y="55" font-family="Arial" font-size="14" fill="white" text-anchor="middle">
        ${username.charAt(0).toUpperCase()}${username.charAt(1).toUpperCase()}
      </text>
    </svg>
  `;
  
  return Buffer.from(canvas);
}

async function uploadAvatar(userId: string, username: string): Promise<string | null> {
  try {
    const avatarBuffer = await createMockAvatar(username);
    const fileName = `avatar-${userId}-${Date.now()}.svg`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('proofpay-files')
      .upload(filePath, avatarBuffer, {
        contentType: 'image/svg+xml',
        upsert: false
      });

    if (error) {
      console.error('Failed to upload avatar:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('proofpay-files')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Exception uploading avatar:', error);
    return null;
  }
}

async function createTestUsers(): Promise<void> {
  console.log('🔄 Creating test users...');

  for (const [role, userData] of Object.entries(TEST_USERS)) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', userData.wallet_address)
        .single();

      let userId: string;

      if (existingUser) {
        console.log(`✅ User ${role} already exists`);
        userId = existingUser.id;
      } else {
        // Create new user
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            wallet_address: userData.wallet_address,
            username: userData.username,
            display_name: userData.display_name,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) {
          console.error(`❌ Failed to create user ${role}:`, error);
          continue;
        }

        userId = newUser.id;
        console.log(`✅ Created user ${role}: ${userData.display_name}`);
      }

      // Upload avatar
      if (!userData.profile_picture) {
        const avatarUrl = await uploadAvatar(userId, userData.username);
        if (avatarUrl) {
          await supabase
            .from('users')
            .update({ profile_picture: avatarUrl })
            .eq('id', userId);
          
          userData.profile_picture = avatarUrl;
          console.log(`✅ Uploaded avatar for ${role}`);
        }
      }

    } catch (error) {
      console.error(`❌ Exception creating user ${role}:`, error);
    }
  }
}

async function createTestTasks(): Promise<void> {
  console.log('🔄 Creating test tasks...');

  for (const [type, taskData] of Object.entries(TEST_TASKS)) {
    try {
      // Check if task already exists
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', taskData.id)
        .single();

      if (existingTask) {
        console.log(`✅ Task ${type} already exists`);
        continue;
      }

      // Create new task using the SQL function
      const { error } = await supabase.rpc('upsert_task_from_event', {
        p_task_id: taskData.id,
        p_payer: taskData.payer,
        p_amount: taskData.amount,
        p_proof_type: taskData.proof_type,
        p_status: taskData.status,
        p_worker: taskData.worker,
        p_denom: taskData.denom,
        p_description: taskData.description,
        p_endpoint: taskData.endpoint,
        p_deadline_ts: taskData.deadline_ts,
        p_review_window_secs: taskData.review_window_secs
      });

      if (error) {
        console.error(`❌ Failed to create task ${type}:`, error);
        continue;
      }

      console.log(`✅ Created ${type} task: ${taskData.description.substring(0, 50)}...`);

      // Create initial activity feed entry
      await supabase
        .from('activity_feed')
        .insert({
          actor: taskData.payer,
          verb: 'created_task',
          task_id: taskData.id,
          meta: {
            amount: taskData.amount,
            denom: taskData.denom,
            proof_type: taskData.proof_type,
            worker: taskData.worker
          },
          created_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error(`❌ Exception creating task ${type}:`, error);
    }
  }
}

async function createMockProofSubmissions(): Promise<void> {
  console.log('🔄 Creating mock proof submissions...');

  // Submit proof for soft task
  try {
    await supabase.rpc('upsert_task_from_event', {
      p_task_id: TEST_TASKS.soft.id,
      p_payer: TEST_TASKS.soft.payer,
      p_amount: TEST_TASKS.soft.amount,
      p_proof_type: TEST_TASKS.soft.proof_type,
      p_status: 'proof_submitted',
      p_worker: TEST_TASKS.soft.worker,
      p_denom: TEST_TASKS.soft.denom,
      p_description: TEST_TASKS.soft.description,
      p_endpoint: TEST_TASKS.soft.endpoint,
      p_deadline_ts: TEST_TASKS.soft.deadline_ts,
      p_review_window_secs: TEST_TASKS.soft.review_window_secs
    });

    // Add evidence hash for soft task
    await supabase
      .from('tasks')
      .update({
        evidence_hash: 'sha256_mock_soft_evidence_12345',
        updated_at: new Date().toISOString(),
      })
      .eq('id', TEST_TASKS.soft.id);

    console.log('✅ Submitted proof for soft task');

    // Activity feed entry
    await supabase
      .from('activity_feed')
      .insert({
        actor: TEST_TASKS.soft.worker,
        verb: 'submitted_proof',
        task_id: TEST_TASKS.soft.id,
        meta: {
          proof_hash: 'sha256_mock_soft_evidence_12345',
          proof_type: 'soft'
        },
        created_at: new Date().toISOString(),
      });

  } catch (error) {
    console.error('❌ Failed to create soft proof submission:', error);
  }

  // Submit proof for zkTLS task and simulate instant verification
  try {
    await supabase.rpc('upsert_task_from_event', {
      p_task_id: TEST_TASKS.zktls.id,
      p_payer: TEST_TASKS.zktls.payer,
      p_amount: TEST_TASKS.zktls.amount,
      p_proof_type: TEST_TASKS.zktls.proof_type,
      p_status: 'released', // Instant release for zkTLS
      p_worker: TEST_TASKS.zktls.worker,
      p_denom: TEST_TASKS.zktls.denom,
      p_description: TEST_TASKS.zktls.description,
      p_endpoint: TEST_TASKS.zktls.endpoint,
      p_deadline_ts: TEST_TASKS.zktls.deadline_ts,
      p_review_window_secs: TEST_TASKS.zktls.review_window_secs
    });

    // Add zkTLS proof hash
    await supabase
      .from('tasks')
      .update({
        zk_proof_hash: 'zk_proof_hash_mock_verified_67890',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', TEST_TASKS.zktls.id);

    console.log('✅ Released zkTLS task instantly');

    // Activity feed entries
    await supabase
      .from('activity_feed')
      .insert([
        {
          actor: TEST_TASKS.zktls.worker,
          verb: 'submitted_proof',
          task_id: TEST_TASKS.zktls.id,
          meta: {
            zk_proof_hash: 'zk_proof_hash_mock_verified_67890',
            proof_type: 'zktls'
          },
          created_at: new Date(Date.now() - 1000).toISOString(),
        },
        {
          actor: TEST_TASKS.zktls.payer,
          verb: 'released_payment',
          task_id: TEST_TASKS.zktls.id,
          meta: {
            worker: TEST_TASKS.zktls.worker,
            amount: TEST_TASKS.zktls.amount,
            auto_verified: true
          },
          created_at: new Date().toISOString(),
        }
      ]);

  } catch (error) {
    console.error('❌ Failed to create zkTLS proof submission:', error);
  }

  // Submit proof for hybrid task and set pending release
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TEST_TASKS.hybrid.review_window_secs * 1000);

    await supabase.rpc('upsert_task_from_event', {
      p_task_id: TEST_TASKS.hybrid.id,
      p_payer: TEST_TASKS.hybrid.payer,
      p_amount: TEST_TASKS.hybrid.amount,
      p_proof_type: TEST_TASKS.hybrid.proof_type,
      p_status: 'pending_release',
      p_worker: TEST_TASKS.hybrid.worker,
      p_denom: TEST_TASKS.hybrid.denom,
      p_description: TEST_TASKS.hybrid.description,
      p_endpoint: TEST_TASKS.hybrid.endpoint,
      p_deadline_ts: TEST_TASKS.hybrid.deadline_ts,
      p_review_window_secs: TEST_TASKS.hybrid.review_window_secs
    });

    // Add hybrid proof data
    await supabase
      .from('tasks')
      .update({
        zk_proof_hash: 'zk_proof_hash_hybrid_pending_11111',
        verified_at: now.toISOString(),
        pending_release_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', TEST_TASKS.hybrid.id);

    console.log(`✅ Set hybrid task to pending release (expires in ${Math.round(TEST_TASKS.hybrid.review_window_secs / 60)} minutes)`);

    // Activity feed entry
    await supabase
      .from('activity_feed')
      .insert({
        actor: TEST_TASKS.hybrid.worker,
        verb: 'submitted_proof',
        task_id: TEST_TASKS.hybrid.id,
        meta: {
          zk_proof_hash: 'zk_proof_hash_hybrid_pending_11111',
          proof_type: 'hybrid',
          pending_release: true,
          expires_at: expiresAt.toISOString()
        },
        created_at: new Date().toISOString(),
      });

  } catch (error) {
    console.error('❌ Failed to create hybrid proof submission:', error);
  }
}

async function createTestNotifications(): Promise<void> {
  console.log('🔄 Creating test notifications...');

  // Get user IDs
  const { data: payerUser } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', TEST_USERS.payer.wallet_address)
    .single();

  const { data: workerUser } = await supabase
    .from('users')
    .select('id')
    .eq('wallet_address', TEST_USERS.worker.wallet_address)
    .single();

  if (!payerUser || !workerUser) {
    console.error('❌ Could not find user IDs for notifications');
    return;
  }

  const notifications = [
    {
      user_id: workerUser.id,
      type: 'task_created',
      task_id: TEST_TASKS.soft.id,
      title: '🎯 New Task Available!',
      message: '50 UXION - Create a social media post about ProofPay',
      payload: {
        wallet_address: TEST_USERS.worker.wallet_address,
        amount: '50',
        denom: 'uxion',
        proof_type: 'soft',
        payer: TEST_USERS.payer.wallet_address
      }
    },
    {
      user_id: payerUser.id,
      type: 'proof_submitted',
      task_id: TEST_TASKS.soft.id,
      title: '📋 Proof Submitted!',
      message: 'Worker submitted proof for your task. Review required.',
      payload: {
        wallet_address: TEST_USERS.payer.wallet_address,
        amount: '50',
        denom: 'uxion',
        proof_type: 'soft',
        worker: TEST_USERS.worker.wallet_address
      }
    },
    {
      user_id: workerUser.id,
      type: 'task_released',
      task_id: TEST_TASKS.zktls.id,
      title: '💰 Payment Received!',
      message: 'You received 100 UXION for completed task.',
      payload: {
        wallet_address: TEST_USERS.worker.wallet_address,
        amount: '100',
        denom: 'uxion',
        payer: TEST_USERS.payer.wallet_address
      }
    },
    {
      user_id: payerUser.id,
      type: 'pending_release_started',
      task_id: TEST_TASKS.hybrid.id,
      title: '⏳ Pending Release Started',
      message: 'Payment will auto-release unless disputed within review window.',
      payload: {
        wallet_address: TEST_USERS.payer.wallet_address,
        amount: '200',
        denom: 'uxion',
        expires_at: new Date(Date.now() + TEST_TASKS.hybrid.review_window_secs * 1000).toISOString(),
        review_window_secs: TEST_TASKS.hybrid.review_window_secs
      }
    }
  ];

  for (const notification of notifications) {
    try {
      await supabase
        .from('notifications')
        .insert({
          ...notification,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
    }
  }

  console.log(`✅ Created ${notifications.length} test notifications`);
}

async function clearExistingData(): Promise<void> {
  console.log('🔄 Clearing existing test data...');

  try {
    // Delete in dependency order
    await supabase.from('notifications').delete().in('task_id', Object.values(TEST_TASKS).map(t => t.id));
    await supabase.from('activity_feed').delete().in('task_id', Object.values(TEST_TASKS).map(t => t.id));
    await supabase.from('processed_events').delete().like('tx_hash', 'mock_%');
    await supabase.from('tasks').delete().in('id', Object.values(TEST_TASKS).map(t => t.id));
    await supabase.from('users').delete().in('wallet_address', Object.values(TEST_USERS).map(u => u.wallet_address));

    console.log('✅ Cleared existing test data');
  } catch (error) {
    console.error('❌ Failed to clear existing data:', error);
  }
}

async function printSummary(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED DATA SUMMARY');
  console.log('='.repeat(60));

  // Count records
  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
  const { count: notificationCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
  const { count: activityCount } = await supabase.from('activity_feed').select('*', { count: 'exact', head: true });

  console.log(`👥 Users: ${userCount}`);
  console.log(`📋 Tasks: ${taskCount}`);  
  console.log(`🔔 Notifications: ${notificationCount}`);
  console.log(`📈 Activity Entries: ${activityCount}`);

  console.log('\n📋 TEST TASKS:');
  console.log(`• Soft Task: ${TEST_TASKS.soft.id} (${TEST_TASKS.soft.amount} ${TEST_TASKS.soft.denom})`);
  console.log(`• zkTLS Task: ${TEST_TASKS.zktls.id} (${TEST_TASKS.zktls.amount} ${TEST_TASKS.zktls.denom})`);
  console.log(`• Hybrid Task: ${TEST_TASKS.hybrid.id} (${TEST_TASKS.hybrid.amount} ${TEST_TASKS.hybrid.denom})`);

  console.log('\n👥 TEST USERS:');
  console.log(`• Payer: ${TEST_USERS.payer.wallet_address}`);
  console.log(`• Worker: ${TEST_USERS.worker.wallet_address}`);

  console.log('\n✅ Demo data is ready! Run the app to see the test flows.');
  console.log('='.repeat(60));
}

async function main(): Promise<void> {
  console.log('🚀 ProofPay Seed Data Script');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);

  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear') || args.includes('-c');

  try {
    // Test connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error);
      process.exit(1);
    }

    if (shouldClear) {
      await clearExistingData();
    }

    await createTestUsers();
    await createTestTasks();
    await createMockProofSubmissions();
    await createTestNotifications();
    await printSummary();

  } catch (error) {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}