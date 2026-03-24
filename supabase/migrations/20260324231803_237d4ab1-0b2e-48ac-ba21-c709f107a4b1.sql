
CREATE POLICY "Inviter can update own invite"
ON public.squad_invites
FOR UPDATE
TO authenticated
USING (auth.uid() = inviter_id)
WITH CHECK (auth.uid() = inviter_id);
