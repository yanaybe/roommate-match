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
  subscription_tier?: string;
  paddle_customer_id?: string | null;
  paddle_subscription_id?: string | null;
  gender?: string | null;
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

export function useAllProfiles() {
  const [profiles, setProfiles] = useState<FullProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  // cursor = created_at of the last fetched row; null = first page
  const [cursor, setCursor] = useState<string | null>(null);

  const loadPage = useCallback(async (afterCursor: string | null) => {
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("onboarding_complete", true)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (afterCursor) {
      query = query.lt("created_at", afterCursor);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const batch = (data as unknown as FullProfile[]) ?? [];
      setProfiles((prev) => (afterCursor === null ? batch : [...prev, ...batch]));
      setHasMore(batch.length === PAGE_SIZE);
      if (batch.length > 0) {
        setCursor(batch[batch.length - 1].created_at as unknown as string);
      }
    }
    setLoading(false);
  }, []);

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
