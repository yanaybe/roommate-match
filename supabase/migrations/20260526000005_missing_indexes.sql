-- ─────────────────────────────────────────────────────────────────────────────
-- Missing performance indexes.
--
-- These tables are hit on every page load / swipe and were missing indexes on
-- their most common lookup columns, causing sequential scans at scale.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── liked_profiles ───────────────────────────────────────────────────────────
-- UNIQUE(user_id, liked_user_id) covers forward-direction lookups
-- (who did I like?).  The reverse direction — "who liked me?" — is used by:
--   • useProfileStats (likes-received count)
--   • find_or_create_conversation mutual-like guard
--   • Roommates.tsx mutual-like check after a right swipe
-- Without this index those queries scan the entire table.
CREATE INDEX IF NOT EXISTS idx_liked_profiles_liked_user
  ON public.liked_profiles (liked_user_id);

-- Additional index on created_at for ordered pagination of likes received.
CREATE INDEX IF NOT EXISTS idx_liked_profiles_user_created
  ON public.liked_profiles (user_id, created_at DESC);

-- ── profile_views ────────────────────────────────────────────────────────────
-- useProfileStats queries: SELECT COUNT(*) FROM profile_views WHERE profile_id = $1
-- Without an index this is a full-table scan that grows unbounded.
CREATE INDEX IF NOT EXISTS idx_profile_views_profile
  ON public.profile_views (profile_id, viewed_at DESC);
