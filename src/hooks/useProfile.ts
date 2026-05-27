import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileData } from "@/lib/matching";

const PAGE_SIZE = 50;

export interface FullProfile extends ProfileData {
  id: string;
  user_id: string;
  avatar_url: string | null;
  onboarding_complete: boolean;
  created_at: string;
  phone_verified?: boolean;
  phone_number?: string | null;
  // Fields added in later migrations — explicitly typed here to eliminate (as any) casts
  photos?: string[];
  gender?: string | null;
  subscription_tier?: string;
  subscription_expires_at?: string | null;
  paddle_customer_id?: string | null;
  paddle_subscription_id?: string | null;
  instant_message_credits?: number;
  highlighted_until?: string | null;
  weekly_boosts_remaining?: number;
  gold_boost_used_at?: string | null;
  platinum_boost_used_at_1?: string | null;
  platinum_boost_used_at_2?: string | null;
  platinum_boost_used_at_3?: string | null;
  profile_visibility?: string | null;
  notification_matches?: boolean;
  notification_messages?: boolean;
  notification_squad_invites?: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProfile(data as FullProfile | null);
      }
      setLoading(false);
    };

    load();
  }, [user]);

  const refetch = useCallback(async () => {
    if (!user) return;
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!fetchError) setProfile(data as FullProfile | null);
  }, [user]);

  return { profile, loading, error, refetch };
}

/**
 * Fetch a single profile by user_id.
 * Preferred over useAllProfiles() when only one profile is needed (e.g.
 * RoommateProfile page), since loading the full paginated list just to find
 * one row is wasteful and breaks for profiles outside the first page.
 */
export function useProfileById(profileUserId: string | undefined) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileUserId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", profileUserId)
      // Hidden profiles are invisible to other users (treat as not found).
      // The user's own profile is always visible regardless of visibility setting.
      .or(`user_id.eq.${user?.id ?? "00000000-0000-0000-0000-000000000000"},profile_visibility.neq.hidden`)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setProfile(data as FullProfile | null);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [profileUserId, user?.id]);

  return { profile, loading, error };
}

const TIER_ORDER: Record<string, number> = {
  platinum: 0,
  gold: 1,
  plus: 2,
  free: 3,
};

interface UseAllProfilesOptions {
  /** When provided, only profiles in this city are fetched (case-insensitive). */
  city?: string;
}

export function useAllProfiles(options?: UseAllProfilesOptions) {
  const { user } = useAuth();
  const city = options?.city ?? null;
  const [profiles, setProfiles] = useState<FullProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  // cursor = created_at of the last fetched row; null = first page
  const [cursor, setCursor] = useState<string | null>(null);

  const loadPage = useCallback(async (afterCursor: string | null) => {
    let query = supabase
      .from("profiles")
      .select("*, profile_visibility")
      .eq("onboarding_complete", true)
      .neq("profile_visibility", "hidden")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    // Server-side city filter — avoids downloading all profiles when the user
    // has a city preference. Uses ilike for case-insensitive matching.
    if (city) {
      query = query.ilike("city", city);
    }

    if (afterCursor) {
      query = query.lt("created_at", afterCursor);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const raw = (data as unknown as FullProfile[]) ?? [];
      // Client-side filter kept as UI safety net; server-side .neq() above is the real guard.
      const batch = raw.filter((p) => {
        if (p.user_id === user?.id) return true;
        return p.profile_visibility !== "hidden";
      });
      // Sort: platinum first, then gold, then plus, then free
      batch.sort((a, b) => {
        const aOrder = TIER_ORDER[a.subscription_tier ?? "free"] ?? 3;
        const bOrder = TIER_ORDER[b.subscription_tier ?? "free"] ?? 3;
        return aOrder - bOrder;
      });
      setProfiles((prev) => (afterCursor === null ? batch : [...prev, ...batch]));
      setHasMore(raw.length === PAGE_SIZE);
      if (raw.length > 0) {
        setCursor(raw[raw.length - 1].created_at as unknown as string);
      }
    }
    setLoading(false);
  }, [user?.id, city]);

  useEffect(() => {
    // Reset pagination whenever the city filter changes.
    setProfiles([]);
    setCursor(null);
    setHasMore(true);
    setLoading(true);
    loadPage(null);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadPage(cursor);
  }, [hasMore, loading, cursor, loadPage]);

  return { profiles, loading, error, hasMore, loadMore };
}
