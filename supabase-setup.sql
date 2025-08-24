-- =====================================================
-- ProofPay Supabase Schema Setup
-- Execute these commands in the Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handle TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    avatar_hash TEXT,
    wallet_address TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, -- On-chain task ID
    payer TEXT NOT NULL, -- wallet address
    worker TEXT, -- wallet address (null until accepted)
    amount NUMERIC NOT NULL,
    denom TEXT NOT NULL DEFAULT 'uxion',
    proof_type TEXT NOT NULL CHECK (proof_type IN ('soft', 'zktls', 'hybrid')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'proof_submitted', 'pending_release', 'released', 'disputed', 'refunded')),
    description TEXT,
    endpoint TEXT, -- For zkTLS/hybrid tasks
    evidence_hash TEXT,
    zk_proof_hash TEXT,
    deadline_ts TIMESTAMPTZ,
    review_window_secs INTEGER DEFAULT 86400, -- 24 hours default for hybrid
    verified_at TIMESTAMPTZ, -- When proof was verified (for countdown)
    pending_release_expires_at TIMESTAMPTZ, -- Computed: verified_at + review_window_secs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proofs table
CREATE TABLE IF NOT EXISTS proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('soft', 'zktls')),
    blob_url TEXT, -- Storage URL for proof files
    blob_hash TEXT, -- SHA-256 hash for integrity
    metadata JSONB, -- zkTLS proof data, soft proof text, etc.
    submitted_by TEXT NOT NULL, -- wallet address
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    attachment_url TEXT, -- Storage URL for dispute evidence
    attachment_hash TEXT, -- SHA-256 hash for integrity
    raised_by TEXT NOT NULL, -- wallet address
    raised_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed'))
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task_created', 'proof_submitted', 'pending_release_started', 'task_released', 'task_disputed', 'task_refunded')),
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Activity feed table (public timeline)
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor TEXT NOT NULL, -- wallet address or system
    verb TEXT NOT NULL CHECK (verb IN ('created_task', 'accepted_task', 'submitted_proof', 'released_payment', 'disputed_task', 'resolved_dispute')),
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    meta JSONB DEFAULT '{}', -- Additional context data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_tasks_payer ON tasks(payer);
CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(worker);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_proof_type ON tasks(proof_type);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proofs_task_id ON proofs(task_id);
CREATE INDEX IF NOT EXISTS idx_disputes_task_id ON disputes(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- =====================================================
-- 3. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- 4. TRIGGER FOR COMPUTED PENDING RELEASE TIME
-- =====================================================

-- Function to compute pending_release_expires_at
CREATE OR REPLACE FUNCTION compute_pending_release_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Only compute for hybrid tasks when verified_at is set
    IF NEW.proof_type = 'hybrid' AND NEW.verified_at IS NOT NULL AND NEW.review_window_secs IS NOT NULL THEN
        NEW.pending_release_expires_at = NEW.verified_at + (NEW.review_window_secs || ' seconds')::INTERVAL;
    ELSE
        NEW.pending_release_expires_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_pending_release_expiry_trigger 
    BEFORE INSERT OR UPDATE ON tasks 
    FOR EACH ROW EXECUTE PROCEDURE compute_pending_release_expiry();

-- =====================================================
-- 5. STORAGE BUCKETS
-- =====================================================

-- Create storage buckets (execute these one by one in Supabase Dashboard > Storage)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('disputes', 'disputes', false) ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- ===== USERS POLICIES =====

-- Users can read all profiles (public social features)
CREATE POLICY "Users can read all profiles" ON users
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- ===== TASKS POLICIES =====

-- Tasks are readable by all (public feed) but hide sensitive data in views
CREATE POLICY "Tasks are publicly readable" ON tasks
    FOR SELECT USING (true);

-- Only indexer service can insert/update tasks (from contract events)
CREATE POLICY "Only indexer can modify tasks" ON tasks
    FOR ALL USING (auth.role() = 'service_role');

-- ===== PROOFS POLICIES =====

-- Proofs readable by task payer and worker
CREATE POLICY "Proofs readable by task participants" ON proofs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = proofs.task_id 
            AND (tasks.payer = auth.jwt()->>'wallet_address' OR tasks.worker = auth.jwt()->>'wallet_address')
        )
    );

