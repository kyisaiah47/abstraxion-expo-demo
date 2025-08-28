#!/usr/bin/env tsx

/**
 * Debug User Accounts
 * Check what's actually in the database
 */

import 'dotenv/config';
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

async function debugUsers() {
  console.log('🔍 DEBUG: All users in database');
  console.log('='.repeat(60));

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${users?.length || 0} users:`);
  console.log('');

  users?.forEach((user, index) => {
    console.log(`${index + 1}. Handle: ${user.handle || 'NULL'}`);
    console.log(`   Display Name: ${user.display_name || 'NULL'}`);
    console.log(`   Wallet Address: ${user.wallet_address}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    console.log('');
  });

  // Look for your specific wallet addresses
  console.log('🎯 Looking for your specific wallet addresses:');
  console.log('='.repeat(60));
  
  const yourWallets = [
    '2485ab34-c3f0-4d60-a194-6a32ccfb6306',
    '9fadcf56-21f6-4f22-9991-c9204c6e42ea',
    'xion12yrhw2huu9h2nd0jyahdntkg02p3kl3zmzumc0lvrywr4yvhscts7sdkuc'
  ];

  for (const wallet of yourWallets) {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    if (user) {
      console.log(`✅ FOUND: ${wallet}`);
      console.log(`   → Handle: ${user.handle}`);
      console.log(`   → Display Name: ${user.display_name}`);
    } else {
      console.log(`❌ NOT FOUND: ${wallet}`);
    }
    console.log('');
  }
}

debugUsers().catch(console.error);