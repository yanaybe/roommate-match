
-- Tighten conversation creation: require the creator to also add themselves as participant
DROP POLICY "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tighten participant insertion: user can only add themselves
DROP POLICY "Authenticated users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add themselves as participants"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
