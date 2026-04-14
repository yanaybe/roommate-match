
-- Tighten squad_members INSERT policy.
--
-- The previous policy allowed any authenticated user to insert themselves into
-- any squad with just `auth.uid() = user_id`, bypassing the invite system.
-- The new policy requires either:
--   (a) the inserting user is the squad creator, OR
--   (b) the user is inserting themselves AND there is a valid pending invite
--       addressed to them for that squad.

DROP POLICY IF EXISTS "Auth users can insert squad members" ON public.squad_members;

CREATE POLICY "Auth users can insert squad members"
ON public.squad_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Squad creator can add any user
  is_squad_creator(auth.uid(), squad_id)
  OR (
    -- Regular users can only add themselves when they have a pending invite
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.squad_invites
      WHERE squad_invites.squad_id = squad_members.squad_id
        AND squad_invites.invitee_id = auth.uid()
        AND squad_invites.status = 'pending'
    )
  )
);
