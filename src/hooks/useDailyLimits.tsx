import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PremiumSheet from "@/components/PremiumSheet";
import { analytics } from "@/lib/analytics";

const FREE_LIKES_LIMIT = 8;
const FREE_SAVES_LIMIT = 3;

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
  subscriptionTier: string;
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
  subscriptionTier: "free",
});

export function DailyLimitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [likesUsed, setLikesUsed] = useState(0);
  const [savesUsed, setSavesUsed] = useState(0);
  const [premiumOpen, setPremiumOpen] = useState(false);
  // Tracks whether we've fired the limit-hit event this session to avoid duplicate events
  const limitHitFiredRef = useRef(false);

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
        if (data) setSubscriptionTier(data.subscription_tier ?? "free");
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

  const recordLike = useCallback(() => {
    setLikesUsed((n) => {
      const next = n + 1;
      if (isFree && next >= FREE_LIKES_LIMIT && !limitHitFiredRef.current) {
        limitHitFiredRef.current = true;
        analytics.dailyLimitHit(FREE_LIKES_LIMIT);
      }
      return next;
    });
  }, [isFree]);
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
        subscriptionTier,
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
