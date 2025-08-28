#!/usr/bin/env tsx

/**
 * Create Simple Social Network Activity
 * Focus on core functionality that works
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mchiibkcxzejravsckzc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaGlpYmtjeHplanJhdnNja3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0NTA2MSwiZXhwIjoyMDcxNjIxMDYxfQ.I_0fdEqhwhH5Y3kiXNUCSpCglgxMt5qqskhtdDULufE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Mock users for social activity
const MOCK_USERS = [
  { handle: 'alex_dev', display_name: 'Alex Rodriguez', wallet: 'xion1abc123def456ghi789jkl012mno345pqr678stu' },
  { handle: 'sarah_designer', display_name: 'Sarah Chen', wallet: 'xion1def456ghi789jkl012mno345pqr678stu901vwx' },
  { handle: 'mike_founder', display_name: 'Mike Johnson', wallet: 'xion1ghi789jkl012mno345pqr678stu901vwx234yza' },
  { handle: 'emma_dev', display_name: 'Emma Wilson', wallet: 'xion1jkl012mno345pqr678stu901vwx234yza567bcd' },
  { handle: 'david_pm', display_name: 'David Park', wallet: 'xion1mno345pqr678stu901vwx234yza567bcd890efg' },
  { handle: 'lisa_marketer', display_name: 'Lisa Wang', wallet: 'xion1pqr678stu901vwx234yza567bcd890efg123hij' },
  { handle: 'ryan_fullstack', display_name: 'Ryan Smith', wallet: 'xion1stu901vwx234yza567bcd890efg123hij456klm' },
  { handle: 'anna_ux', display_name: 'Anna Davis', wallet: 'xion1vwx234yza567bcd890efg123hij456klm789nop' }
];

// Your real users
const REAL_USERS = [
  { handle: 'isaiah_kim', wallet: '2485ab34-c3f0-4d60-a194-6a32ccfb6306' },
  { handle: 'mayathedesigner', wallet: '9fadcf56-21f6-4f22-9991-c9204c6e42ea' }
];

// Simple task templates
const TASKS = [
  { description: 'Fix responsive design bug on mobile dashboard', amount: 45.5, type: 'zktls' },
  { description: 'Write API documentation for user auth', amount: 120.0, type: 'soft' },
  { description: 'Implement dark mode toggle', amount: 75.25, type: 'hybrid' },
  { description: 'Code review for payment module', amount: 200.0, type: 'zktls' },
  { description: 'Design user onboarding mockups', amount: 90.75, type: 'soft' },
  { description: 'Optimize database queries', amount: 150.0, type: 'hybrid' },
  { description: 'Test payment integration', amount: 85.5, type: 'zktls' },
  { description: 'Create social media content', amount: 65.25, type: 'soft' },
  { description: 'Implement notifications system', amount: 180.0, type: 'hybrid' },
  { description: 'Security audit of auth flows', amount: 250.0, type: 'zktls' },
  { description: 'Mobile app performance testing', amount: 135.75, type: 'hybrid' },
  { description: 'User research interview analysis', amount: 95.0, type: 'soft' }
];

function getRandomPastDate(daysAgo = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return past.toISOString();
}

function randomId() {
  return Math.random().toString(36).substring(2, 15);
}

async function createSimpleActivity() {
  try {
    console.log('🚀 Creating simple social activity...');
    
    // 1. Create mock users
    console.log('👥 Creating mock users...');
    const mockUserData = MOCK_USERS.map(user => ({
      id: crypto.randomUUID(),
      wallet_address: user.wallet,
      handle: user.handle,
      display_name: user.display_name,
      created_at: getRandomPastDate(60),
      updated_at: getRandomPastDate(30)
    }));

    const { error: usersError } = await supabase
      .from('users')
      .upsert(mockUserData, { onConflict: 'wallet_address' });
    
    if (usersError) {
      console.error('❌ Error creating users:', usersError);
      return;
    }
    console.log(`✅ Created ${MOCK_USERS.length} mock users!`);

    // 2. Create tasks between all users (including your real accounts)
    console.log('📋 Creating tasks...');
    const allUsers = [
      ...REAL_USERS,
      ...MOCK_USERS.map(u => ({ handle: u.handle, wallet: u.wallet }))
    ];

    const tasks = [];
    for (let i = 0; i < 40; i++) {
      const template = TASKS[Math.floor(Math.random() * TASKS.length)];
      const payer = allUsers[Math.floor(Math.random() * allUsers.length)];
      const worker = allUsers[Math.floor(Math.random() * allUsers.length)];
      
      if (payer.handle === worker.handle) continue;
      
      const createdAt = getRandomPastDate(30);
      const isCompleted = Math.random() > 0.4; // 60% completion rate
      
      tasks.push({
        id: randomId(),
        payer: payer.wallet,
        worker: worker.wallet,
        amount: template.amount,
        denom: 'uxion',
        proof_type: template.type,
        status: isCompleted ? 'released' : (Math.random() > 0.5 ? 'pending' : 'proof_submitted'),
        description: template.description,
        created_at: createdAt,
        updated_at: isCompleted ? getRandomPastDate(7) : createdAt,
      });
    }

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks);
    
    if (tasksError) {
      console.error('❌ Error creating tasks:', tasksError);
      return;
    }
    console.log(`✅ Created ${tasks.length} tasks!`);

    console.log('\n🎉 SOCIAL ACTIVITY CREATED!');
    console.log('='.repeat(50));
    console.log(`👥 Mock Users: ${MOCK_USERS.length}`);
    console.log(`📋 Tasks: ${tasks.length}`);
    console.log('');
    console.log('✨ Your accounts now have:');
    console.log('  • Active payment history');
    console.log('  • Transactions with other users'); 
    console.log('  • Mix of completed and pending tasks');
    console.log('  • Diverse task types and amounts');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSimpleActivity().catch(console.error);