
-- Create security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

-- Fix conversation_participants SELECT policy (infinite recursion)
DROP POLICY "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Fix conversations SELECT policy to use the function too
DROP POLICY "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (public.is_conversation_member(auth.uid(), id));

-- Fix messages SELECT policy
DROP POLICY "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Fix messages INSERT policy
DROP POLICY "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    public.is_conversation_member(auth.uid(), conversation_id)
  );

-- Fix read receipts SELECT policy
DROP POLICY "Users can view read receipts in their conversations" ON public.message_read_receipts;
CREATE POLICY "Users can view read receipts in their conversations"
  ON public.message_read_receipts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_read_receipts.message_id
      AND public.is_conversation_member(auth.uid(), m.conversation_id)
  ));
