import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@supabase/supabase-js";

interface AdminGuard {
  isAdmin: boolean | null;
  user: User | null;
}

export function useAdminGuard(): AdminGuard {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const admin = data?.is_admin === true;
        setIsAdmin(admin);
        if (!admin) navigate("/", { replace: true });
      });
  }, [user, loading, navigate]);

  // Real-time subscription — redirect immediately if admin status is revoked
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`admin-guard-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedIsAdmin =
            (payload.new as Record<string, unknown>)?.is_admin === true;
          setIsAdmin(updatedIsAdmin);
          if (!updatedIsAdmin) navigate("/", { replace: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  return { isAdmin, user };
}
