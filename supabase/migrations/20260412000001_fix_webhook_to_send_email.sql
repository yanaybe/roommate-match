-- Redirect DB webhooks from `notify` → `send-email`
-- `notify` now handles in-app notifications only.
-- `send-email` handles Resend email delivery.

CREATE OR REPLACE FUNCTION call_email_function(payload jsonb)
RETURNS void AS $$
DECLARE
  edge_url text := 'https://fwgyslyngfpjpditoiov.supabase.co/functions/v1/send-email';
  webhook_secret text;
BEGIN
  BEGIN
    webhook_secret := current_setting('app.webhook_secret', true);
  EXCEPTION WHEN OTHERS THEN
    webhook_secret := NULL;
  END;

  PERFORM net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(webhook_secret, '')
    ),
    body := payload
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update message trigger to call send-email
CREATE OR REPLACE FUNCTION trg_email_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM call_email_function(jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb,
    'old_record', NULL
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_message_email ON messages;
CREATE TRIGGER trg_message_email
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trg_email_new_message();

-- Update like trigger to call send-email
CREATE OR REPLACE FUNCTION trg_email_new_like()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM call_email_function(jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb,
    'old_record', NULL
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_like_email ON liked_profiles;
CREATE TRIGGER trg_like_email
  AFTER INSERT ON liked_profiles
  FOR EACH ROW EXECUTE FUNCTION trg_email_new_like();
