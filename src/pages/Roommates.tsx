import { useState, useCallback } from "react";
import { X, Heart, RotateCcw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import SwipeCard from "@/components/SwipeCard";
import MatchModal from "@/components/MatchModal";
import { mockUsers, type UserProfile } from "@/data/mockData";

const matchPercents = [92, 87, 78, 85, 71, 64];

// Simulate users who have already liked "you"
const usersWhoLikedYou = new Set(["1", "3", "5"]);

export default function Roommates() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [matchedPercent, setMatchedPercent] = useState(0);
  const [swiped, setSwiped] = useState<string[]>([]);

  const remaining = mockUsers.filter((u) => !swiped.includes(u.id));

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const user = remaining[0];
      if (!user) return;

      setSwiped((prev) => [...prev, user.id]);

      if (direction === "right" && usersWhoLikedYou.has(user.id)) {
        const idx = mockUsers.findIndex((u) => u.id === user.id);
        setMatchedUser(user);
        setMatchedPercent(matchPercents[idx] ?? 75);
      }
    },
    [remaining]
  );

  const handleUndo = () => {
    setSwiped((prev) => prev.slice(0, -1));
  };

  const visibleCards = remaining.slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3">
          <h1 className="text-xl font-extrabold text-foreground">Find Roommates</h1>
          <p className="text-muted-foreground text-sm">
            {remaining.length} {remaining.length === 1 ? "person" : "people"} left
          </p>
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-4">
        {remaining.length > 0 ? (
          <div className="relative w-full aspect-[3/4] max-h-[520px]">
            <AnimatePresence>
              {visibleCards
                .slice()
                .reverse()
                .map((user, i) => {
                  const realIndex = mockUsers.findIndex((u) => u.id === user.id);
                  return (
                    <SwipeCard
                      key={user.id}
                      user={user}
                      matchPercent={matchPercents[realIndex] ?? 75}
                      onSwipe={handleSwipe}
                      isTop={i === visibleCards.length - 1}
                    />
                  );
                })}
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

        {/* Action buttons */}
        {remaining.length > 0 && (
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

      {/* Match modal */}
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
