-- Atomic find-or-create for DM conversations.
-- Prevents duplicate conversations between the same two users caused by
-- double-clicks or race conditions in the client.
CREATE OR REPLACE FUNCTION find_or_create_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller     uuid := auth.uid();
  v_conv_id    uuid;
BEGIN
  -- Look for an existing 2-person conversation between caller and other_user_id
  SELECT cp1.conversation_id INTO v_conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_caller
    AND cp2.user_id = other_user_id
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create new conversation and add both participants atomically
  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, v_caller), (v_conv_id, other_user_id);

  RETURN v_conv_id;
END;
$$;

REVOKE ALL ON FUNCTION find_or_create_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_or_create_conversation(uuid) TO authenticated;
