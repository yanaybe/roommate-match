
-- Allow users to delete conversations they are part of
CREATE POLICY "Users can delete own conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (is_conversation_member(auth.uid(), id));

-- Allow users to delete their own participation records
CREATE POLICY "Users can delete own participation"
ON public.conversation_participants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete messages in their conversations
CREATE POLICY "Users can delete messages in own conversations"
ON public.messages
FOR DELETE
TO authenticated
USING (is_conversation_member(auth.uid(), conversation_id));

-- Allow users to delete read receipts for messages in their conversations
CREATE POLICY "Users can delete read receipts in own conversations"
ON public.message_read_receipts
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM messages m
  WHERE m.id = message_read_receipts.message_id
  AND is_conversation_member(auth.uid(), m.conversation_id)
));
