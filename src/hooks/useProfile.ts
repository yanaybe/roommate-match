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

  return { profile, loading, error, refetch: async () => {
    if (!user) return;
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!fetchError) setProfile(data as FullProfile | null);
  }};
}

const TIER_ORDER: Record<string, number> = {
  platinum: 0,
  gold: 1,
  plus: 2,
  free: 3,
};

// TODO [POST-LAUNCH]: No rate limiting on profile listing. The anon key is public and
// anyone can paginate through all profiles without authentication, scraping the full
// user base (names, ages, cities, photos). At scale this is a privacy and competitor risk.
// Fix: move this query behind a Supabase Edge Function that enforces per-IP or per-user
// rate limiting (e.g. 10 requests/minute) using Vercel Edge Middleware or Cloudflare Workers.
export function useAllProfiles() {
  const { user } = useAuth();
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
        return (p as any).profile_visibility !== "hidden";
      });
      // Sort: platinum first, then gold, then plus, then free
      batch.sort((a, b) => {
        const aOrder = TIER_ORDER[(a as any).subscription_tier ?? "free"] ?? 3;
        const bOrder = TIER_ORDER[(b as any).subscription_tier ?? "free"] ?? 3;
        return aOrder - bOrder;
      });
      setProfiles((prev) => (afterCursor === null ? batch : [...prev, ...batch]));
      setHasMore(raw.length === PAGE_SIZE);
      if (raw.length > 0) {
        setCursor(raw[raw.length - 1].created_at as unknown as string);
      }
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    loadPage(null);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadPage(cursor);
  }, [hasMore, loading, cursor, loadPage]);

  return { profiles, loading, error, hasMore, loadMore };
}