-- Soft proofs can be inserted by task worker
CREATE POLICY "Workers can submit soft proofs" ON proofs
    FOR INSERT WITH CHECK (
        kind = 'soft' AND
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_id 
            AND tasks.worker = auth.jwt()->>'wallet_address'
            AND tasks.status = 'pending'
        )
    );

-- zkTLS proofs inserted by indexer service
CREATE POLICY "Indexer can insert zkTLS proofs" ON proofs
    FOR INSERT WITH CHECK (kind = 'zktls' AND auth.role() = 'service_role');

-- ===== DISPUTES POLICIES =====

-- Disputes readable by task participants
CREATE POLICY "Disputes readable by task participants" ON disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = disputes.task_id 
            AND (tasks.payer = auth.jwt()->>'wallet_address' OR tasks.worker = auth.jwt()->>'wallet_address')
        )
    );

-- Task payers can create disputes during review window
CREATE POLICY "Payers can create disputes" ON disputes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_id 
            AND tasks.payer = auth.jwt()->>'wallet_address'
            AND tasks.status = 'pending_release'
        )
    );

-- ===== NOTIFICATIONS POLICIES =====

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (
        user_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = notifications.user_id 
            AND users.wallet_address = auth.jwt()->>'wallet_address'
        )
    );

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        user_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = notifications.user_id 
            AND users.wallet_address = auth.jwt()->>'wallet_address'
        )
    );

-- Indexer service can insert notifications
CREATE POLICY "Indexer can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ===== ACTIVITY FEED POLICIES =====

-- Activity feed is publicly readable (sanitized view)
CREATE POLICY "Activity feed is publicly readable" ON activity_feed
    FOR SELECT USING (true);

-- Only indexer service can insert activity
CREATE POLICY "Only indexer can insert activity" ON activity_feed
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 7. STORAGE POLICIES
-- =====================================================

-- Avatars bucket - publicly readable, users can upload their own
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated'
    );

-- Proofs bucket - accessible by task participants only
CREATE POLICY "Proofs accessible by task participants" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'proofs' AND
        EXISTS (
            SELECT 1 FROM tasks, proofs
            WHERE proofs.blob_url LIKE '%' || storage.objects.name || '%'
            AND tasks.id = proofs.task_id
            AND (tasks.payer = auth.jwt()->>'wallet_address' OR tasks.worker = auth.jwt()->>'wallet_address')
        )
    );

CREATE POLICY "Workers can upload proof files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'proofs' AND
        auth.role() = 'authenticated'
    );

-- Disputes bucket - accessible by task participants only
CREATE POLICY "Dispute files accessible by task participants" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'disputes' AND
        EXISTS (
            SELECT 1 FROM tasks, disputes
            WHERE disputes.attachment_url LIKE '%' || storage.objects.name || '%'
            AND tasks.id = disputes.task_id
            AND (tasks.payer = auth.jwt()->>'wallet_address' OR tasks.worker = auth.jwt()->>'wallet_address')
        )
    );

CREATE POLICY "Users can upload dispute files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'disputes' AND
        auth.role() = 'authenticated'
    );

-- =====================================================
-- 8. VIEWS FOR PUBLIC DATA
-- =====================================================

-- Public tasks view (sanitized for public consumption)
CREATE OR REPLACE VIEW public_tasks AS
SELECT 
    id,
    amount,
    denom,
    proof_type,
    status,
    description,
    deadline_ts,
    review_window_secs,
    pending_release_expires_at,
    created_at,
    updated_at,
    -- Anonymized addresses (first 8 + last 4 chars)
    CONCAT(LEFT(payer, 8), '...', RIGHT(payer, 4)) as payer_preview,
    CASE 
        WHEN worker IS NOT NULL THEN CONCAT(LEFT(worker, 8), '...', RIGHT(worker, 4))
        ELSE NULL
    END as worker_preview
FROM tasks
WHERE status IN ('pending', 'proof_submitted', 'released'); -- Hide disputes/refunds for privacy

-- =====================================================
-- 9. FUNCTIONS FOR CONTRACT EVENT HANDLING
-- =====================================================

