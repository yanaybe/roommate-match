import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Briefcase, Moon, Sun, Heart,
  MessageCircle, DollarSign, Home, Users, Volume2,
  ChevronLeft, ChevronRight, UtensilsCrossed, Dumbbell,
  Wine, PartyPopper, Clock, BookOpen, Smile,
  MoreVertical, Ban, Flag, Sparkles, Phone
} from "lucide-react";
import MatchBadge from "@/components/MatchBadge";
import { type UserProfile } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useAllProfiles, type FullProfile } from "@/hooks/useProfile";
import { calculateUserMatch, calculateUserMatchBreakdown, type MatchFactor } from "@/lib/matching";
import VerificationBadges from "@/components/VerificationBadges";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBlockReport } from "@/hooks/useBlockReport";
import ReportSheet from "@/components/ReportSheet";

function profileToUser(p: FullProfile): UserProfile & { photos?: string[] } {
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
      `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=400`,
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
  };
}

function MeterBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all ${i < value ? color : "bg-secondary"}`}
        />
      ))}
    </div>
  );
}

export default function RoommateProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { profile: myProfile } = useProfile();
  const { profiles: allProfiles } = useAllProfiles();
  const [imgIndex, setImgIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const { isBlocked, blockUser, unblockUser, reportUser } = useBlockReport(id);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { userData, fullProfile, matchPercent, breakdown } = useMemo(() => {
    const dbProfile = allProfiles.find((p) => p.user_id === id);
    if (dbProfile) {
      const u = profileToUser(dbProfile);
      const match = myProfile ? calculateUserMatch(myProfile, dbProfile) : 0;
      const bd = myProfile ? calculateUserMatchBreakdown(myProfile, dbProfile) : [];
      return { userData: u, fullProfile: dbProfile, matchPercent: match, breakdown: bd };
    }
    return { userData: null, fullProfile: null, matchPercent: 0, breakdown: [] };
  }, [id, allProfiles, myProfile]);

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const photos = (userData as any).photos?.length ? (userData as any).photos : [userData.avatar];
  const isOwnProfile = authUser?.id === userData.id;

  const handleMessage = async () => {
    if (!authUser) { toast.info("Sign in to message"); navigate("/auth"); return; }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.id);
    if (isUuid && !isOwnProfile) {
      try {
        await supabase.rpc("create_conversation_with_participant", { other_user_id: userData.id });
        navigate("/chats");
      } catch { toast.error("Could not start conversation"); }
    } else { navigate("/chats"); }
  };

  const handleLike = async () => {
    if (!authUser) { toast.info("Sign in to like"); navigate("/auth"); return; }
    if (isOwnProfile) return;
    setLiked(true);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.id);
    if (isUuid) {
      await supabase.from("liked_profiles").upsert(
        { user_id: authUser.id, liked_user_id: userData.id },
        { onConflict: "user_id,liked_user_id" }
      );
      toast.success(`You liked ${userData.name}!`);
    }
  };

  const extraDetails = fullProfile ? [
    { icon: UtensilsCrossed, label: "Cooking", value: fullProfile.cooking_habits, color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: Dumbbell, label: "Fitness", value: fullProfile.fitness, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Wine, label: "Alcohol", value: fullProfile.alcohol, color: "text-rose-500", bg: "bg-rose-500/10" },
    { icon: PartyPopper, label: "Partying", value: fullProfile.partying, color: "text-violet-500", bg: "bg-violet-500/10" },
    { icon: Users, label: "Guests", value: fullProfile.guests, color: "text-sky-500", bg: "bg-sky-500/10" },
    { icon: Clock, label: "Active hours", value: fullProfile.activity_hours, color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Smile, label: "Vibe", value: fullProfile.lifestyle_vibe, color: "text-pink-500", bg: "bg-pink-500/10" },
    { icon: BookOpen, label: "Religious", value: fullProfile.religious_level, color: "text-teal-500", bg: "bg-teal-500/10" },
  ].filter(d => d.value) : [];

  const vibes: string[] = [];
  if (userData.wfh) vibes.push("🏠 WFH");
  if (userData.pets) vibes.push("🐾 Has pets");
  if (userData.smoking) vibes.push("🚬 Smoker");
  else vibes.push("🚭 Non-smoker");
  if (userData.sleepSchedule === "Night owl") vibes.push("🦉 Night owl");
  else vibes.push("🌅 Early bird");

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* ── Photo hero ── */}
      <div className="relative w-full h-[75vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIndex}
            src={photos[imgIndex]}
            alt={userData.name}
            className="w-full h-full object-cover object-top"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>

          <div className="flex items-center gap-2">
            <MatchBadge percent={matchPercent} size="lg" />
            {authUser && !isOwnProfile && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10"
                >
                  <MoreVertical size={18} className="text-white" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 w-44 bg-card rounded-2xl shadow-elevated border border-border/50 overflow-hidden z-50">
                    <button
                      onClick={() => { setMenuOpen(false); isBlocked ? unblockUser() : blockUser().then((ok) => ok && navigate(-1)); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <Ban size={15} className="text-destructive shrink-0" />
                      <span className="text-foreground">{isBlocked ? "Unblock user" : "Block user"}</span>
                    </button>
                    <div className="border-t border-border/40" />
                    <button
                      onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <Flag size={15} className="text-destructive shrink-0" />
                      <span className="text-foreground">Report user</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute top-14 left-0 right-0 flex justify-center gap-1.5 z-20 px-4">
            {photos.map((_: string, i: number) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === imgIndex ? "w-6 bg-white" : "w-2 bg-white/40"}`} />
            ))}
          </div>
        )}

        {/* Tap zones for photo nav */}
        {photos.length > 1 && (
          <>
            <button className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={() => setImgIndex((i) => Math.max(0, i - 1))} />
            <button className="absolute right-0 top-0 bottom-0 w-1/3 z-10" onClick={() => setImgIndex((i) => Math.min(photos.length - 1, i + 1))} />
          </>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-white leading-tight drop-shadow-lg">
                {userData.name}, {userData.age}
              </h1>
              <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
                <MapPin size={13} />
                <span>{userData.city}</span>
                <span className="opacity-40 mx-0.5">·</span>
                <Briefcase size={13} />
                <span>{userData.occupation}</span>
              </div>
              {fullProfile && (
                <div className="mt-2">
                  <VerificationBadges
                    status={{
                      emailVerified: true,
                      phoneVerified: (fullProfile as any).phone_verified ?? false,
                      hasPhotos: !!fullProfile.avatar_url,
                    }}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-lg mx-auto px-4 -mt-5 relative z-10 space-y-4">

        {/* Hero stats pill row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-card rounded-2xl shadow-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Budget</p>
              <p className="text-base font-extrabold text-foreground">₪{userData.budget.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">/ month</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl shadow-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Home size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Room type</p>
              <p className="text-base font-extrabold text-foreground">{userData.roomType}</p>
              <p className="text-[10px] text-muted-foreground">preference</p>
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        {userData.bio && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl shadow-card p-4"
          >
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">About</h2>
            <p className="text-sm text-foreground leading-relaxed">{userData.bio}</p>
          </motion.div>
        )}

        {/* Vibe tags */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-wrap gap-2"
        >
          {vibes.map((v) => (
            <span key={v} className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
              {v}
            </span>
          ))}
        </motion.div>

        {/* Living habits — visual meters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card p-4 space-y-4"
        >
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Living Habits</h2>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">Cleanliness</span>
                </div>
                <span className="text-xs font-bold text-amber-500">{userData.cleanliness}/5</span>
              </div>
              <MeterBar value={userData.cleanliness} color="bg-amber-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-sky-500" />
                  <span className="text-xs font-semibold text-foreground">Social level</span>
                </div>
                <span className="text-xs font-bold text-sky-500">{userData.social}/5</span>
              </div>
              <MeterBar value={userData.social} color="bg-sky-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Volume2 size={13} className="text-rose-500" />
                  <span className="text-xs font-semibold text-foreground">Noise level</span>
                </div>
                <span className="text-xs font-bold text-rose-500">{userData.noise}/5</span>
              </div>
              <MeterBar value={userData.noise} color="bg-rose-400" />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                {userData.sleepSchedule === "Night owl" ? <Moon size={13} className="text-violet-500" /> : <Sun size={13} className="text-yellow-500" />}
                <span className="text-xs font-semibold text-foreground">Sleep schedule</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">{userData.sleepSchedule}</span>
            </div>
          </div>
        </motion.div>

        {/* Lifestyle details from DB */}
        {extraDetails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="bg-card rounded-2xl shadow-card p-4"
          >
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Lifestyle</h2>
            <div className="grid grid-cols-2 gap-2">
              {extraDetails.map((d) => (
                <div key={d.label} className={`flex items-center gap-2.5 p-3 rounded-xl ${d.bg}`}>
                  <d.icon size={15} className={d.color} />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{d.label}</p>
                    <p className="text-xs font-semibold text-foreground truncate">{d.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Compatibility */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-card rounded-2xl shadow-card p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Compatibility</h2>
            <div className="flex items-center gap-2.5">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    className={matchPercent >= 75 ? "text-green-500" : matchPercent >= 50 ? "text-amber-500" : "text-rose-500"}
                    strokeDasharray={`${matchPercent}, 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-foreground">
                  {matchPercent}%
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {matchPercent >= 80 ? "Great match 🎉" : matchPercent >= 60 ? "Good match 👍" : matchPercent > 0 ? "Fair match" : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">Based on your profiles</p>
              </div>
            </div>
          </div>

          {breakdown.length > 0 ? (
            <div className="space-y-2">
              {breakdown.map((factor: MatchFactor) => {
                const isGood = factor.score >= 75;
                const isMid = factor.score >= 45;
                const barColor = isGood ? "bg-green-500" : isMid ? "bg-amber-500" : "bg-rose-500";
                const textColor = isGood ? "text-green-600 dark:text-green-400" : isMid ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
                const bgColor = isGood ? "bg-green-500/8" : isMid ? "bg-amber-500/8" : "bg-rose-500/8";
                return (
                  <div key={factor.label} className={`rounded-xl p-3 ${bgColor}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{factor.emoji}</span>
                        <span className="text-xs font-semibold text-foreground">{factor.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${textColor}`}>{factor.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.score}%` }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      />
                    </div>
                    {factor.detail && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">{factor.detail}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Complete your profile to see a detailed breakdown</p>
          )}
        </motion.div>

        <div className="h-4" />
      </div>

      {/* ── Sticky bottom action bar ── */}
      {!isOwnProfile && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50">
          <div className="max-w-lg mx-auto px-4 pt-3 pb-20 flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={`flex-none w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                liked
                  ? "bg-rose-500 border-rose-500 shadow-lg shadow-rose-500/30"
                  : "bg-card border-border hover:border-rose-400"
              }`}
            >
              <Heart size={22} className={liked ? "fill-white text-white" : "text-rose-500"} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleMessage}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm gradient-primary text-primary-foreground shadow-lg"
            >
              <MessageCircle size={18} />
              Message {userData.name}
            </motion.button>
          </div>
        </div>
      )}

      <ReportSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetName={userData.name}
        onSubmit={(reason, details) => reportUser(reason, details)}
      />
    </div>
  );
}
