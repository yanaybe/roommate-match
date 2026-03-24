
-- Squads table
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  target_size INTEGER NOT NULL DEFAULT 3,
  budget_min INTEGER NOT NULL DEFAULT 0,
  budget_max INTEGER NOT NULL DEFAULT 10000,
  preferred_locations TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  no_smoking BOOLEAN NOT NULL DEFAULT false,
  pet_friendly BOOLEAN NOT NULL DEFAULT false,
  min_cleanliness INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Squad members table
CREATE TABLE public.squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited',
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

-- Squad likes table
CREATE TABLE public.squad_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  liked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, apartment_id, user_id)
);

-- Squad invites table
CREATE TABLE public.squad_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, invitee_id)
);

-- Security definer functions
CREATE OR REPLACE FUNCTION public.is_squad_member(_user_id UUID, _squad_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.squad_members
    WHERE user_id = _user_id AND squad_id = _squad_id AND status = 'joined'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_squad_creator(_user_id UUID, _squad_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.squads
    WHERE id = _squad_id AND creator_id = _user_id
  )
$$;

-- RLS for squads
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view squads" ON public.squads FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can create squads" ON public.squads FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Members can update squad" ON public.squads FOR UPDATE TO authenticated USING (is_squad_member(auth.uid(), id) OR auth.uid() = creator_id);
CREATE POLICY "Creator can delete squad" ON public.squads FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- RLS for squad_members
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view squad members" ON public.squad_members FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can insert squad members" ON public.squad_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_squad_creator(auth.uid(), squad_id) OR is_squad_member(auth.uid(), squad_id));
CREATE POLICY "Users can update own membership" ON public.squad_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users or creator can delete membership" ON public.squad_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR is_squad_creator(auth.uid(), squad_id));

-- RLS for squad_likes
ALTER TABLE public.squad_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Squad members can view likes" ON public.squad_likes FOR SELECT TO public USING (true);
CREATE POLICY "Squad members can insert likes" ON public.squad_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_squad_member(auth.uid(), squad_id));
CREATE POLICY "Users can update own likes" ON public.squad_likes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.squad_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS for squad_invites
ALTER TABLE public.squad_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invites" ON public.squad_invites FOR SELECT TO authenticated USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
CREATE POLICY "Squad members can send invites" ON public.squad_invites FOR INSERT TO authenticated WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Invitee can update invite" ON public.squad_invites FOR UPDATE TO authenticated USING (auth.uid() = invitee_id);
CREATE POLICY "Participants can delete invite" ON public.squad_invites FOR DELETE TO authenticated USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_likes;
