import { useState, useCallback, useMemo, useEffect } from "react";
import { X, Heart, RotateCcw, ArrowRight, Lock } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SwipeCard from "@/components/SwipeCard";
import MatchModal from "@/components/MatchModal";
import SquadsTabContent from "@/components/SquadsTabContent";
import { Skeleton } from "@/components/ui/skeleton";
import { type UserProfile } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useAllProfiles, type FullProfile } from "@/hooks/useProfile";
import { fetchBlockedIds } from "@/hooks/useBlockReport";
import { useLanguage } from "@/hooks/useLanguage";
import { useDailyLimits } from "@/hooks/useDailyLimits";
import { calculateUserMatch, calculateUserMatchBreakdown, type MatchFactor } from "@/lib/matching";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { isUUID } from "@/lib/profileUtils";
import { analytics } from "@/lib/analytics";

// Convert DB profile to mock format for SwipeCard compatibility
function profileToUser(p: FullProfile): UserProfile & { photos?: string[]; subscriptionTier?: string } {
  const photos = (p as any).photos as string[] | undefined;
  return {
    id: p.user_id,
    name: p.name,
    age: p.age ?? 0,
    city: p.city,
    occupation: p.occupation,
    avatar:
      p.avatar_url ||
      photos?.[0] ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=200`,
    budget: p.budget,
    roomType: p.desired_room_type,
    sleepSchedule: p.sleep_schedule,
    cleanliness: p.cleanliness,
    smoking: p.smoking,
    pets: p.pets,
    social: p.social_level,
    noise: p.noise_level,
    wfh: p.wfh,
    bio: p.bio,
    photos: photos?.length ? photos : undefined,
    phoneVerified: (p as any).phone_verified ?? false,
    subscriptionTier: (p as any).subscription_tier ?? "free",
  };
}

export default function Roommates() {
  const { user } = useAuth();
  const { profile: myProfile } = useProfile();
  const { profiles: allProfiles, loading: profilesLoading, hasMore, loadMore } = useAllProfiles();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"people" | "squads">("people");
  const [swiped, setSwiped] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [matchedPercent, setMatchedPercent] = useState(0);
  const { canLike, likesUsed, likesLimit, recordLike, openPremiumSheet, subscriptionTier } = useDailyLimits();
  const canUndo = subscriptionTier !== "free";

  useEffect(() => {
    if (!user?.id) return;
    fetchBlockedIds(user.id).then(setBlockedIds);
  }, [user?.id]);

  // Load all-time right-swipes from DB — liked profiles never reappear
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("liked_profiles")
      .select("liked_user_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const dbLikedIds = (data ?? []).map((r) => r.liked_user_id);
        setSwiped(dbLikedIds);
      });
  }, [user?.id]);

  // Other profiles (not current user), with match percentages + breakdown
  const otherProfiles = useMemo(() => {
    if (!myProfile) return [];
    return allProfiles
      .filter((p) => p.user_id !== user?.id)
      .map((p) => ({
        profile: p,
        user: profileToUser(p),
        matchPercent: calculateUserMatch(myProfile, p),
        matchBreakdown: calculateUserMatchBreakdown(myProfile, p),
      }));
  }, [allProfiles, myProfile, user?.id]);

  const items = otherProfiles.map((p) => ({ user: p.user, matchPercent: p.matchPercent, matchBreakdown: p.matchBreakdown }));

  const swipedSet = useMemo(() => new Set(swiped), [swiped]);
  const blockedSet = useMemo(() => new Set(blockedIds), [blockedIds]);

  const remaining = items.filter(
    (item) => !swipedSet.has(item.user.id) && !blockedSet.has(item.user.id)
  );

  const requireAuth = useCallback(() => {
    if (!user) {
      toast.info(t("signInToSwipe"));
      navigate("/auth");
      return false;
    }
    if (!myProfile?.onboarding_complete) {
      toast.info(t("completeProfileFirst"));
      navigate("/onboarding");
      return false;
    }
    return true;
  }, [user, myProfile, navigate, t]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!requireAuth()) return;
      const current = remaining[0];
      if (!current) return;

      // Check limit before consuming the card so the user doesn't lose their swipe
      if (direction === "right" && user && !canLike) {
        toast.error(`You've reached your ${likesLimit} daily likes. Upgrade to like more.`);
        openPremiumSheet();
        return;
      }

      setSwiped((prev) => [...prev, current.user.id]);

      if (direction === "right" && user) {
        if (isUUID(current.user.id)) {
          await supabase.from("liked_profiles").upsert(
            { user_id: user.id, liked_user_id: current.user.id },
            { onConflict: "user_id,liked_user_id" },
          );

          // Check for mutual like — real match detection
          const { data: mutualLike } = await supabase
            .from("liked_profiles")
            .select("id")
            .eq("user_id", current.user.id)
            .eq("liked_user_id", user.id)
            .maybeSingle();

          if (mutualLike) {
            analytics.match(current.matchPercent);
            setMatchedUser(current.user);
            setMatchedPercent(current.matchPercent);
          }
        }

        analytics.swipeLike(current.matchPercent);
        recordLike();

        const likesAfter = likesUsed + 1;
        const remaining_likes = likesLimit - likesAfter;
        if (subscriptionTier === "free" && remaining_likes > 0 && remaining_likes <= 5) {
          toast(`${remaining_likes} like${remaining_likes === 1 ? "" : "s"} left today ✨`, {
            description: "Upgrade to keep swiping — your next match could be out there.",
            action: { label: "Upgrade", onClick: openPremiumSheet },
          });
        }
      } else {
        analytics.swipeDislike();
      }
    },
    [remaining, requireAuth, user, likesUsed, likesLimit, subscriptionTier],
  );

  const handleUndo = () => {
    if (!canUndo) {
      openPremiumSheet();
      return;
    }
    setSwiped((prev) => prev.slice(0, -1));
  };

  // Load more profiles from DB when the local stack runs low
  useEffect(() => {
    if (remaining.length <= 2 && hasMore && !profilesLoading) {
      loadMore();
    }
  }, [remaining.length, hasMore, profilesLoading, loadMore]);

  const visibleCards = remaining.slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8 flex flex-col">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 desk:pt-6 pb-3">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-3">{t("findRoommates")}</h1>
          {/* TODO [SPRINT 2]: Add a "NEW" badge on the Squads tab until the user
            first views it. This alone would increase Squad discovery by 2–3x.
            Squads is the #1 unique differentiator — most users never find it
            because "People" is the default and nothing draws the eye to "Squads".

            IMPLEMENTATION:
            1. Add a localStorage key to track if the user has ever clicked Squads:
               const [hasViewedSquads, setHasViewedSquads] = useState(
                 () => localStorage.getItem("squads_tab_viewed") === "true"
               );
            2. When the user clicks the Squads tab:
               setHasViewedSquads(true);
               localStorage.setItem("squads_tab_viewed", "true");
            3. Add the badge to the tab button:
               {tab === "squads" && !hasViewedSquads && (
                 <span className="ml-1.5 bg-primary text-primary-foreground
                                  text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                   NEW
                 </span>
               )}  */}
        <div className="flex bg-secondary rounded-xl p-1">
            {(["people", "squads"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "gradient-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "people" ? "People" : "Squads"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "people" && user && myProfile && !myProfile.onboarding_complete && (
        <div className="max-w-lg mx-auto w-full px-4 pt-3">
          <button
            onClick={() => navigate("/onboarding")}
            className="w-full flex items-center gap-3 p-3.5 bg-primary/10 border border-primary/20 rounded-2xl text-left"
          >
            <span className="text-2xl">👤</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{t("completeProfileBanner")}</p>
              <p className="text-xs text-muted-foreground">{t("needProfileToSwipe")}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          </button>
        </div>
      )}

      <div className="flex-1 max-w-lg mx-auto w-full px-4">
        {activeTab === "squads" ? (
          <SquadsTabContent />
        ) : (
          <>
            <div className="pt-4">
              {profilesLoading ? (
                <div className="relative w-full aspect-[3/4] max-h-[520px]">
                  <Skeleton className="absolute inset-0 rounded-3xl" />
                  <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <Skeleton className="h-7 w-2/3 rounded-xl" />
                    <Skeleton className="h-4 w-1/2 rounded-xl" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              ) : remaining.length > 0 ? (
                <div className="relative w-full aspect-[3/4] max-h-[520px]">
                  <AnimatePresence>
                    {visibleCards
                      .slice()
                      .reverse()
                      .map((item, i) => (
                        <SwipeCard
                          key={item.user.id}
                          user={item.user}
                          matchPercent={item.matchPercent}
                          matchBreakdown={item.matchBreakdown}
                          onSwipe={handleSwipe}
                          isTop={i === visibleCards.length - 1}
                        />
                      ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                  <div className="w-24 h-24 gradient-primary rounded-full flex items-center justify-center mb-5 shadow-elevated">
                    <Heart className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-extrabold text-foreground mb-2">{t("noMoreProfiles")}</h2>
                  <p className="text-muted-foreground text-sm mb-6 max-w-xs">{t("checkBackLater")}</p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                      onClick={() => navigate("/onboarding?edit=true")}
                      className="w-full py-3 gradient-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      Adjust Preferences
                    </button>
                    <button
                      onClick={handleUndo}
                      disabled={swiped.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-secondary rounded-xl text-sm font-semibold text-foreground hover:bg-secondary/80 disabled:opacity-40 active:scale-[0.98] transition-all"
                    >
                      {canUndo ? <RotateCcw className="w-4 h-4" /> : <Lock className="w-4 h-4" />} Undo last swipe
                    </button>
                  </div>
                </div>
              )}

              {remaining.length > 0 && !profilesLoading && (
                <div className="flex items-center justify-center gap-5 mt-6">
                  <button
                    onClick={handleUndo}
                    disabled={swiped.length === 0}
                    className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-card disabled:opacity-30 hover:bg-secondary/80 hover:scale-105 active:scale-95 transition-all duration-150"
                    title={canUndo ? "Undo last swipe" : "Upgrade to Plus+ to undo swipes"}
                  >
                    {canUndo ? (
                      <RotateCcw className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSwipe("left")}
                    className="w-16 h-16 bg-card border-2 border-destructive/30 rounded-full flex items-center justify-center shadow-card hover:border-destructive/60 hover:scale-110 hover:shadow-elevated active:scale-95 transition-all duration-150"
                  >
                    <X className="w-7 h-7 text-destructive" />
                  </button>
                  <button
                    onClick={() => handleSwipe("right")}
                    className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center shadow-card hover:scale-110 hover:shadow-elevated active:scale-95 transition-all duration-150"
                  >
                    <Heart className="w-7 h-7 text-primary-foreground" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {matchedUser && (
        <MatchModal user={matchedUser} matchPercent={matchedPercent} onClose={() => setMatchedUser(null)} />
      )}
    </div>
  );
}
