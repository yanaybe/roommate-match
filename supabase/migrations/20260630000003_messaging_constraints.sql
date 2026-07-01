-- Add message length constraint at DB level (client checks 2000 chars but can be bypassed)
ALTER TABLE messages
  ADD CONSTRAINT IF NOT EXISTS messages_content_length
  CHECK (char_length(content) <= 2000);

-- Message rate limiting trigger (max 20 messages per user per minute)
CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM messages
  WHERE sender_id = NEW.sender_id
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'rate_limit_exceeded' USING HINT = 'Max 20 messages per minute';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_rate_limit ON messages;
CREATE TRIGGER trg_message_rate_limit
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION check_message_rate_limit();
