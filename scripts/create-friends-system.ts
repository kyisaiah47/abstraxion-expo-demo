#!/usr/bin/env tsx

/**
 * Create Friends System
 * Adds friends table and connections for social network
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

async function createFriendsSystem() {
  try {

    // 1. Create friends table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS friends (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, friend_id),
        CHECK (user_id != friend_id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
      CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
      CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

      -- RLS Policies
      ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

      -- Users can read their own friendships
      CREATE POLICY IF NOT EXISTS "Users can read own friendships" ON friends
        FOR SELECT USING (
          user_id IN (SELECT id FROM users WHERE wallet_address = auth.jwt()->>'wallet_address')
          OR friend_id IN (SELECT id FROM users WHERE wallet_address = auth.jwt()->>'wallet_address')
        );

      -- Users can create friend requests
      CREATE POLICY IF NOT EXISTS "Users can create friend requests" ON friends
        FOR INSERT WITH CHECK (
          user_id IN (SELECT id FROM users WHERE wallet_address = auth.jwt()->>'wallet_address')
        );

      -- Users can update their own friendships (accept/decline)
      CREATE POLICY IF NOT EXISTS "Users can update own friendships" ON friends
        FOR UPDATE USING (
          friend_id IN (SELECT id FROM users WHERE wallet_address = auth.jwt()->>'wallet_address')
        );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (tableError) {
    } else {
    }

    // 2. Get all users to create connections
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, handle, wallet_address');

    if (usersError || !users) {
      console.error('❌ Error getting users:', usersError);
      return;
    }

    // Find your real accounts
    const isaiahUser = users.find(u => u.handle === 'isaiah_kim');
    const mayaUser = users.find(u => u.handle === 'mayathedesigner');
    const mockUsers = users.filter(u => !['isaiah_kim', 'mayathedesigner'].includes(u.handle));

    if (!isaiahUser || !mayaUser) {
      console.error('❌ Could not find your user accounts');
      return;
    }


    // 3. Create friendships
    const friendships = [];

    // Make your two accounts friends with each other
    friendships.push({
      user_id: isaiahUser.id,
      friend_id: mayaUser.id,
      status: 'accepted',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    });

    // Make each of your accounts friends with 4-5 mock users
    const isaiahFriends = mockUsers.slice(0, 4);
    const mayaFriends = mockUsers.slice(2, 7); // Some overlap

    for (const friend of isaiahFriends) {
      friendships.push({
        user_id: isaiahUser.id,
        friend_id: friend.id,
        status: 'accepted',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    for (const friend of mayaFriends) {
      friendships.push({
        user_id: mayaUser.id,
        friend_id: friend.id,
        status: 'accepted',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Create some pending friend requests for realism
    if (mockUsers.length > 7) {
      friendships.push({
        user_id: mockUsers[7].id,
        friend_id: isaiahUser.id,
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      });

      if (mockUsers.length > 8) {
        friendships.push({
          user_id: mockUsers[8].id,
          friend_id: mayaUser.id,
          status: 'pending',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        });
      }
    }

    // Insert friendships
    const { error: friendshipsError } = await supabase
      .from('friends')
      .insert(friendships);

    if (friendshipsError) {
      console.error('❌ Error creating friendships:', friendshipsError);
      return;
    }


    // 4. Summary

  } catch (error) {
    console.error('❌ Error creating friends system:', error);
  }
}

createFriendsSystem().catch(console.error);