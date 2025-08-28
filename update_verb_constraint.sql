-- Drop the existing constraint
ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_verb_check;

-- Add new constraint with the verbs we need
ALTER TABLE activity_feed ADD CONSTRAINT activity_feed_verb_check 
CHECK (verb IN ('sent', 'received', 'requested', 'completed', 'disputed', 'resolved', 'request_money', 'request_task'));
