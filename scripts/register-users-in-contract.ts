import { supabase } from '../lib/supabase';

// This script registers existing database users in the smart contract
// Run with: tsx scripts/register-users-in-contract.ts

async function registerExistingUsers() {
    try {
        console.log('🔍 Fetching users from database...');
        
        const { data: users, error } = await supabase
            .from('users')
            .select('*');
        
        if (error) {
            console.error('❌ Error fetching users:', error);
            return;
        }
        
        console.log('👥 Found', users?.length || 0, 'users in database:');
        
        users?.forEach(user => {
            console.log(`  - ${user.display_name} (@${user.handle})`);
            console.log(`    Wallet: ${user.wallet_address}`);
            console.log(`    Created: ${user.created_at}`);
            console.log('');
        });
        
        console.log('📝 To register these users in the smart contract, you need to:');
        console.log('1. Connect with their wallet addresses');
        console.log('2. Call registerUser() for each user');
        console.log('3. Or implement auto-registration on first app usage');
        
        console.log('\n💡 Suggestion: Add auto-registration to the wallet connection flow');
        
    } catch (error) {
        console.error('💥 Unexpected error:', error);
    }
}

registerExistingUsers();