-- Function to upsert task from contract event
CREATE OR REPLACE FUNCTION upsert_task_from_event(
    p_task_id TEXT,
    p_payer TEXT,
    p_amount NUMERIC,
    p_proof_type TEXT,
    p_status TEXT,
    p_worker TEXT DEFAULT NULL,
    p_denom TEXT DEFAULT 'uxion',
    p_description TEXT DEFAULT NULL,
    p_endpoint TEXT DEFAULT NULL,
    p_deadline_ts TIMESTAMPTZ DEFAULT NULL,
    p_review_window_secs INTEGER DEFAULT 86400
) RETURNS void AS $$
BEGIN
    INSERT INTO tasks (id, payer, worker, amount, denom, proof_type, status, description, endpoint, deadline_ts, review_window_secs)
    VALUES (p_task_id, p_payer, p_worker, p_amount, p_denom, p_proof_type, p_status, p_description, p_endpoint, p_deadline_ts, p_review_window_secs)
    ON CONFLICT (id) DO UPDATE SET
        worker = COALESCE(EXCLUDED.worker, tasks.worker),
        status = EXCLUDED.status,
        description = COALESCE(EXCLUDED.description, tasks.description),
        endpoint = COALESCE(EXCLUDED.endpoint, tasks.endpoint),
        deadline_ts = COALESCE(EXCLUDED.deadline_ts, tasks.deadline_ts),
        verified_at = CASE 
            WHEN EXCLUDED.status = 'proof_submitted' THEN NOW()
            ELSE tasks.verified_at
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_wallet_address TEXT,
    p_type TEXT,
    p_task_id TEXT,
    p_title TEXT,
    p_message TEXT,
    p_payload JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
    notification_id UUID;
BEGIN
    -- Get user ID from wallet address
    SELECT id INTO user_uuid FROM users WHERE wallet_address = p_wallet_address;
    
    IF user_uuid IS NULL THEN
        RAISE NOTICE 'User not found for wallet: %', p_wallet_address;
        RETURN NULL;
    END IF;
    
    -- Insert notification
    INSERT INTO notifications (user_id, type, task_id, title, message, payload)
    VALUES (user_uuid, p_type, p_task_id, p_title, p_message, p_payload)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle task status change and create notifications
CREATE OR REPLACE FUNCTION handle_task_status_change() 
RETURNS TRIGGER AS $$
DECLARE
    notification_type TEXT;
    payer_title TEXT;
    payer_message TEXT;
    worker_title TEXT;
    worker_message TEXT;
