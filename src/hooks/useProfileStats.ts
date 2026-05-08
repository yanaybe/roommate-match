import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileStats {
  profileViews: number;
  likesReceived: number;
}

export function useProfileStats(): ProfileStats & { loading: boolean } {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ profileViews: 0, likesReceived: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      const [viewsRes, likesRes] = await Promise.all([
        supabase
          .from("profile_views")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", user!.id),
        supabase
          .from("liked_profiles")
          .select("id", { count: "exact", head: true })
          .eq("liked_user_id", user!.id),
      ]);

      if (!cancelled) {
        setStats({
          profileViews: viewsRes.count ?? 0,
          likesReceived: likesRes.count ?? 0,
        });
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  return { ...stats, loading };
}
