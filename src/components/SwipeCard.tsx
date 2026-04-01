import { useState } from "react";
import { Briefcase, Moon, Sun, Sparkles, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MatchBadge from "./MatchBadge";
import type { UserProfile } from "@/data/mockData";

interface SwipeCardProps {
  user: UserProfile & { photos?: string[] };
  matchPercent: number;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export default function SwipeCard({ user, matchPercent, onSwipe, isTop }: SwipeCardProps) {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = user.photos?.length ? user.photos : [user.avatar];

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((i) => Math.max(0, i - 1));
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((i) => Math.min(photos.length - 1, i + 1));
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
          src={photos[photoIndex]}
          alt={user.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

        {/* Photo indicator dots */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-20">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === photoIndex ? "w-6 bg-primary-foreground" : "w-1.5 bg-primary-foreground/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo navigation areas */}
        {photos.length > 1 && isTop && (
          <>
            {photoIndex > 0 && (
              <button onClick={prevPhoto} className="absolute left-0 top-0 bottom-20 w-1/3 z-15" />
            )}
            {photoIndex < photos.length - 1 && (
              <button onClick={nextPhoto} className="absolute right-0 top-0 bottom-20 w-1/3 z-15" />
            )}
          </>
        )}

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

        {/* User info — tappable */}
        <div
          className="absolute bottom-0 left-0 right-0 p-6 z-10 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (Math.abs(x.get()) < 5) {
              navigate(`/roommate/${user.id}`);
            }
          }}
        >
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
          <p className="text-primary-foreground/50 text-xs mt-2 text-center">Tap to see full profile</p>
        </div>
      </div>
    </motion.div>
  );
}
