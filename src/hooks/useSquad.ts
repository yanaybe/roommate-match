import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["my-squads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships, error: membErr } = await supabase
        .from("squad_members")
        .select("squad_id")
        .eq("user_id", user!.id)
        .eq("status", "joined");
      if (membErr) throw new Error(membErr.message);
      if (!memberships?.length) return [] as Squad[];

      const squadIds = memberships.map((m) => m.squad_id);
      const { data: squads, error: squadErr } = await supabase
        .from("squads")
        .select("*")
        .in("id", squadIds);
      if (squadErr) throw new Error(squadErr.message);
      return (squads as Squad[]) ?? [];
    },
  });

  const load = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    squads: data ?? [],
    loading: !!user && isPending,
    error: error instanceof Error ? error.message : null,
    refetch: load,
  };
}

export function useSquadDetail(squadId: string | null) {
  const { user } = useAuth();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [likes, setLikes] = useState<SquadLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!squadId) { setLoading(false); return; }

    const [squadRes, membersRes, likesRes] = await Promise.all([
      supabase.from("squads").select("*").eq("id", squadId).maybeSingle(),
      supabase.from("squad_members").select("*").eq("squad_id", squadId).eq("status", "joined"),
      supabase.from("squad_likes").select("*").eq("squad_id", squadId),
    ]);

    const firstError = squadRes.error ?? membersRes.error ?? likesRes.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setSquad(squadRes.data as Squad | null);

    const rawMembers = (membersRes.data ?? []) as SquadMember[];
    if (rawMembers.length > 0) {
      const userIds = rawMembers.map((m) => m.user_id);
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      if (profilesErr) {
        setError(profilesErr.message);
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return { squad, members, likes, loading, error, refetch: load };
}

export function useMyInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<SquadInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data, error: invitesErr } = await supabase
      .from("squad_invites")
      .select("*")
      .eq("invitee_id", user.id)
      .eq("status", "pending");

    if (invitesErr) {
      setError(invitesErr.message);
      setLoading(false);
      return;
    }

    const rawInvites = (data ?? []) as SquadInvite[];

    if (rawInvites.length > 0) {
      const squadIds = [...new Set(rawInvites.map((i) => i.squad_id))];
      const inviterIds = [...new Set(rawInvites.map((i) => i.inviter_id))];

      const [squadsRes, profilesRes] = await Promise.all([
        supabase.from("squads").select("*").in("id", squadIds),
        supabase.from("profiles").select("*").in("user_id", inviterIds),
      ]);

      const fetchError = squadsRes.error ?? profilesRes.error;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const squadMap = new Map((squadsRes.data ?? []).map((s: any) => [s.id, s]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return { invites, loading, error, refetch: load };
}

export interface DiscoverableSquad extends Squad {
  members: SquadMember[];
  member_count: number;
  creator_profile?: FullProfile;
  matchPercent: number;
}

export function useDiscoverSquads() {
  const { user } = useAuth();
  const { profile: myProfile } = useProfile();
  const [squads, setSquads] = useState<DiscoverableSquad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data: allSquads, error: squadsErr } = await supabase
      .from("squads")
      .select("*")
      .in("status", ["draft", "forming"]);

    if (squadsErr) {
      setError(squadsErr.message);
      setLoading(false);
      return;
    }

    if (!allSquads?.length) {
      setSquads([]);
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const squadIds = allSquads.map((s: any) => s.id);

    const { data: allMembers, error: membersErr } = await supabase
      .from("squad_members")
      .select("*")
      .in("squad_id", squadIds)
      .eq("status", "joined");

    if (membersErr) {
      setError(membersErr.message);
      setLoading(false);
      return;
    }

    const membersBySquad = new Map<string, SquadMember[]>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (allMembers ?? []).forEach((m: any) => {
      const list = membersBySquad.get(m.squad_id) ?? [];
      list.push(m as SquadMember);
      membersBySquad.set(m.squad_id, list);
    });

    const { data: pendingInvites } = await supabase
      .from("squad_invites")
      .select("squad_id")
      .eq("invitee_id", user.id)
      .eq("status", "pending");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingSquadIds = new Set((pendingInvites ?? []).map((i: any) => i.squad_id));

    // The creator is part of the squad even if their squad_members row is
    // missing (legacy/seed squads predate the auto-insert on creation).
    const effectiveCount = (s: Squad) => {
      const members = membersBySquad.get(s.id) ?? [];
      return members.some((m) => m.user_id === s.creator_id) ? members.length : members.length + 1;
    };

    const discoverable = (allSquads as Squad[]).filter((s) => {
      const members = membersBySquad.get(s.id) ?? [];
      const isMember = members.some((m) => m.user_id === user.id);
      const isFull = effectiveCount(s) >= s.target_size;
      const hasPending = pendingSquadIds.has(s.id);
      return !isMember && !isFull && !hasPending;
    });

    // Fetch ALL member + creator profiles for matching
    const allUserIds = new Set<string>();
    discoverable.forEach((s) => {
      allUserIds.add(s.creator_id);
      (membersBySquad.get(s.id) ?? []).forEach((m) => allUserIds.add(m.user_id));
    });

    const { data: allProfilesData } = allUserIds.size > 0
      ? await supabase.from("profiles").select("*").in("user_id", [...allUserIds])
      : { data: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileMap = new Map((allProfilesData ?? []).map((p: any) => [p.user_id, p as FullProfile]));

    const result: DiscoverableSquad[] = discoverable.map((s) => {
      const members = membersBySquad.get(s.id) ?? [];
      const memberProfiles = members
        .map((m) => profileMap.get(m.user_id))
        .filter(Boolean) as FullProfile[];

      const matchPercent = myProfile
        ? calculateSquadMatch(myProfile, s, memberProfiles)
        : 0;

      return {
        ...s,
        members,
        member_count: effectiveCount(s),
        creator_profile: profileMap.get(s.creator_id),
        matchPercent,
      };
    });

    // Sort by match descending
    result.sort((a, b) => b.matchPercent - a.matchPercent);

    setSquads(result);
    setLoading(false);
  }, [user, myProfile]);

  useEffect(() => { load(); }, [load]);

  return { squads, loading, error, refetch: load };
}
