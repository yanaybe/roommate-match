
CREATE TABLE public.squad_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can view messages"
  ON public.squad_messages FOR SELECT
  TO authenticated
  USING (is_squad_member(auth.uid(), squad_id));

CREATE POLICY "Squad members can send messages"
  ON public.squad_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id AND is_squad_member(auth.uid(), squad_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_messages;
