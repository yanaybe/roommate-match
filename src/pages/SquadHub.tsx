import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, MessageCircle, Home, Send, Heart, X, Crown, MapPin, Check, CheckCheck, Sparkles, Bath, Maximize, BedDouble } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSquadDetail } from "@/hooks/useSquad";
import { useProfile, useAllProfiles, type FullProfile } from "@/hooks/useProfile";
import { calculateUserMatch } from "@/lib/matching";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MatchBadge from "@/components/MatchBadge";
import SwipeCard from "@/components/SwipeCard";
import { mockUsers, type UserProfile } from "@/data/mockData";

type Tab = "members" | "discover" | "apartments" | "chat";

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

export default function SquadHub() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { squad, members, likes, loading, refetch } = useSquadDetail(id ?? null);
  const { profile: myProfile } = useProfile();
  const { profiles: allProfiles } = useAllProfiles();
  const [tab, setTab] = useState<Tab>("members");

  // Real apartments state
  const [apartments, setApartments] = useState<any[]>([]);
  const [apartmentsLoading, setApartmentsLoading] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Discover state
  const [swiped, setSwiped] = useState<string[]>([]);

  const isActive = squad?.status === "active";
  const isFull = members.length >= (squad?.target_size ?? 3);

  // Calculate group compatibility
  const groupCompatibility = useMemo(() => {
    if (members.length < 2) return 0;
    let total = 0;
    let count = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i].profile;
        const b = members[j].profile;
        if (a && b) {
          total += calculateUserMatch(a, b);
          count++;
        }
      }
    }
    return count > 0 ? Math.round(total / count) : 0;
  }, [members]);

  // Discover: profiles not in squad
  const discoverProfiles = useMemo(() => {
    if (!myProfile) return [];
    const memberIds = new Set(members.map((m) => m.user_id));
    return allProfiles
      .filter((p) => !memberIds.has(p.user_id) && p.user_id !== user?.id)
      .map((p) => {
        // Calculate compatibility with all current members
        const memberScores = members
          .map((m) => m.profile ? calculateUserMatch(p, m.profile) : 0)
          .filter((s) => s > 0);
        const avgSquadMatch = memberScores.length > 0
          ? Math.round(memberScores.reduce((a, b) => a + b, 0) / memberScores.length)
          : 0;
        const personalMatch = calculateUserMatch(myProfile, p);

        return { profile: p, user: profileToUser(p), personalMatch, squadMatch: avgSquadMatch };
      })
      .sort((a, b) => b.squadMatch - a.squadMatch);
  }, [allProfiles, myProfile, members, user?.id]);

  const remainingDiscover = discoverProfiles.filter((p) => !swiped.includes(p.user.id));

  const handleInvite = useCallback(async (direction: "left" | "right") => {
    if (!user || !id) return;
    const current = remainingDiscover[0];
    if (!current) return;

    setSwiped((prev) => [...prev, current.user.id]);

    if (direction === "right") {
      // Send invite
      const { error } = await supabase.from("squad_invites").insert({
        squad_id: id,
        inviter_id: user.id,
        invitee_id: current.profile.user_id,
      });
      if (!error) {
        toast.success(`Invited ${current.profile.name} to join!`);
      }
    }
  }, [user, id, remainingDiscover]);

  // Fetch real apartments
  useEffect(() => {
    const fetchApartments = async () => {
      setApartmentsLoading(true);
      const { data } = await supabase.from("apartments").select("*").order("created_at", { ascending: false });
      setApartments(data ?? []);
      setApartmentsLoading(false);
    };
    if (tab === "apartments") fetchApartments();
  }, [tab]);

  // Apartment likes
  const handleApartmentLike = async (apartmentId: string, liked: boolean) => {
    if (!user || !id) return;
    const { error } = await supabase.from("squad_likes").upsert({
      squad_id: id,
      apartment_id: apartmentId,
      user_id: user.id,
      liked,
    }, { onConflict: "squad_id,apartment_id,user_id" });
    if (!error) refetch();
  };

  // Check for Super Match and auto-create chat
  const checkSuperMatch = useCallback(async (apartmentId: string) => {
    if (!id || !squad) return;
    const aptLikes = likes.filter((l) => l.apartment_id === apartmentId && l.liked);
    if (aptLikes.length >= members.length && members.length > 1) {
      const apt = apartments.find((a: any) => a.id === apartmentId);
      if (!apt) return;
      
      const leader = members.find((m) => m.role === "leader");
      if (!leader || leader.user_id === apt.user_id) return;
      
      // Check if conversation already exists
      const { data: leaderConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", leader.user_id);
      
      if (leaderConvos && leaderConvos.length > 0) {
        const convoIds = leaderConvos.map((c: any) => c.conversation_id);
        const { data: existingConvo } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", apt.user_id)
          .in("conversation_id", convoIds);
        
        if (existingConvo && existingConvo.length > 0) {
          toast.success("🔥 Super Match! Chat already exists with the landlord!");
          return;
        }
      }
      
      if (user?.id === leader.user_id) {
        const { data: convId, error } = await supabase.rpc("create_conversation_with_participant", {
          other_user_id: apt.user_id,
        });
        if (!error && convId) {
          toast.success("🔥 Super Match! Chat opened with the landlord!", {
            action: { label: "Go to Chat", onClick: () => navigate("/chats") },
          });
        }
      } else {
        toast.success("🔥 Super Match! The squad leader can now chat with the landlord!");
      }
    }
  }, [id, squad, likes, members, apartments, user, navigate]);

  const handleApartmentLikeWithCheck = async (apartmentId: string, liked: boolean) => {
    await handleApartmentLike(apartmentId, liked);
    if (liked) {
      setTimeout(() => checkSuperMatch(apartmentId), 1000);
    }
  };

  // Auto-activate squad when full
  useEffect(() => {
    if (squad && members.length >= squad.target_size && squad.status !== "active") {
      supabase.from("squads").update({ status: "active" }).eq("id", squad.id);
    }
  }, [squad, members.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground text-sm">Loading squad...</p>
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pb-20 px-4">
        <p className="text-foreground font-bold mb-2">Squad not found</p>
        <button onClick={() => navigate("/create")} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; icon: any; label: string; disabled?: boolean }[] = [
    { key: "members", icon: Users, label: "Members" },
    { key: "discover", icon: Heart, label: "Discover", disabled: isFull },
    { key: "apartments", icon: Home, label: "Apartments", disabled: !isActive && !isFull },
    { key: "chat", icon: MessageCircle, label: "Chat" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate("/my-squads")} className="p-1 -ml-1">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-extrabold text-foreground">{squad.name}</h1>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  squad.status === "active" ? "bg-accent/20 text-accent" : squad.status === "forming" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {squad.status.charAt(0).toUpperCase() + squad.status.slice(1)}
                </span>
                <span className="text-muted-foreground text-xs">{members.length}/{squad.target_size} members</span>
              </div>
            </div>
            {groupCompatibility > 0 && <MatchBadge percent={groupCompatibility} size="lg" />}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => !t.disabled && setTab(t.key)}
                  disabled={t.disabled}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    tab === t.key ? "gradient-primary text-primary-foreground" : t.disabled ? "text-muted-foreground/40" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-4">
        {/* MEMBERS TAB */}
        {tab === "members" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Shared preferences */}
            <div className="bg-card rounded-2xl shadow-card p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Shared Preferences</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-semibold">₪{squad.budget_min.toLocaleString()}–{squad.budget_max.toLocaleString()}</span>
                </div>
                {squad.preferred_locations.length > 0 && (
                  <div className="flex items-center gap-1 text-foreground col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{squad.preferred_locations.join(", ")}</span>
                  </div>
                )}
                {squad.no_smoking && <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">🚭 No smoking</span>}
                {squad.pet_friendly && <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">🐾 Pet friendly</span>}
              </div>
            </div>

            {/* Members list */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Members</h3>
              <div className="space-y-2">
                {members.map((m) => {
                  const p = m.profile;
                  const isLeader = m.role === "leader";
                  const compatWithMe = myProfile && p && m.user_id !== user?.id
                    ? calculateUserMatch(myProfile, p)
                    : null;

                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 bg-card rounded-2xl shadow-card">
                      <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        {p?.avatar_url ? (
                          <img src={p.avatar_url} alt={p.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-primary font-bold text-sm">{p?.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-card-foreground text-sm truncate">{p?.name ?? "Unknown"}</span>
                          {isLeader && <Crown className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <span className="text-muted-foreground text-xs">{p?.occupation ?? ""} • {p?.city ?? ""}</span>
                      </div>
                      {compatWithMe !== null && <MatchBadge percent={compatWithMe} size="sm" />}
                    </motion.div>
                  );
                })}
              </div>

              {!isFull && (
                <button
                  onClick={() => setTab("discover")}
                  className="w-full mt-3 border-2 border-dashed border-border rounded-2xl p-4 flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  <Users className="w-4 h-4" /> Find more roommates
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* DISCOVER TAB */}
        {tab === "discover" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {remainingDiscover.length > 0 ? (
              <>
                <div className="relative w-full aspect-[3/4] max-h-[480px]">
                  <AnimatePresence>
                    {remainingDiscover.slice(0, 2).reverse().map((item, i) => (
                      <SwipeCard
                        key={item.user.id}
                        user={item.user}
                        matchPercent={item.squadMatch > 0 ? item.squadMatch : item.personalMatch}
                        onSwipe={handleInvite}
                        isTop={i === 1}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {remainingDiscover[0] && (
                  <div className="text-center mt-2 text-xs text-muted-foreground">
                    Squad compatibility: <span className="font-bold text-foreground">{remainingDiscover[0].squadMatch}%</span> •
                    Personal: <span className="font-bold text-foreground">{remainingDiscover[0].personalMatch}%</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-5 mt-4">
                  <button onClick={() => handleInvite("left")} className="w-14 h-14 bg-card border-2 border-destructive/20 rounded-full flex items-center justify-center shadow-card">
                    <X className="w-6 h-6 text-destructive" />
                  </button>
                  <button onClick={() => handleInvite("right")} className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center shadow-card">
                    <Heart className="w-6 h-6 text-primary-foreground" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="font-bold text-foreground mb-1">No more profiles</h2>
                <p className="text-muted-foreground text-sm">Check back later for new roommates!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* APARTMENTS TAB */}
        {tab === "apartments" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!isActive && !isFull ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Home className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="font-bold text-foreground mb-1">Squad not ready yet</h2>
                <p className="text-muted-foreground text-sm">Fill your squad to unlock apartment search</p>
              </div>
            ) : apartmentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-muted-foreground text-sm">Loading apartments...</p>
              </div>
            ) : apartments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Home className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="font-bold text-foreground mb-1">No apartments yet</h2>
                <p className="text-muted-foreground text-sm">Apartments will appear here once listed</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Like apartments as a group. When everyone likes a listing → Super Match! 🔥
                </p>

                {apartments.map((apt: any) => {
                  const aptLikes = likes.filter((l) => l.apartment_id === apt.id && l.liked);
                  const myLike = likes.find((l) => l.apartment_id === apt.id && l.user_id === user?.id);
                  const allLiked = aptLikes.length >= members.length && members.length > 1;
                  const likeCount = aptLikes.length;

                  return (
                    <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`bg-card rounded-2xl shadow-card overflow-hidden ${allLiked ? "ring-2 ring-accent" : ""}`}
                    >
                      <div className="relative">
                        {apt.images?.[0] ? (
                          <img src={apt.images[0]} alt={apt.title} className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 bg-secondary flex items-center justify-center">
                            <Home className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        {allLiked && (
                          <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Super Match!
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-card-foreground text-sm">{apt.title || "Untitled Apartment"}</h3>
                        <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {apt.neighborhood}{apt.city ? `, ${apt.city}` : ""}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {apt.rooms}</span>
                          <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {apt.bathrooms}</span>
                          <span className="flex items-center gap-1"><Maximize className="w-3 h-3" /> {apt.size}m²</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-foreground">₪{apt.price?.toLocaleString()}/mo</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {likeCount}/{members.length} liked
                            </span>
                            <button
                              onClick={() => handleApartmentLikeWithCheck(apt.id, !myLike?.liked)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                myLike?.liked ? "gradient-primary" : "bg-secondary"
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${myLike?.liked ? "text-primary-foreground fill-current" : "text-muted-foreground"}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* CHAT TAB */}
        {tab === "chat" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col" style={{ minHeight: "calc(100vh - 240px)" }}>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="font-bold text-foreground mb-1">Squad Chat</h2>
                <p className="text-muted-foreground text-sm">Group chat coming soon!</p>
                <p className="text-muted-foreground text-xs mt-1">Use the individual chat for now</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
