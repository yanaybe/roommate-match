import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileData } from "@/lib/matching";

const PAGE_SIZE = 20;

export interface FullProfile extends ProfileData {
  id: string;
  user_id: string;
  avatar_url: string | null;
  onboarding_complete: boolean;
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

export function useAllProfiles() {
  const [profiles, setProfiles] = useState<FullProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadPage = useCallback(async (pageNum: number) => {
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("onboarding_complete", true)
      .range(from, to);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const batch = (data as FullProfile[]) ?? [];
      setProfiles((prev) => (pageNum === 0 ? batch : [...prev, ...batch]));
      setHasMore(batch.length === PAGE_SIZE);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPage(0);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    loadPage(next);
  }, [hasMore, loading, page, loadPage]);

  return { profiles, loading, error, hasMore, loadMore };
}
