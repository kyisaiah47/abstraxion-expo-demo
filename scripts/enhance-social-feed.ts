#!/usr/bin/env tsx

/**
 * Enhance Social Feed with More Activity
 * Creates realistic activity feed entries and notifications
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mchiibkcxzejravsckzc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function getRandomRecentDate(hoursAgo = 72) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * hoursAgo * 60 * 60 * 1000);
  return past.toISOString();
}

async function enhanceSocialFeed() {
  try {

    // Get all tasks and users
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .limit(20);
    
    const { data: users } = await supabase
      .from('users')
      .select('*');

    if (!tasks || !users) {
      return;
    }

    // Create activity feed entries
    const activities = [];
    const verbs = ['created_task', 'accepted_task', 'submitted_proof', 'released_payment'];
    
    tasks.forEach(task => {
      // Random number of activities per task (1-3)
      const numActivities = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numActivities; i++) {
        const verb = verbs[Math.min(i, verbs.length - 1)]; // Progress through verbs
        const actor = i === 0 ? task.payer : (task.worker || task.payer);
        
        activities.push({
          id: crypto.randomUUID(),
          actor: actor,
          verb: verb,
          task_id: task.id,
          meta: {
            amount: task.amount,
            proof_type: task.proof_type,
            description: task.description?.substring(0, 50) || 'Task activity'
          },
          created_at: getRandomRecentDate(72 - i * 20) // Spread activities over time
        });
      }
    });

    const { error: activityError } = await supabase
      .from('activity_feed')
      .insert(activities);
    
    if (activityError) {
      console.error('❌ Error creating activity feed:', activityError);
    } else {
    }

    // Create notifications for your real accounts
    const { data: realUsers } = await supabase
      .from('users')
      .select('*')
      .in('handle', ['isaiah_kim', 'mayathedesigner']);

    if (realUsers && realUsers.length > 0) {
      const notifications = [];
      const notificationTypes = [
        { type: 'task_created', title: 'New Task Available', message: 'A new task matching your skills was posted!' },
        { type: 'proof_submitted', title: 'Proof Submitted', message: 'Proof was submitted for your task.' },
        { type: 'task_released', title: 'Payment Released!', message: 'You received payment for completed work.' },
        { type: 'pending_release_started', title: 'Payment Pending', message: 'Your payment will release soon.' }
      ];

      for (const user of realUsers) {
        for (let i = 0; i < 6; i++) {
          const notif = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
          const task = tasks[Math.floor(Math.random() * Math.min(tasks.length, 10))];
          
          notifications.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            type: notif.type as any,
            task_id: task.id,
            title: notif.title,
            message: `${notif.message} Amount: ${task.amount} ${task.denom}`,
            payload: { amount: task.amount, task_id: task.id },
            created_at: getRandomRecentDate(48),
            read_at: Math.random() > 0.3 ? getRandomRecentDate(24) : null // 70% read
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
    console.error('❌ Error enhancing social feed:', error);
  }
}

enhanceSocialFeed().catch(console.error);