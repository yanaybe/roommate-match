import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Briefcase, Moon, Sun, Sparkles, Heart,
  MessageCircle, DollarSign, Home, Users, Volume2, Cigarette,
  Dog, Wifi, ChevronLeft, ChevronRight, UtensilsCrossed, Dumbbell,
  Wine, PartyPopper, Bed, Clock, BookOpen, Smile,
  MoreVertical, Ban, Flag
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import MatchBadge from "@/components/MatchBadge";
import { mockUsers, type UserProfile } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useAllProfiles, type FullProfile } from "@/hooks/useProfile";
import { calculateUserMatch, calculateUserMatchBreakdown, type MatchFactor } from "@/lib/matching";
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
  };
}

interface DetailItem {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
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
  const { isBlocked, blockUser, unblockUser, reportUser } = useBlockReport(id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Find from DB profiles first, then mock
  const { userData, fullProfile, matchPercent, breakdown } = useMemo(() => {
    const dbProfile = allProfiles.find((p) => p.user_id === id);
    if (dbProfile) {
      const u = profileToUser(dbProfile);
      const match = myProfile ? calculateUserMatch(myProfile, dbProfile) : 75;
      const bd = myProfile ? calculateUserMatchBreakdown(myProfile, dbProfile) : [];
      return { userData: u, fullProfile: dbProfile, matchPercent: match, breakdown: bd };
    }
    const mockUser = mockUsers.find((u) => u.id === id);
    if (mockUser) {
      return { userData: mockUser, fullProfile: null, matchPercent: 80, breakdown: [] };
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

  const handleMessage = async () => {
    if (!authUser) {
      toast.info("Sign in to message");
      navigate("/auth");
      return;
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.id);
    if (isUuid && userData.id !== authUser.id) {
      try {
        await supabase.rpc("create_conversation_with_participant", {
          other_user_id: userData.id,
        });
        navigate("/chats");
      } catch {
        toast.error("Could not start conversation");
      }
    } else {
      navigate("/chats");
    }
  };

  const details: DetailItem[] = [
    { icon: MapPin, label: "City", value: userData.city },
    { icon: Briefcase, label: "Occupation", value: userData.occupation },
    { icon: DollarSign, label: "Budget", value: `₪${userData.budget.toLocaleString()}/mo` },
    { icon: Home, label: "Room Type", value: userData.roomType },
    { icon: userData.sleepSchedule === "Night owl" ? Moon : Sun, label: "Sleep", value: userData.sleepSchedule },
    { icon: Sparkles, label: "Cleanliness", value: `${userData.cleanliness}/5` },
    { icon: Users, label: "Social Level", value: `${userData.social}/5` },
    { icon: Volume2, label: "Noise Level", value: `${userData.noise}/5` },
  ];

  // Extra details from DB profile
  const extraDetails: DetailItem[] = [];
  if (fullProfile) {
    extraDetails.push(
      { icon: UtensilsCrossed, label: "Cooking", value: fullProfile.cooking_habits },
      { icon: Dumbbell, label: "Fitness", value: fullProfile.fitness },
      { icon: Wine, label: "Alcohol", value: fullProfile.alcohol },
      { icon: PartyPopper, label: "Partying", value: fullProfile.partying },
      { icon: Users, label: "Guests", value: fullProfile.guests },
      { icon: Clock, label: "Activity Hours", value: fullProfile.activity_hours },
      { icon: Smile, label: "Lifestyle Vibe", value: fullProfile.lifestyle_vibe },
      { icon: BookOpen, label: "Religious Level", value: fullProfile.religious_level },
    );
  }

  const tags: string[] = [];
  if (userData.wfh) tags.push("🏠 Works from home");
  if (userData.pets) tags.push("🐾 Has pets");
  if (userData.smoking) tags.push("🚬 Smokes");
  if (!userData.smoking) tags.push("🚭 Non-smoker");

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Photo gallery */}
      <div className="relative w-full aspect-[3/4] max-h-[500px] overflow-hidden bg-muted">
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIndex}
            src={photos[imgIndex]}
            alt={userData.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-foreground/20" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <MatchBadge percent={matchPercent} size="lg" />
            {authUser && userData.id !== authUser.id && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <MoreVertical size={18} className="text-foreground" />
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

        {/* Photo nav */}
        {photos.length > 1 && (
          <>
            <div className="absolute top-16 left-0 right-0 flex justify-center gap-1.5 z-20">
              {photos.map((_: string, i: number) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === imgIndex ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/40"
                  }`}
                />
              ))}
            </div>
            {imgIndex > 0 && (
              <button
                onClick={() => setImgIndex((i) => i - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center z-20"
              >
                <ChevronLeft size={18} className="text-foreground" />
              </button>
            )}
            {imgIndex < photos.length - 1 && (
              <button
                onClick={() => setImgIndex((i) => i + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center z-20"
              >
                <ChevronRight size={18} className="text-foreground" />
              </button>
            )}
          </>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <h1 className="text-3xl font-extrabold text-primary-foreground">
            {userData.name}, {userData.age}
          </h1>
          <div className="flex items-center gap-1.5 text-primary-foreground/80 text-sm mt-1">
            <MapPin size={14} />
            {userData.city}
            <span className="mx-1">•</span>
            <Briefcase size={14} />
            {userData.occupation}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Bio */}
        {userData.bio && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-card p-5"
          >
            <h2 className="text-sm font-bold text-foreground mb-2">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{userData.bio}</p>
          </motion.div>
        )}

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-2"
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* Details grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card p-5"
        >
          <h2 className="text-sm font-bold text-foreground mb-3">Living Preferences</h2>
          <div className="grid grid-cols-2 gap-3">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <d.icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{d.label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Extra details from DB */}
        {extraDetails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl shadow-card p-5"
          >
            <h2 className="text-sm font-bold text-foreground mb-3">Lifestyle</h2>
            <div className="grid grid-cols-2 gap-3">
              {extraDetails.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <d.icon size={16} className="text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{d.label}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{d.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Compatibility breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Compatibility</h2>
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    className={matchPercent >= 75 ? "text-green-500" : matchPercent >= 50 ? "text-yellow-500" : "text-red-500"}
                    strokeDasharray={`${matchPercent}, 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                  {matchPercent}%
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {matchPercent >= 80 ? "Great Match! 🎉" : matchPercent >= 60 ? "Good Match 👍" : "Fair Match"}
                </p>
                <p className="text-[11px] text-muted-foreground">Based on your profiles</p>
              </div>
            </div>
          </div>

          {breakdown.length > 0 ? (
            <div className="space-y-2.5">
              {breakdown.map((factor: MatchFactor) => {
                const barColor =
                  factor.score >= 75 ? "bg-green-500" :
                  factor.score >= 45 ? "bg-yellow-500" : "bg-red-500";
                const bgColor =
                  factor.score >= 75 ? "bg-green-500/10" :
                  factor.score >= 45 ? "bg-yellow-500/10" : "bg-red-500/10";
                const textColor =
                  factor.score >= 75 ? "text-green-600" :
                  factor.score >= 45 ? "text-yellow-600" : "text-red-600";
                return (
                  <div key={factor.label} className={`rounded-xl p-3 ${bgColor}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{factor.emoji}</span>
                        <span className="text-xs font-semibold text-foreground">{factor.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${textColor}`}>{factor.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${factor.score}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{factor.detail}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Complete your profile to see a detailed breakdown</p>
          )}
        </motion.div>
      </div>

      <ReportSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetName={userData.name}
        onSubmit={(reason, details) => reportUser(reason, details)}
      />
    </div>
  );
}
