#!/usr/bin/env tsx

/**
 * Create Realistic Social Network Activity
 * Matches the actual database schema
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mchiibkcxzejravsckzc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Your real wallet addresses
const REAL_USERS = [
  {
    wallet_address: '2485ab34-c3f0-4d60-a194-6a32ccfb6306',
    handle: 'isaiah_kim',
    display_name: 'Isaiah Kim'
  },
  {
    wallet_address: '9fadcf56-21f6-4f22-9991-c9204c6e42ea',
    handle: 'mayathedesigner', 
    display_name: 'Maya Chen'
  }
];

// Mock users for social activity
const MOCK_USERS = [
  { handle: 'alex_dev', display_name: 'Alex Rodriguez', wallet: 'xion1abc123def456ghi789jkl012mno345pqr678stu' },
  { handle: 'sarah_designer', display_name: 'Sarah Chen', wallet: 'xion1def456ghi789jkl012mno345pqr678stu901vwx' },
  { handle: 'mike_founder', display_name: 'Mike Johnson', wallet: 'xion1ghi789jkl012mno345pqr678stu901vwx234yza' },
  { handle: 'emma_dev', display_name: 'Emma Wilson', wallet: 'xion1jkl012mno345pqr678stu901vwx234yza567bcd' },
  { handle: 'david_pm', display_name: 'David Park', wallet: 'xion1mno345pqr678stu901vwx234yza567bcd890efg' },
  { handle: 'lisa_marketer', display_name: 'Lisa Wang', wallet: 'xion1pqr678stu901vwx234yza567bcd890efg123hij' },
  { handle: 'ryan_fullstack', display_name: 'Ryan Smith', wallet: 'xion1stu901vwx234yza567bcd890efg123hij456klm' },
  { handle: 'anna_ux', display_name: 'Anna Davis', wallet: 'xion1vwx234yza567bcd890efg123hij456klm789nop' },
  { handle: 'james_backend', display_name: 'James Brown', wallet: 'xion1yza567bcd890efg123hij456klm789nop012qrs' },
  { handle: 'olivia_frontend', display_name: 'Olivia Taylor', wallet: 'xion1bcd890efg123hij456klm789nop012qrs345tuv' }
];

// Task descriptions by proof type
const TASK_TEMPLATES = {
  zktls: [
    { description: 'Verify GitHub commit activity for open source contribution', amount: '45.5' },
    { description: 'Confirm LinkedIn profile experience claims', amount: '75.0' },
    { description: 'Validate API integration test results', amount: '120.0' },
    { description: 'Prove completion of online certification course', amount: '200.0' },
    { description: 'Verify database migration success metrics', amount: '90.75' }
  ],
  soft: [
    { description: 'Write comprehensive API documentation', amount: '150.0' },
    { description: 'Design user onboarding flow mockups', amount: '180.25' },
    { description: 'Create social media marketing strategy', amount: '95.5' },
    { description: 'Conduct user research interviews', amount: '220.0' },
    { description: 'Draft technical blog post about zkTLS', amount: '130.75' }
  ],
  hybrid: [
    { description: 'Code review + deploy to staging environment', amount: '250.0' },
    { description: 'UI testing + performance benchmark report', amount: '175.5' },
    { description: 'Security audit + penetration testing', amount: '300.25' },
    { description: 'Database optimization + query analysis', amount: '195.0' },
    { description: 'Mobile app testing + crash reporting', amount: '165.75' }
  ]
};

// Generate realistic timestamps
function getRandomPastDate(daysAgo: number = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return past.toISOString();
}

function randomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function createRealisticActivity() {
  try {
    
    // 1. Create mock user profiles
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

    // 2. Create diverse task activity
    const allUsers = [
      ...REAL_USERS.map(u => ({ handle: u.handle, wallet: u.wallet_address })),
      ...MOCK_USERS.map(u => ({ handle: u.handle, wallet: u.wallet }))
    ];

    const tasks = [];
    const proofTypes = ['zktls', 'soft', 'hybrid'] as const;
    
    for (let i = 0; i < 60; i++) {
      const proofType = proofTypes[Math.floor(Math.random() * proofTypes.length)];
      const template = TASK_TEMPLATES[proofType][Math.floor(Math.random() * TASK_TEMPLATES[proofType].length)];
      const payer = allUsers[Math.floor(Math.random() * allUsers.length)];
      const worker = allUsers[Math.floor(Math.random() * allUsers.length)];
      
      if (payer.handle === worker.handle) continue; // Skip self-transactions
      
      const createdAt = getRandomPastDate(30);
      const hasWorker = Math.random() > 0.2; // 80% have workers
      const isCompleted = hasWorker && Math.random() > 0.3; // 70% of assigned tasks are completed
      
      let status = 'pending';
      if (hasWorker) {
        if (isCompleted) {
          status = Math.random() > 0.8 ? 'pending_release' : 'released'; // 20% pending release
        } else {
          status = 'proof_submitted';
        }
      }
      
      tasks.push({
        id: randomId(),
        payer: payer.wallet,
        worker: hasWorker ? worker.wallet : null,
        amount: parseFloat(template.amount),
        denom: 'uxion',
        proof_type: proofType,
        status: status,
        description: template.description,
        endpoint: proofType !== 'soft' ? 'https://api.github.com/user/repos' : null,
        deadline_ts: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(), // Random deadline within 2 weeks
        review_window_secs: proofType === 'hybrid' ? 86400 : null, // 24 hours for hybrid
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

    // 3. Create activity feed entries
    const activities = [];
    
    tasks.forEach(task => {
      // Task creation activity
      activities.push({
        id: crypto.randomUUID(),
        actor: task.payer,
        verb: 'created_task',
        task_id: task.id,
        meta: { amount: task.amount, proof_type: task.proof_type },
        created_at: task.created_at,
      });

      // Task acceptance activity
      if (task.worker) {
        activities.push({
          id: crypto.randomUUID(),
          actor: task.worker,
          verb: 'accepted_task',
          task_id: task.id,
          meta: { amount: task.amount },
          created_at: new Date(new Date(task.created_at).getTime() + Math.random() * 2 * 60 * 60 * 1000).toISOString(), // Within 2 hours
        });
      }

      // Proof submission activity
      if (task.status !== 'pending') {
        activities.push({
          id: crypto.randomUUID(),
          actor: task.worker!,
          verb: 'submitted_proof',
          task_id: task.id,
          meta: { proof_type: task.proof_type },
          created_at: new Date(new Date(task.created_at).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Within a week
        });
      }

      // Payment release activity
      if (task.status === 'released') {
        activities.push({
          id: crypto.randomUUID(),
          actor: task.payer,
          verb: 'released_payment',
          task_id: task.id,
          meta: { amount: task.amount },
          created_at: task.updated_at,
        });
      }
    });

    const { error: activitiesError } = await supabase
      .from('activity_feed')
      .insert(activities);

    if (activitiesError) {
      console.error('❌ Error creating activity feed:', activitiesError);
    } else {
    }

    // 4. Create notifications for your accounts
    const { data: yourUsers } = await supabase
      .from('users')
      .select('id, handle')
      .in('handle', ['isaiah_kim', 'mayathedesigner']);

    if (yourUsers && yourUsers.length > 0) {
      const notifications = [];
      const notificationTypes = ['task_created', 'proof_submitted', 'pending_release_started', 'task_released'] as const;
      
      for (const user of yourUsers) {
        // Get some tasks for this user
        const userTasks = tasks.filter(t => t.payer === REAL_USERS.find(u => u.handle === user.handle)?.wallet_address).slice(0, 3);
        
        for (let i = 0; i < 8; i++) {
          const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
          const task = userTasks[Math.floor(Math.random() * Math.min(userTasks.length, 3))] || tasks[Math.floor(Math.random() * Math.min(tasks.length, 10))];
          
          let title, message;
          switch (type) {
            case 'task_created':
              title = 'New Task Available';
              message = `A new ${task.proof_type} task matching your skills was posted!`;
              break;
            case 'proof_submitted':
              title = 'Proof Submitted';
              message = `Proof submitted for: ${task.description.substring(0, 50)}...`;
              break;
            case 'pending_release_started':
              title = 'Payment Pending Release';
              message = `Your payment of ${task.amount} ${task.denom} will release in 24 hours.`;
              break;
            case 'task_released':
              title = 'Payment Released!';
              message = `You received ${task.amount} ${task.denom} for completed work.`;
              break;
          }

          notifications.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            type: type,
            task_id: task.id,
            title: title,
            message: message,
            payload: { amount: task.amount, proof_type: task.proof_type },
            created_at: getRandomPastDate(7),
            read_at: Math.random() > 0.4 ? getRandomPastDate(3) : null // 60% read
          });
        }
      }

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('❌ Error creating notifications:', notifError);
      } else {
      }
    }


  } catch (error) {
    console.error('❌ Error creating realistic activity:', error);
  }
}

// Run the script
createRealisticActivity().catch(console.error);