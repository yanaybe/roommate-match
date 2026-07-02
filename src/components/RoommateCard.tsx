import { Heart, Briefcase, Moon, Sun, Sparkles, Home, PawPrint } from "lucide-react";
import { motion } from "framer-motion";
import MatchBadge from "./MatchBadge";
import type { UserProfile } from "@/data/mockData";
import { useState } from "react";

interface RoommateCardProps {
  user: UserProfile;
  matchPercent: number;
  index: number;
}

export default function RoommateCard({ user, matchPercent, index }: RoommateCardProps) {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bg-card rounded-2xl shadow-card overflow-hidden"
    >
      <div className="relative">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full aspect-[3/4] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <MatchBadge percent={matchPercent} />
        </div>
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm p-2 rounded-full"
        >
          <Heart className={`w-5 h-5 ${liked ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-primary-foreground font-bold text-lg">{user.name}, {user.age}</h3>
          <div className="flex items-center gap-1 text-primary-foreground/80 text-sm">
            <Briefcase className="w-3.5 h-3.5" />
            {user.occupation}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-muted-foreground text-sm">{user.bio}</p>
        <div className="flex flex-wrap gap-2">
          <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
            {user.sleepSchedule === "Night owl" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            {user.sleepSchedule}
          </span>
          <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Clean: {user.cleanliness}/5
          </span>
          <span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full">
            ₪{user.budget.toLocaleString()}/mo
          </span>
          {user.wfh && (
            <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full"><Home className="w-3 h-3" /> WFH</span>
          )}
          {user.pets && (
            <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full"><PawPrint className="w-3 h-3" /> Pets</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
