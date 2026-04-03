import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Home, Heart, Users, MessageCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import MatchBadge from "@/components/MatchBadge";
import type { FullProfile } from "@/hooks/useProfile";
import type { User } from "@supabase/supabase-js";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  profile: FullProfile;
  t: (key: string) => string;
}

export default function NotificationsSheet({ open, onOpenChange, user, profile, t }: Props) {
  const navigate = useNavigate();
  const [notifTab, setNotifTab] = useState<"matches" | "squads" | "apartments">("matches");
  const [notifLoading, setNotifLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [activeSquads, setActiveSquads] = useState<any[]>([]);
  const [highMatchApartments, setHighMatchApartments] = useState<any[]>([]);
  const [readNotifs, setReadNotifs] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("read_notifs");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const markRead = (id: string) => {
    setReadNotifs((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("read_notifs", JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    setNotifLoading(true);

    const fetchNotifications = async () => {
      // 1. Mutual matches
      const { data: myLikes } = await supabase
        .from("liked_profiles")
        .select("liked_user_id")
        .eq("user_id", user.id);

      const myLikedIds = (myLikes ?? []).map((l: any) => l.liked_user_id);
      if (myLikedIds.length > 0) {
        const { data: mutualLikes } = await supabase
          .from("liked_profiles")
          .select("user_id")
          .eq("liked_user_id", user.id)
          .in("user_id", myLikedIds);

        const mutualIds = (mutualLikes ?? []).map((l: any) => l.user_id);
        if (mutualIds.length > 0) {
          const { data: matchedProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("user_id", mutualIds);
          setMatches(matchedProfiles ?? []);
        } else {
          setMatches([]);
        }
      } else {
        setMatches([]);
      }

      // 2. Active squads
      const { data: myMemberships } = await supabase
        .from("squad_members")
        .select("squad_id")
        .eq("user_id", user.id)
        .eq("status", "joined");

      const mySquadIds = (myMemberships ?? []).map((m: any) => m.squad_id);
      if (mySquadIds.length > 0) {
        const { data: squadsData } = await supabase
          .from("squads")
          .select("*")
          .in("id", mySquadIds)
          .eq("status", "active");
        setActiveSquads(squadsData ?? []);
      } else {
        setActiveSquads([]);
      }

      // 3. High-match apartments
      const { data: apts } = await supabase
        .from("apartments")
        .select("*")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      const highMatch = (apts ?? [])
        .map((apt: any) => {
          let score = 0;
          let factors = 0;
          if (profile.budget > 0 && apt.price > 0) {
            const diff = Math.abs(profile.budget - apt.price) / Math.max(profile.budget, apt.price);
            score += (1 - diff) * 3; factors += 3;
          }
          if (profile.city && apt.city) {
            score += (profile.city.toLowerCase() === apt.city.toLowerCase() ? 1 : 0) * 2; factors += 2;
          }
          if (profile.desired_room_type && apt.room_type) {
            score += profile.desired_room_type === apt.room_type ? 1 : 0; factors += 1;
          }
          if (profile.pets && apt.pet_friendly) score += 1;
          else if (!profile.pets) score += 1;
          factors += 1;
          factors += 1;
          if (!profile.smoking) score += 1;
          else score += 0.5;
          return { ...apt, matchPct: factors > 0 ? Math.round((score / factors) * 100) : 0 };
        })
        .filter((apt: any) => apt.matchPct >= 85)
        .slice(0, 20);

      setHighMatchApartments(highMatch);
      setNotifLoading(false);
    };

    fetchNotifications();
  }, [open, user, profile]);

  const unreadCount = (tab: "matches" | "squads" | "apartments") => {
    if (tab === "matches") return matches.filter((m) => !readNotifs.has(`match_${m.user_id}`)).length;
    if (tab === "squads") return activeSquads.filter((s) => !readNotifs.has(`squad_${s.id}`)).length;
    return highMatchApartments.filter((a) => !readNotifs.has(`apt_${a.id}`)).length;
  };

  const tabs = [
    { key: "matches" as const, label: t("matches"), icon: Heart },
    { key: "squads" as const, label: t("squads"), icon: Users },
    { key: "apartments" as const, label: t("hotRooms"), icon: Home },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-extrabold text-foreground">{t("notifications")}</SheetTitle>
        </SheetHeader>

        <div className="px-5 pt-3 pb-2 flex gap-2">
          {tabs.map(({ key, label, icon: Icon }) => {
            const count = unreadCount(key);
            return (
              <button
                key={key}
                onClick={() => setNotifTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors relative ${
                  notifTab === key ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {count > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ScrollArea className="h-[calc(85vh-130px)] px-5 py-3">
          {notifLoading ? (
            <p className="text-muted-foreground text-sm text-center py-10">{t("loading")}</p>
          ) : notifTab === "matches" ? (
            matches.length === 0 ? (
              <div className="text-center py-10">
                <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">{t("noMatchesYet")}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">{t("matchesDesc")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((p: any) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { markRead(`match_${p.user_id}`); onOpenChange(false); navigate("/chats"); }}
                    className={`flex items-center gap-3 bg-card rounded-2xl p-3 shadow-card cursor-pointer hover:bg-secondary/50 transition-colors relative ${readNotifs.has(`match_${p.user_id}`) ? "opacity-70" : ""}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-primary/30">
                      {p.avatar_url || p.photos?.[0] ? (
                        <img src={p.avatar_url || p.photos?.[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary text-lg font-bold">{p.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-card-foreground truncate">{t("itsAMatch")}</p>
                      <p className="text-xs text-muted-foreground">{p.name}{p.age ? `, ${p.age}` : ""} · {p.occupation}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-primary font-semibold">{t("tapToChat")}</p>
                        <p className="text-[10px] text-muted-foreground/60">{p.updated_at ? format(new Date(p.updated_at), "MMM d, HH:mm") : ""}</p>
                      </div>
                    </div>
                    <MessageCircle className="w-5 h-5 text-primary" />
                    {!readNotifs.has(`match_${p.user_id}`) && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary" />}
                  </motion.div>
                ))}
              </div>
            )
          ) : notifTab === "squads" ? (
            activeSquads.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">{t("noActiveSquads")}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">{t("activeSquadsDesc")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSquads.map((squad: any) => (
                  <motion.div
                    key={squad.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { markRead(`squad_${squad.id}`); onOpenChange(false); navigate(`/squad/${squad.id}`); }}
                    className={`bg-card rounded-2xl p-4 shadow-card cursor-pointer hover:bg-secondary/50 transition-colors relative ${readNotifs.has(`squad_${squad.id}`) ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/20">
                        <Zap className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-card-foreground">🚀 {squad.name} {t("isActive")}</p>
                        <p className="text-xs text-muted-foreground">
                          {squad.preferred_locations?.join(", ")} · ₪{squad.budget_min?.toLocaleString()}–₪{squad.budget_max?.toLocaleString()}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-primary font-semibold">{t("tapToViewSquad")}</p>
                          <p className="text-[10px] text-muted-foreground/60">{squad.updated_at ? format(new Date(squad.updated_at), "MMM d, HH:mm") : ""}</p>
                        </div>
                        {!readNotifs.has(`squad_${squad.id}`) && <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            highMatchApartments.length === 0 ? (
              <div className="text-center py-10">
                <Home className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">{t("noHotRooms")}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">{t("hotRoomsDesc")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {highMatchApartments.map((apt: any) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { markRead(`apt_${apt.id}`); onOpenChange(false); navigate(`/apartment/${apt.id}`); }}
                    className={`flex items-center gap-3 bg-card rounded-2xl p-3 shadow-card cursor-pointer hover:bg-secondary/50 transition-colors relative ${readNotifs.has(`apt_${apt.id}`) ? "opacity-70" : ""}`}
                  >
                    {apt.images?.[0] && (
                      <img src={apt.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-card-foreground truncate">🔥 {apt.title || "New Listing"}</p>
                      <p className="text-xs text-muted-foreground">{apt.neighborhood}, {apt.city}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs font-bold text-primary">₪{apt.price?.toLocaleString()}/mo</p>
                        <p className="text-[10px] text-muted-foreground/60">{apt.created_at ? format(new Date(apt.created_at), "MMM d, HH:mm") : ""}</p>
                      </div>
                    </div>
                    <MatchBadge percent={apt.matchPct} />
                    {!readNotifs.has(`apt_${apt.id}`) && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary" />}
                  </motion.div>
                ))}
              </div>
            )
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
