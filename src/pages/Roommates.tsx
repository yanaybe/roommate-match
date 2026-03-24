import { useState, useCallback, useMemo } from "react";
import { X, Heart, RotateCcw, Users, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SwipeCard from "@/components/SwipeCard";
import MatchModal from "@/components/MatchModal";
import { mockUsers, type UserProfile } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useAllProfiles, type FullProfile } from "@/hooks/useProfile";
import { calculateUserMatch } from "@/lib/matching";
import { toast } from "sonner";

// Convert DB profile to mock format for SwipeCard compatibility
function profileToUser(p: FullProfile): UserProfile {
  return {
    id: p.user_id,
    name: p.name,
    age: p.age ?? 0,
    city: p.city,
    occupation: p.occupation,
    avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=200`,
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
  };
}

export default function Roommates() {
  const { user } = useAuth();
  const { profile: myProfile } = useProfile();
  const { profiles: allProfiles, loading: profilesLoading } = useAllProfiles();
  const navigate = useNavigate();
  const [swiped, setSwiped] = useState<string[]>([]);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [matchedPercent, setMatchedPercent] = useState(0);

  // Other profiles (not current user), with match percentages
  const otherProfiles = useMemo(() => {
    if (!myProfile) return [];
    return allProfiles
      .filter((p) => p.user_id !== user?.id)
      .map((p) => ({
        profile: p,
        user: profileToUser(p),
        matchPercent: calculateUserMatch(myProfile, p),
      }));
  }, [allProfiles, myProfile, user?.id]);

  // Fall back to mock data when no real profiles exist
  const useMockData = otherProfiles.length === 0 && !profilesLoading;
  const mockMatchPercents = [92, 87, 78, 85, 71, 64];

  const items = useMockData
    ? mockUsers.map((u, i) => ({ user: u, matchPercent: mockMatchPercents[i] ?? 75 }))
    : otherProfiles.map((p) => ({ user: p.user, matchPercent: p.matchPercent }));

  const remaining = items.filter((item) => !swiped.includes(item.user.id));

  const requireAuth = useCallback(() => {
    if (!user) {
      toast.info("Sign in to swipe on roommates");
      navigate("/auth");
      return false;
    }
    if (!myProfile?.onboarding_complete) {
      toast.info("Complete your profile first");
      navigate("/onboarding");
      return false;
    }
    return true;
  }, [user, myProfile, navigate]);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!requireAuth()) return;
      const current = remaining[0];
      if (!current) return;

      setSwiped((prev) => [...prev, current.user.id]);

      if (direction === "right") {
        // For now simulate match on every right swipe for demo
        // In production, check mutual likes in DB
        if (Math.random() > 0.5) {
          setMatchedUser(current.user);
          setMatchedPercent(current.matchPercent);
        }
      }
    },
    [remaining, requireAuth]
  );

  const handleUndo = () => {
    setSwiped((prev) => prev.slice(0, -1));
  };

  const visibleCards = remaining.slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3">
          <h1 className="text-xl font-extrabold text-foreground">Find Roommates</h1>
          <p className="text-muted-foreground text-sm">
            {remaining.length} {remaining.length === 1 ? "person" : "people"} left
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-4">
        {profilesLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground text-sm">Loading profiles...</p>
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
                    onSwipe={handleSwipe}
                    isTop={i === visibleCards.length - 1}
                  />
                ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">No more profiles</h2>
            <p className="text-muted-foreground text-sm mb-4">Check back later for new roommates!</p>
            <button
              onClick={() => setSwiped([])}
              className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm"
            >
              Start Over
            </button>
          </div>
        )}

        {remaining.length > 0 && !profilesLoading && (
          <div className="flex items-center justify-center gap-5 mt-6">
            <button
              onClick={handleUndo}
              disabled={swiped.length === 0}
              className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-card disabled:opacity-30 transition-opacity"
            >
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => handleSwipe("left")}
              className="w-16 h-16 bg-card border-2 border-destructive/20 rounded-full flex items-center justify-center shadow-card active:scale-95 transition-transform"
            >
              <X className="w-7 h-7 text-destructive" />
            </button>
            <button
              onClick={() => handleSwipe("right")}
              className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center shadow-card active:scale-95 transition-transform"
            >
              <Heart className="w-7 h-7 text-primary-foreground" />
            </button>
          </div>
        )}
      </div>

      {matchedUser && (
        <MatchModal
          user={matchedUser}
          matchPercent={matchedPercent}
          onClose={() => setMatchedUser(null)}
        />
      )}
    </div>
  );
}
