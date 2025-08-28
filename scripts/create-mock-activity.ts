#!/usr/bin/env tsx

/**
 * Create Mock Social Activity
 * Creates realistic social network activity for your existing accounts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mchiibkcxzejravsckzc.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Your real wallet addresses
const REAL_USERS = [
  {
    wallet_address: '2485ab34-c3f0-4d60-a194-6a32ccfb6306',
    username: 'isaiah_kim',
    display_name: 'Isaiah Kim'
  },
  {
    wallet_address: '9fadcf56-21f6-4f22-9991-c9204c6e42ea',
    username: 'mayathedesigner', 
    display_name: 'Maya Chen'
  }
];

// Mock users to create social activity
const MOCK_USERS = [
  { username: 'alex_dev', display_name: 'Alex Rodriguez', wallet: 'xion1abc123def456ghi789jkl012mno345pqr678stu' },
  { username: 'sarah_designer', display_name: 'Sarah Chen', wallet: 'xion1def456ghi789jkl012mno345pqr678stu901vwx' },
  { username: 'mike_founder', display_name: 'Mike Johnson', wallet: 'xion1ghi789jkl012mno345pqr678stu901vwx234yza' },
  { username: 'emma_dev', display_name: 'Emma Wilson', wallet: 'xion1jkl012mno345pqr678stu901vwx234yza567bcd' },
  { username: 'david_pm', display_name: 'David Park', wallet: 'xion1mno345pqr678stu901vwx234yza567bcd890efg' },
  { username: 'lisa_marketer', display_name: 'Lisa Wang', wallet: 'xion1pqr678stu901vwx234yza567bcd890efg123hij' },
  { username: 'ryan_fullstack', display_name: 'Ryan Smith', wallet: 'xion1stu901vwx234yza567bcd890efg123hij456klm' },
  { username: 'anna_ux', display_name: 'Anna Davis', wallet: 'xion1vwx234yza567bcd890efg123hij456klm789nop' },
  { username: 'james_backend', display_name: 'James Brown', wallet: 'xion1yza567bcd890efg123hij456klm789nop012qrs' },
  { username: 'olivia_frontend', display_name: 'Olivia Taylor', wallet: 'xion1bcd890efg123hij456klm789nop012qrs345tuv' }
];

// Task types and descriptions
const TASK_TEMPLATES = [
  { type: 'zktls', description: 'Fix responsive design bug on mobile dashboard', amount: '45.5', denom: 'uxion' },
  { type: 'soft', description: 'Write API documentation for user authentication', amount: '120.0', denom: 'uxion' },
  { type: 'hybrid', description: 'Implement dark mode toggle component', amount: '75.25', denom: 'uxion' },
  { type: 'zktls', description: 'Code review for payment processing module', amount: '200.0', denom: 'uxion' },
  { type: 'soft', description: 'Design user onboarding flow mockups', amount: '90.75', denom: 'uxion' },
  { type: 'hybrid', description: 'Optimize database queries for user dashboard', amount: '150.0', denom: 'uxion' },
  { type: 'zktls', description: 'Test payment integration with staging environment', amount: '85.5', denom: 'uxion' },
  { type: 'soft', description: 'Create social media content calendar', amount: '65.25', denom: 'uxion' },
  { type: 'hybrid', description: 'Implement real-time notifications system', amount: '180.0', denom: 'uxion' },
  { type: 'zktls', description: 'Security audit of authentication flows', amount: '250.0', denom: 'uxion' }
];

// Generate realistic timestamps
function getRandomPastDate(daysAgo: number = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return past.toISOString();
}

// Create mock tasks with realistic interactions
async function createMockActivity() {
  try {
    
    // Create mock user profiles (this might fail due to RLS, but that's ok)
    const mockUserData = MOCK_USERS.map(user => ({
      id: crypto.randomUUID(),
      wallet_address: user.wallet,
      handle: user.username,
      display_name: user.display_name,
      profile_picture: null,
      created_at: getRandomPastDate(60),
      updated_at: getRandomPastDate(30)
    }));

    // Try to insert mock users (might fail due to RLS policies)
    for (const userData of mockUserData) {
      try {
        const { error } = await supabase
          .from('users')
          .insert(userData);
        
        if (error) {
        } else {
        }
      } catch (e) {
      }
    }

    // Create diverse task activity
    const allUsers = [
      ...REAL_USERS.map(u => ({ username: u.username, wallet: u.wallet_address })),
      ...MOCK_USERS.map(u => ({ username: u.username, wallet: u.wallet }))
    ];

    const tasks = [];
    for (let i = 0; i < 50; i++) {
      const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
      const payer = allUsers[Math.floor(Math.random() * allUsers.length)];
      const worker = allUsers[Math.floor(Math.random() * allUsers.length)];
      
      if (payer.username === worker.username) continue; // Skip self-transactions
      
      const createdAt = getRandomPastDate(30);
      const isCompleted = Math.random() > 0.3; // 70% completion rate
      const status = isCompleted ? 'released' : 
                    (Math.random() > 0.5 ? 'pending_release' : 'accepted');
      
      tasks.push({
        id: crypto.randomUUID(),
        payer: payer.wallet,
        worker: worker.wallet,
        task_type: template.type,
        description: template.description,
        amount: template.amount,
        denom: template.denom,
        status: status,
        created_at: createdAt,
        updated_at: isCompleted ? getRandomPastDate(7) : createdAt,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      });
    }

    // Insert tasks
    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks);
    
    if (tasksError) {
      console.error('❌ Error creating tasks:', tasksError);
    } else {
    }

    // Create activity feed entries
    const activities = tasks
      .filter(task => task.status === 'released')
      .map(task => ({
        id: crypto.randomUUID(),
        task_id: task.id,
        activity_type: 'task_completed',
        description: `Completed: ${task.description}`,
        created_at: task.updated_at,
      }));

    const { error: activitiesError } = await supabase
      .from('activity_feed')
      .insert(activities);

    if (activitiesError) {
    } else {
    }

    // Create some notifications for your accounts
    const notifications = [];
    
    // Get your user IDs
    const { data: yourUsers } = await supabase
      .from('users')
      .select('id, handle')
      .in('handle', ['isaiah_kim', 'mayathedesigner']);

    if (yourUsers && yourUsers.length > 0) {
      for (const user of yourUsers) {
        // Create some notifications
        for (let i = 0; i < 5; i++) {
          notifications.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            title: 'New Task Available',
            message: `A new ${TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)].type} task was posted that matches your skills!`,
            type: 'task_available',
            created_at: getRandomPastDate(7),
            read_at: Math.random() > 0.5 ? getRandomPastDate(3) : null // 50% read
          });
        }
      }

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
      } else {
      }
    }


  } catch (error) {
    console.error('❌ Error creating mock activity:', error);
  }
}

// Run the script
createMockActivity().catch(console.error);