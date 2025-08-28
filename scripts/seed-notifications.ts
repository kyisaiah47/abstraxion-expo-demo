import { supabase } from '../lib/supabase';

async function seedNotifications() {
    try {
        console.log('🌱 Seeding sample notifications...');
        
        // Get Sam Rivera's user ID
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('handle', 'samr_dev')
            .single();
        
        if (userError || !user) {
            console.error('❌ User samr_dev not found:', userError);
            return;
        }
        
        console.log('👤 Found user ID:', user.id);
        
        // Sample notifications
        const notifications = [
            {
                user_id: user.id,
                type: 'task_created',
                title: 'New Task Request',
                message: 'Maya requested help with UI design - $125 XION',
                task_id: null,
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                read_at: null
            },
            {
                user_id: user.id,
                type: 'proof_submitted',
                title: 'Proof Submitted',
                message: 'You submitted proof for React component task',
                task_id: null,
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                read_at: null
            },
            {
                user_id: user.id,
                type: 'task_released',
                title: 'Payment Released!',
                message: 'Received $85.50 XION for database optimization',
                task_id: null,
                created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                read_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // Read 3 hours ago
            },
            {
                user_id: user.id,
                type: 'pending_release_started',
                title: 'Payment Pending',
                message: 'Payment release started - 24hr review period',
                task_id: null,
                created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                read_at: null
            }
        ];
        
        const { data, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select();
        
        if (error) {
            console.error('❌ Error inserting notifications:', error);
            return;
        }
        
        console.log('✅ Successfully created', data.length, 'notifications');
        console.log('📱 Notifications:', data);
        
    } catch (error) {
        console.error('💥 Unexpected error:', error);
    }
}

seedNotifications();