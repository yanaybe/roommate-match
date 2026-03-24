
DROP POLICY IF EXISTS "Auth users can insert squad members" ON public.squad_members;

CREATE POLICY "Auth users can insert squad members"
ON public.squad_members
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR is_squad_creator(auth.uid(), squad_id)
  OR is_squad_member(auth.uid(), squad_id)
);
