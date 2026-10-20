-- Add WITH CHECK to every FOR UPDATE policy that only had USING.
--
-- USING decides which rows a user may update. WITH CHECK validates the row
-- *after* the update. With USING alone, Postgres accepts whatever the row
-- becomes, so a user who owns a row can rewrite any column on it — including
-- the ownership column that USING relies on. Concretely, before this
-- migration a user could:
--   * squad_members: change their own row's squad_id or role, joining or
--     taking over a squad they were never invited to;
--   * squad_invites: rewrite invitee_id or squad_id to forge an invite;
--   * squad_likes: move a vote onto another user or squad;
--   * notifications: hand their own notification row to another user.
--
-- Each policy below is recreated with WITH CHECK mirroring its USING clause,
-- so the row must still belong to the caller once the update is applied.

-- squads ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members can update squad" ON public.squads;
CREATE POLICY "Members can update squad" ON public.squads
  FOR UPDATE TO authenticated
  USING (is_squad_member(auth.uid(), id) OR auth.uid() = creator_id)
  WITH CHECK (is_squad_member(auth.uid(), id) OR auth.uid() = creator_id);

-- squad_members ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own membership" ON public.squad_members;
CREATE POLICY "Users can update own membership" ON public.squad_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- squad_likes ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own likes" ON public.squad_likes;
CREATE POLICY "Users can update own likes" ON public.squad_likes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_squad_member(auth.uid(), squad_id));

-- squad_invites ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Invitee can update invite" ON public.squad_invites;
CREATE POLICY "Invitee can update invite" ON public.squad_invites
  FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id);

-- notifications ──────────────────────────────────────────────────────────────
-- Two migrations created an update policy for this table under slightly
-- different names; drop both and leave one.
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
