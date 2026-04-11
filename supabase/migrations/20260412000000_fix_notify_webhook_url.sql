-- Fix: hardcode the Edge Function URL instead of reading from app.supabase_project_ref
-- (ALTER DATABASE is not available on Lovable Cloud)

CREATE OR REPLACE FUNCTION call_notify_function(payload jsonb)
RETURNS void AS $$
DECLARE
  edge_url text := 'https://fwgyslyngfpjpditoiov.supabase.co/functions/v1/notify';
  webhook_secret text;
BEGIN
  -- Read webhook secret from app settings (optional — won't fail if not set)
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
