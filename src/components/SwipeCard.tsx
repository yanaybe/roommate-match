import { Briefcase, Moon, Sun, Sparkles, MapPin } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import MatchBadge from "./MatchBadge";
import type { UserProfile } from "@/data/mockData";

interface SwipeCardProps {
  user: UserProfile;
  matchPercent: number;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export default function SwipeCard({ user, matchPercent, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="w-full h-full bg-card rounded-3xl shadow-elevated overflow-hidden relative select-none">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

        {/* LIKE / NOPE overlays */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-8 left-6 border-4 border-accent text-accent font-extrabold text-3xl px-4 py-1 rounded-xl rotate-[-15deg] z-20"
            >
              LIKE
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-8 right-6 border-4 border-destructive text-destructive font-extrabold text-3xl px-4 py-1 rounded-xl rotate-[15deg] z-20"
            >
              NOPE
            </motion.div>
          </>
        )}

        {/* Match badge */}
        <div className="absolute top-4 left-4 z-10">
          <MatchBadge percent={matchPercent} />
        </div>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h2 className="text-primary-foreground font-extrabold text-2xl">
            {user.name}, {user.age}
          </h2>
          <div className="flex items-center gap-1.5 text-primary-foreground/80 text-sm mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {user.city}
            <span className="mx-1">•</span>
            <Briefcase className="w-3.5 h-3.5" />
            {user.occupation}
          </div>
          <p className="text-primary-foreground/70 text-sm mt-2">{user.bio}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              {user.sleepSchedule === "Night owl" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              {user.sleepSchedule}
            </span>
            <span className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Clean: {user.cleanliness}/5
            </span>
            <span className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs px-2.5 py-1 rounded-full">
              ₪{user.budget.toLocaleString()}/mo
            </span>
            {user.wfh && (
              <span className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs px-2.5 py-1 rounded-full">🏠 WFH</span>
            )}
            {user.pets && (
              <span className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs px-2.5 py-1 rounded-full">🐾 Pets</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
