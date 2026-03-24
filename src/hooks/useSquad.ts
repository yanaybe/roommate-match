import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type FullProfile } from "@/hooks/useProfile";
import { calculateSquadMatch } from "@/lib/matching";

export interface Squad {
  id: string;
  creator_id: string;
  name: string;
  target_size: number;
  budget_min: number;
  budget_max: number;
  preferred_locations: string[];
  status: string;
  no_smoking: boolean;
  pet_friendly: boolean;
  min_cleanliness: number;
  created_at: string;
  updated_at: string;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  user_id: string;
  status: string;
  role: string;
  joined_at: string;
  profile?: FullProfile;
}

export interface SquadInvite {
  id: string;
  squad_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  squad?: Squad;
  inviter_profile?: FullProfile;
}

export interface SquadLike {
  id: string;
  squad_id: string;
  apartment_id: string;
  user_id: string;
  liked: boolean;
  created_at: string;
}

export function useMySquads() {
  const { user } = useAuth();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Get squads where user is a member
    const { data: memberships } = await supabase
      .from("squad_members")
      .select("squad_id")
      .eq("user_id", user.id)
      .eq("status", "joined");

    if (!memberships?.length) {
      setSquads([]);
      setLoading(false);
      return;
    }

    const squadIds = memberships.map((m) => m.squad_id);
    const { data } = await supabase
      .from("squads")
      .select("*")
      .in("id", squadIds);

    setSquads((data as Squad[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { squads, loading, refetch: load };
}

export function useSquadDetail(squadId: string | null) {
  const { user } = useAuth();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [likes, setLikes] = useState<SquadLike[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!squadId) { setLoading(false); return; }

    const [squadRes, membersRes, likesRes] = await Promise.all([
      supabase.from("squads").select("*").eq("id", squadId).maybeSingle(),
      supabase.from("squad_members").select("*").eq("squad_id", squadId).eq("status", "joined"),
      supabase.from("squad_likes").select("*").eq("squad_id", squadId),
    ]);

    setSquad(squadRes.data as Squad | null);

    // Fetch profiles for members
    const rawMembers = (membersRes.data ?? []) as SquadMember[];
    if (rawMembers.length > 0) {
      const userIds = rawMembers.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      rawMembers.forEach((m) => { m.profile = profileMap.get(m.user_id) as FullProfile | undefined; });
    }

    setMembers(rawMembers);
    setLikes((likesRes.data ?? []) as SquadLike[]);
    setLoading(false);
  }, [squadId]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscriptions
  useEffect(() => {
    if (!squadId) return;

    const channel = supabase
      .channel(`squad:${squadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "squad_members", filter: `squad_id=eq.${squadId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "squad_likes", filter: `squad_id=eq.${squadId}` }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [squadId, load]);

  return { squad, members, likes, loading, refetch: load };
}

export function useMyInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<SquadInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("squad_invites")
      .select("*")
      .eq("invitee_id", user.id)
      .eq("status", "pending");

    const rawInvites = (data ?? []) as SquadInvite[];

    // Fetch squad and inviter details
    if (rawInvites.length > 0) {
      const squadIds = [...new Set(rawInvites.map((i) => i.squad_id))];
      const inviterIds = [...new Set(rawInvites.map((i) => i.inviter_id))];

      const [squadsRes, profilesRes] = await Promise.all([
        supabase.from("squads").select("*").in("id", squadIds),
        supabase.from("profiles").select("*").in("user_id", inviterIds),
      ]);

      const squadMap = new Map((squadsRes.data ?? []).map((s: any) => [s.id, s]));
      const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p]));

      rawInvites.forEach((inv) => {
        inv.squad = squadMap.get(inv.squad_id) as Squad | undefined;
        inv.inviter_profile = profileMap.get(inv.inviter_id) as FullProfile | undefined;
      });
    }

    setInvites(rawInvites);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`invites:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "squad_invites" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  return { invites, loading, refetch: load };
}

export interface DiscoverableSquad extends Squad {
  members: SquadMember[];
  member_count: number;
  creator_profile?: FullProfile;
  matchPercent: number;
}

export function useDiscoverSquads() {
  const { user } = useAuth();
  const [squads, setSquads] = useState<DiscoverableSquad[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Get all non-full squads the user is NOT already a member of
    const { data: allSquads } = await supabase
      .from("squads")
      .select("*")
      .in("status", ["draft", "forming"]);

    if (!allSquads?.length) {
      setSquads([]);
      setLoading(false);
      return;
    }

    const squadIds = allSquads.map((s: any) => s.id);

    // Get all members for these squads
    const { data: allMembers } = await supabase
      .from("squad_members")
      .select("*")
      .in("squad_id", squadIds)
      .eq("status", "joined");

    const membersBySquad = new Map<string, SquadMember[]>();
    (allMembers ?? []).forEach((m: any) => {
      const list = membersBySquad.get(m.squad_id) ?? [];
      list.push(m as SquadMember);
      membersBySquad.set(m.squad_id, list);
    });

    // Check pending invites for this user
    const { data: pendingInvites } = await supabase
      .from("squad_invites")
      .select("squad_id")
      .eq("invitee_id", user.id)
      .eq("status", "pending");
    const pendingSquadIds = new Set((pendingInvites ?? []).map((i: any) => i.squad_id));

    // Filter: user is not a member, squad not full, no pending invite
    const discoverable = (allSquads as Squad[]).filter((s) => {
      const members = membersBySquad.get(s.id) ?? [];
      const isMember = members.some((m) => m.user_id === user.id);
      const isFull = members.length >= s.target_size;
      const hasPending = pendingSquadIds.has(s.id);
      return !isMember && !isFull && !hasPending;
    });

    // Get creator profiles
    const creatorIds = [...new Set(discoverable.map((s) => s.creator_id))];
    const { data: creatorProfiles } = creatorIds.length > 0
      ? await supabase.from("profiles").select("*").in("user_id", creatorIds)
      : { data: [] };
    const profileMap = new Map((creatorProfiles ?? []).map((p: any) => [p.user_id, p]));

    const result: DiscoverableSquad[] = discoverable.map((s) => {
      const members = membersBySquad.get(s.id) ?? [];
      return {
        ...s,
        members,
        member_count: members.length,
        creator_profile: profileMap.get(s.creator_id) as FullProfile | undefined,
      };
    });

    setSquads(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { squads, loading, refetch: load };
}
