import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileData } from "@/lib/matching";

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

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(data as FullProfile | null);
      setLoading(false);
    };

    load();
  }, [user]);

  return { profile, loading, refetch: async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile(data as FullProfile | null);
  }};
}

export function useAllProfiles() {
  const [profiles, setProfiles] = useState<FullProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("onboarding_complete", true);
      setProfiles((data as FullProfile[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return { profiles, loading };
}
