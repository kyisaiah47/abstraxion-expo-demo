-- First, check what verbs currently exist in the table
SELECT DISTINCT verb FROM activity_feed;

-- Update any existing rows that might conflict (if needed)
-- UPDATE activity_feed SET verb = 'sent' WHERE verb NOT IN ('sent', 'received', 'requested', 'completed', 'disputed', 'resolved', 'request_money', 'request_task');

-- Drop the existing constraint
ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_verb_check;

-- Add new constraint with all the verbs we need
ALTER TABLE activity_feed ADD CONSTRAINT activity_feed_verb_check 
CHECK (verb IN ('sent', 'received', 'requested', 'completed', 'disputed', 'resolved', 'request_money', 'request_task'));