BEGIN
    -- Only process status changes
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Determine notification type and messages based on new status
    CASE NEW.status
        WHEN 'proof_submitted' THEN
            notification_type := 'proof_submitted';
            payer_title := 'Proof Submitted! 📋';
            payer_message := 'Worker submitted proof for your task. Review required.';
            worker_title := 'Proof Submitted! ✅';
            worker_message := 'Your proof has been submitted and is under review.';
            
        WHEN 'pending_release' THEN
            notification_type := 'pending_release_started';
            payer_title := 'Pending Release ⏳';
            payer_message := 'Payment will auto-release unless disputed within review window.';
            worker_title := 'Pending Release ⏳';
            worker_message := 'Payment is pending release. Auto-release in progress.';
            
        WHEN 'released' THEN
            notification_type := 'task_released';
            payer_title := 'Payment Released 💸';
            payer_message := 'Payment has been released to worker.';
            worker_title := 'Payment Released! 💰';
            worker_message := 'You received payment for completed task.';
            
        WHEN 'disputed' THEN
            notification_type := 'task_disputed';
            payer_title := 'Task Disputed ⚠️';
            payer_message := 'Your dispute has been submitted for review.';
            worker_title := 'Task Disputed ⚠️';
            worker_message := 'Your task has been disputed. Review required.';
            
        WHEN 'refunded' THEN
            notification_type := 'task_refunded';
            payer_title := 'Payment Refunded 💰';
            payer_message := 'Your payment has been refunded due to dispute resolution.';
            worker_title := 'Task Refunded 📋';
            worker_message := 'Task payment was refunded to payer.';
            
        ELSE
            RETURN NEW; -- No notifications for other statuses
    END CASE;
    
    -- Create notifications for payer
    PERFORM create_notification(
        NEW.payer,
        notification_type,
        NEW.id,
        payer_title,
        payer_message,
        jsonb_build_object(
            'task_id', NEW.id,
            'amount', NEW.amount,
            'denom', NEW.denom,
            'proof_type', NEW.proof_type
        )
    );
    
    -- Create notifications for worker (if assigned)
    IF NEW.worker IS NOT NULL THEN
        PERFORM create_notification(
            NEW.worker,
            notification_type,
            NEW.id,
            worker_title,
            worker_message,
            jsonb_build_object(
                'task_id', NEW.id,
                'amount', NEW.amount,
                'denom', NEW.denom,
                'proof_type', NEW.proof_type
            )
        );
    END IF;
    
    -- Add to activity feed
    INSERT INTO activity_feed (actor, verb, task_id, meta)
    VALUES (
        COALESCE(NEW.worker, NEW.payer),
        CASE NEW.status
            WHEN 'proof_submitted' THEN 'submitted_proof'
            WHEN 'released' THEN 'released_payment'
            WHEN 'disputed' THEN 'disputed_task'
            WHEN 'refunded' THEN 'resolved_dispute'
            ELSE 'updated_task'
        END,
        NEW.id,
        jsonb_build_object(
            'status', NEW.status,
            'proof_type', NEW.proof_type,
            'amount', NEW.amount
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER task_status_change_trigger
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION handle_task_status_change();

-- =====================================================
-- 10. REALTIME SETUP
-- =====================================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;

-- =====================================================
-- 11. HELPER FUNCTIONS FOR SIGNED URLS
-- =====================================================

-- Function to get signed URL for proof files
CREATE OR REPLACE FUNCTION get_proof_signed_url(
    p_task_id TEXT,
    p_file_path TEXT,
    p_expiry_seconds INTEGER DEFAULT 3600
) RETURNS TEXT AS $$
DECLARE
    user_wallet TEXT;
    can_access BOOLEAN := FALSE;
BEGIN
    -- Get user's wallet address
    user_wallet := auth.jwt()->>'wallet_address';
    
    -- Check if user can access this proof
    SELECT EXISTS (
        SELECT 1 FROM tasks 
        WHERE id = p_task_id 
        AND (payer = user_wallet OR worker = user_wallet)
    ) INTO can_access;
    
    IF NOT can_access THEN
        RAISE EXCEPTION 'Access denied to proof file';
    END IF;
    
    -- Generate signed URL (this is a placeholder - actual implementation would use Supabase's storage API)
    RETURN format('https://your-supabase-url.supabase.co/storage/v1/object/sign/proofs/%s?token=signed&expires=%s', 
                   p_file_path, 
                   extract(epoch from now() + interval '1 second' * p_expiry_seconds));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. TEST DATA (OPTIONAL - FOR DEVELOPMENT)
-- =====================================================

-- Insert test users
INSERT INTO users (id, handle, display_name, wallet_address) VALUES
    ('00000000-0000-0000-0000-000000000001', 'alice', 'Alice Cooper', 'xion1alice123456789abcdef'),
    ('00000000-0000-0000-0000-000000000002', 'bob', 'Bob Builder', 'xion1bob123456789abcdef')
ON CONFLICT DO NOTHING;

-- Insert test task
INSERT INTO tasks (id, payer, worker, amount, proof_type, status, description) VALUES
    ('task_test_001', 'xion1alice123456789abcdef', 'xion1bob123456789abcdef', 100, 'hybrid', 'pending', 'Test task for development')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. USEFUL QUERIES FOR DEVELOPMENT
-- =====================================================

-- Query to check realtime subscriptions
-- SELECT * FROM pg_stat_subscription;

-- Query to see all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies WHERE schemaname = 'public';

-- Query to test notifications trigger
-- UPDATE tasks SET status = 'proof_submitted' WHERE id = 'task_test_001';

-- Query to see recent activity
-- SELECT * FROM activity_feed ORDER BY created_at DESC LIMIT 10;

-- Query to count notifications by type
-- SELECT type, COUNT(*) FROM notifications GROUP BY type;

-- =====================================================
-- SETUP COMPLETE! 
-- =====================================================

-- To verify the setup:
-- 1. Check that all tables exist: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- 2. Check that RLS is enabled: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- 3. Test realtime by updating a task status and checking for broadcasts
-- 4. Verify storage buckets in Supabase Dashboard > Storage
-- 5. Test notifications trigger by updating task status

-- Next steps:
-- 1. Set up your indexer service to call upsert_task_from_event() 
-- 2. Configure your app to listen to realtime changes
-- 3. Implement signed URL generation in your app
-- 4. Set up proper authentication with wallet addresses in JWT claims