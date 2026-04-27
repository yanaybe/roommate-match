import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PremiumSheet from "@/components/PremiumSheet";

const FREE_LIKES_LIMIT = 8;
const FREE_SAVES_LIMIT = 10;

interface DailyLimitsContextValue {
  canLike: boolean;
  canSave: boolean;
  likesUsed: number;
  savesUsed: number;
  likesLimit: number;
  savesLimit: number;
  recordLike: () => void;
  recordSave: () => void;
  openPremiumSheet: () => void;
}

const DailyLimitsContext = createContext<DailyLimitsContextValue>({
  canLike: true,
  canSave: true,
  likesUsed: 0,
  savesUsed: 0,
  likesLimit: FREE_LIKES_LIMIT,
  savesLimit: FREE_SAVES_LIMIT,
  recordLike: () => {},
  recordSave: () => {},
  openPremiumSheet: () => {},
});

export function DailyLimitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [likesUsed, setLikesUsed] = useState(0);
  const [savesUsed, setSavesUsed] = useState(0);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const isFree = subscriptionTier === "free";
  const likesLimit = isFree ? FREE_LIKES_LIMIT : Infinity;
  const savesLimit = isFree ? FREE_SAVES_LIMIT : Infinity;

  useEffect(() => {
    if (!user) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSubscriptionTier((data as any).subscription_tier ?? "free");
      });

    Promise.all([
      supabase
        .from("liked_profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("saved_apartments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString()),
    ]).then(([likesRes, savesRes]) => {
      setLikesUsed(likesRes.count ?? 0);
      setSavesUsed(savesRes.count ?? 0);
    }).catch(() => {
      setLikesUsed(0);
      setSavesUsed(0);
    });
  }, [user]);

  const recordLike = useCallback(() => setLikesUsed((n) => n + 1), []);
  const recordSave = useCallback(() => setSavesUsed((n) => n + 1), []);
  const openPremiumSheet = useCallback(() => setPremiumOpen(true), []);

  return (
    <DailyLimitsContext.Provider
      value={{
        canLike: !isFree || likesUsed < likesLimit,
        canSave: !isFree || savesUsed < savesLimit,
        likesUsed,
        savesUsed,
        likesLimit,
        savesLimit,
        recordLike,
        recordSave,
        openPremiumSheet,
      }}
    >
      {children}
      <PremiumSheet open={premiumOpen} onOpenChange={setPremiumOpen} />
    </DailyLimitsContext.Provider>
  );
}

export function useDailyLimits() {
  return useContext(DailyLimitsContext);
}
