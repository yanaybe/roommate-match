-- ─────────────────────────────────────────────────────────────────────────────
-- DB-level rate-limit for the reports table.
--
-- The client-side guard in useBlockReport.ts (10 reports/day) can be bypassed
-- via direct API calls, multiple tabs, or scripted requests. Moving the limit
-- to a BEFORE INSERT trigger makes it impossible to circumvent from the client.
--
-- Limit: 10 reports per reporter per 24-hour rolling window.
-- Violation: raises SQLSTATE 'P0001' with message 'report_rate_limit_exceeded'
-- so the client can map the error to a user-friendly message.
--
-- Implementation notes:
--   • SECURITY DEFINER + search_path = public prevents search_path hijacking.
--   • The function uses auth.uid() — the RLS INSERT policy already ensures
--     reporter_id = auth.uid(), so the rate limit is tied to the authenticated
--     user, not a client-supplied field.
--   • The existing RLS policy is kept; the trigger adds an additional layer.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_check_report_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_limit constant integer := 10;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM reports
  WHERE reporter_id = NEW.reporter_id
    AND created_at  > now() - interval '24 hours';

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'report_rate_limit_exceeded'
      USING HINT = 'You can submit at most 10 reports per 24 hours.',
            ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_rate_limit ON public.reports;

CREATE TRIGGER trg_report_rate_limit
  BEFORE INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_report_rate_limit();

-- ── Supporting index (covers the rate-limit query) ───────────────────────────
-- reporter_id + created_at (DESC) — needed by both the trigger and any admin
-- queries that audit recent reports per user.
CREATE INDEX IF NOT EXISTS idx_reports_reporter_created
  ON public.reports (reporter_id, created_at DESC);
