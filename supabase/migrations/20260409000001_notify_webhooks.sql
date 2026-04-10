-- =============================================================================
-- Database webhooks to trigger the `notify` Edge Function
-- Fires on: new messages, new profile likes (for match detection)
--
-- PREREQUISITES:
--   1. Deploy the Edge Function: supabase functions deploy notify
--   2. Set secrets: supabase secrets set RESEND_API_KEY=... FROM_EMAIL=...
--   3. Set WEBHOOK_SECRET (optional but recommended for security):
--        supabase secrets set WEBHOOK_SECRET=<random-string>
--   4. Run this migration
--
-- NOTE: This uses the pg_net extension (enabled by default on Supabase).
-- Replace YOUR_PROJECT_REF with your actual Supabase project ref.
-- =============================================================================

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- -------------------------
-- Helper: call notify function
-- -------------------------
CREATE OR REPLACE FUNCTION call_notify_function(payload jsonb)
RETURNS void AS $$
DECLARE
  project_ref text := current_setting('app.supabase_project_ref', true);
  webhook_secret text := current_setting('app.webhook_secret', true);
  edge_url text;
BEGIN
  -- Construct the Edge Function URL
  -- Set app.supabase_project_ref via: ALTER DATABASE postgres SET app.supabase_project_ref = 'your-ref';
  IF project_ref IS NULL OR project_ref = '' THEN
    RAISE WARNING 'app.supabase_project_ref not set — skipping notification webhook';
    RETURN;
  END IF;

  edge_url := 'https://' || project_ref || '.supabase.co/functions/v1/notify';

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

-- -------------------------
-- Trigger: new message → notify recipients
-- -------------------------
CREATE OR REPLACE FUNCTION trg_notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM call_notify_function(jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb,
    'old_record', NULL
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_message_notify ON messages;
CREATE TRIGGER trg_message_notify
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trg_notify_new_message();

-- -------------------------
-- Trigger: new like → detect match and notify
-- -------------------------
CREATE OR REPLACE FUNCTION trg_notify_new_like()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM call_notify_function(jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb,
    'old_record', NULL
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_like_notify ON liked_profiles;
CREATE TRIGGER trg_like_notify
  AFTER INSERT ON liked_profiles
  FOR EACH ROW EXECUTE FUNCTION trg_notify_new_like();

-- =============================================================================
-- FINAL STEP: Set your project ref so the webhook URL can be constructed.
-- Run this separately in the Supabase SQL editor after deployment:
--
--   ALTER DATABASE postgres SET app.supabase_project_ref = 'your-project-ref';
--   ALTER DATABASE postgres SET app.webhook_secret = 'your-webhook-secret';
--
-- Find your project ref in: Supabase Dashboard → Project Settings → General
-- =============================================================================
