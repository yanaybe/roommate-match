import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Settings, ChevronRight, Crown, Sparkles, Shield, Bell, LogOut, LogIn, Edit, Bookmark, Heart, Users, Home, ArrowLeft, MessageCircle, Zap } from "lucide-react";
import PremiumSheet from "@/components/PremiumSheet";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import MatchBadge from "@/components/MatchBadge";
import { mockApartments, mockUsers } from "@/data/mockData";
import { calculateUserMatch } from "@/lib/matching";

const getMockSavedApartmentKey = (userId: string, apartmentId: string) => `saved_apartment:${userId}:${apartmentId}`;
const getMockLikedProfileKey = (userId: string, likedUserId: string) => `liked_profile:${userId}:${likedUserId}`;

const getMenuItems = (t: (key: string) => string) => [
  { icon: Crown, label: t("goPremium"), desc: t("unlockAllFeatures"), accent: true, action: "premium" },
  { icon: Bookmark, label: t("myActivity"), desc: t("myActivityDesc"), accent: false, action: "activity" },
  { icon: Sparkles, label: t("preferences"), desc: t("preferencesDesc"), accent: false, action: "preferences" },
  { icon: Bell, label: t("notifications"), desc: t("notificationsDesc"), action: "notifications" },
  { icon: Settings, label: t("settings"), desc: t("settingsDesc"), action: "settings" },
];

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-card rounded-2xl shadow-card p-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground text-sm font-medium">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();
  const { profiles: allProfiles } = useAllProfiles();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"matches" | "squads" | "apartments">("matches");
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<"saved" | "liked" | "squads">("saved");
  const [savedApartments, setSavedApartments] = useState<any[]>([]);
  const [likedProfiles, setLikedProfiles] = useState<any[]>([]);
  const [pendingSquads, setPendingSquads] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
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
    setReadNotifs(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("read_notifs", JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    if (!activityOpen || !user) return;
    setActivityLoading(true);

    const fetchActivity = async () => {
      // Fetch saved apartments
      const { data: saves } = await supabase
        .from("saved_apartments")
        .select("*, apartments(*)")
        .eq("user_id", user.id);

      const mockSavedApartments = mockApartments
        .filter((apartment) => {
          try {
            return localStorage.getItem(getMockSavedApartmentKey(user.id, apartment.id)) === "true";
          } catch {
            return false;
          }
        })
        .map((apartment) => ({
          id: `mock-save-${apartment.id}`,
          apartment_id: apartment.id,
          apartments: {
            id: apartment.id,
            title: apartment.title,
            neighborhood: apartment.location.split(",")[0] ?? apartment.location,
            city: apartment.location.split(",")[1]?.trim() ?? apartment.location,
            price: apartment.price,
            images: apartment.images,
          },
        }));

      setSavedApartments([...(saves || []), ...mockSavedApartments]);

      // Fetch liked profiles
      const { data: likes } = await supabase
        .from("liked_profiles")
        .select("*")
        .eq("user_id", user.id);

      const likedUserIds = (likes || []).map((l: any) => l.liked_user_id);
      if (likedUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", likedUserIds);

        const mockLikedProfiles = mockUsers
          .filter((likedUser) => {
            try {
              return localStorage.getItem(getMockLikedProfileKey(user.id, likedUser.id)) === "true";
            } catch {
              return false;
            }
          })
          .map((likedUser) => ({
            id: `mock-liked-${likedUser.id}`,
            user_id: likedUser.id,
            name: likedUser.name,
            age: likedUser.age,
            occupation: likedUser.occupation,
            city: likedUser.city,
            bio: likedUser.bio,
            avatar_url: likedUser.avatar,
          }));

        setLikedProfiles([...(profilesData || []), ...mockLikedProfiles]);
      } else {
        const mockLikedProfiles = mockUsers
          .filter((likedUser) => {
            try {
              return localStorage.getItem(getMockLikedProfileKey(user.id, likedUser.id)) === "true";
            } catch {
              return false;
            }
          })
          .map((likedUser) => ({
            id: `mock-liked-${likedUser.id}`,
            user_id: likedUser.id,
            name: likedUser.name,
            age: likedUser.age,
            occupation: likedUser.occupation,
            city: likedUser.city,
            bio: likedUser.bio,
            avatar_url: likedUser.avatar,
          }));

        setLikedProfiles(mockLikedProfiles);
      }

      // Fetch squad join requests (pending invites where I'm the inviter asking to join)
      const { data: invites } = await supabase
        .from("squad_invites")
        .select("*, squads(*)")
        .eq("inviter_id", user.id)
        .eq("status", "pending");

      setPendingSquads(invites || []);
      setActivityLoading(false);
    };

    fetchActivity();
  }, [activityOpen, user]);

  // Notifications: fetch matches, active squads, high-match apartments
  useEffect(() => {
    if (!notificationsOpen || !user || !profile) return;
    setNotifLoading(true);

    const fetchNotifications = async () => {
      // 1. Mutual matches: people who liked me AND I liked them
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

      // 2. Squads that became active (status = 'active' where I'm a member)
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

      // 3. New apartments with >85% match (based on budget/city/room type similarity)
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

          // Budget proximity (weight 3)
          if (profile.budget > 0 && apt.price > 0) {
            const diff = Math.abs(profile.budget - apt.price) / Math.max(profile.budget, apt.price);
            score += (1 - diff) * 3;
            factors += 3;
          }

          // City match (weight 2)
          if (profile.city && apt.city) {
            score += (profile.city.toLowerCase() === apt.city.toLowerCase() ? 1 : 0) * 2;
            factors += 2;
          }

          // Room type match (weight 1)
          if (profile.desired_room_type && apt.room_type) {
            score += profile.desired_room_type === apt.room_type ? 1 : 0;
            factors += 1;
          }

          // Pet friendly alignment (weight 1)
          if (profile.pets && apt.pet_friendly) score += 1;
          else if (!profile.pets) score += 1;
          factors += 1;

          // Smoking alignment (weight 1)
          factors += 1;
          if (!profile.smoking) score += 1; // non-smoker is always compatible
          else score += 0.5;

          const matchPct = factors > 0 ? Math.round((score / factors) * 100) : 0;
          return { ...apt, matchPct };
        })
        .filter((apt: any) => apt.matchPct >= 85)
        .slice(0, 20);

      setHighMatchApartments(highMatch);
      setNotifLoading(false);
    };

    fetchNotifications();
  }, [notificationsOpen, user, profile]);


  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-1">{t("signInToRoomatch")}</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          {t("signInDesc")}
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-sm"
        >
          {t("signInSignUp")}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground text-sm">{t("loadingProfile")}</p>
      </div>
    );
  }

  if (!profile || !profile.onboarding_complete) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center px-4">
        <h2 className="text-xl font-extrabold text-foreground mb-2">{t("completeYourProfile")}</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          {t("fillOutProfile")}
        </p>
        <button
          onClick={() => navigate("/onboarding")}
          className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-sm"
        >
          {t("setUpProfile")}
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/auth", { replace: true });
          }}
          className="mt-4 text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          {t("signOut")}
        </button>
      </div>
    );
  }

  const handleMenuClick = (action: string | null) => {
    if (action === "preferences") setPrefsOpen(true);
    if (action === "activity") setActivityOpen(true);
    if (action === "notifications") setNotificationsOpen(true);
    if (action === "premium") setPremiumOpen(true);
    if (action === "settings") navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-6"
        >
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/20 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-3xl font-extrabold">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-foreground">
            {profile.name}, {profile.age}
          </h1>
          <p className="text-muted-foreground text-sm">{profile.occupation} · {profile.city}</p>
          {profile.bio && (
            <p className="text-muted-foreground text-sm mt-1 italic">"{profile.bio}"</p>
          )}
        </motion.div>

        <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-4">
          {getMenuItems(t).map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                onClick={() => handleMenuClick(item.action)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0 text-left"
              >
                <div className={`p-2 rounded-lg ${item.accent ? "gradient-primary" : "bg-secondary"}`}>
                  <Icon className={`w-4 h-4 ${item.accent ? "text-primary-foreground" : "text-secondary-foreground"}`} />
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-semibold ${item.accent ? "text-primary" : "text-card-foreground"}`}>{item.label}</span>
                  <span className="text-muted-foreground text-xs block">{item.desc}</span>
                </div>
                {item.action === "notifications" && (() => {
                  const unread = matches.filter(m => !readNotifs.has(`match_${m.user_id}`)).length +
                    activeSquads.filter(s => !readNotifs.has(`squad_${s.id}`)).length +
                    highMatchApartments.filter(a => !readNotifs.has(`apt_${a.id}`)).length;
                  return unread > 0 ? (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  ) : null;
                })()}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 text-destructive text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          {t("logOut")}
        </button>
      </div>

      {/* Preferences Sheet */}
      <Sheet open={prefsOpen} onOpenChange={setPrefsOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
            <SheetTitle className="text-lg font-extrabold text-foreground">{t("preferences")}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(85vh-70px)] px-5 py-4">
            <ProfileSection title={t("basicInfo")}>
              <InfoRow label={t("budget")} value={`₪${profile.budget.toLocaleString()}/mo`} />
              <InfoRow label={t("roomType")} value={profile.desired_room_type} />
            </ProfileSection>

            <ProfileSection title={t("livingHabits")}>
              <InfoRow label={t("sleepSchedule")} value={profile.sleep_schedule} />
              <InfoRow label={t("cleanliness")} value={`${profile.cleanliness}/5`} />
              <InfoRow label={t("cooking")} value={profile.cooking_habits} />
              <InfoRow label={t("sharedSpace")} value={profile.shared_space_org} />
            </ProfileSection>

            <ProfileSection title={t("lifestyle")}>
              <InfoRow label={t("smoking")} value={profile.smoking ? t("yes") : t("no")} />
              <InfoRow label={t("religiousLevel")} value={profile.religious_level} />
              <InfoRow label={t("alcohol")} value={profile.alcohol} />
              <InfoRow label={t("pets")} value={profile.pets ? t("yes") : t("no")} />
              <InfoRow label={t("fitness")} value={profile.fitness} />
              <InfoRow label={t("workFromHome")} value={profile.wfh ? t("yes") : t("no")} />
              <InfoRow label={t("guests")} value={profile.guests} />
            </ProfileSection>

            <ProfileSection title={t("personality")}>
              <InfoRow label={t("socialLevel")} value={`${profile.social_level}/5`} />
              <InfoRow label={t("noiseLevel")} value={`${profile.noise_level}/5`} />
              <InfoRow label={t("partying")} value={profile.partying} />
              <InfoRow label={t("vibe")} value={profile.lifestyle_vibe} />
            </ProfileSection>

            <ProfileSection title={t("roommatePreferences")}>
              <InfoRow label={t("ageRange")} value={`${profile.preferred_age_min} - ${profile.preferred_age_max}`} />
              <InfoRow label={t("gender")} value={profile.gender_preference} />
              <InfoRow label={t("lifestyleSimilarity")} value={profile.lifestyle_similarity} />
              <InfoRow label={t("cleanlinessExpected")} value={`${profile.cleanliness_expectations}/5`} />
              <InfoRow label={t("activityHours")} value={profile.activity_hours} />
            </ProfileSection>
            <div className="pb-4">
              <button
                onClick={() => { setPrefsOpen(false); navigate("/onboarding?edit=true"); }}
                className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" /> {t("editPreferences")}
              </button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Activity Sheet */}
      <Sheet open={activityOpen} onOpenChange={setActivityOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
            <SheetTitle className="text-lg font-extrabold text-foreground">{t("myActivity")}</SheetTitle>
          </SheetHeader>

          <div className="px-5 pt-3 pb-2 flex gap-2">
            {[
              { key: "saved" as const, label: t("savedRooms"), icon: Home },
              { key: "liked" as const, label: t("likedPeople"), icon: Heart },
              { key: "squads" as const, label: t("pendingSquads"), icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActivityTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activityTab === tab.key
                      ? "gradient-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <ScrollArea className="h-[calc(85vh-130px)] px-5 py-3">
            {activityLoading ? (
              <p className="text-muted-foreground text-sm text-center py-10">{t("loading")}</p>
            ) : activityTab === "saved" ? (
              savedApartments.length === 0 ? (
                <div className="text-center py-10">
                  <Home className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">{t("noSavedRooms")}</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">{t("tapBookmark")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedApartments.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => { setActivityOpen(false); navigate(`/apartment/${item.apartments?.id}`); }}
                      className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-card cursor-pointer hover:bg-secondary/50 transition-colors"
                    >
                      {item.apartments?.images?.[0] && (
                        <img src={item.apartments.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-card-foreground truncate">{item.apartments?.title || "Apartment"}</p>
                        <p className="text-xs text-muted-foreground">{item.apartments?.neighborhood}, {item.apartments?.city}</p>
                        <p className="text-xs font-bold text-primary mt-0.5">₪{item.apartments?.price?.toLocaleString()}/mo</p>
                      </div>
                      <Heart className="w-4 h-4 text-destructive fill-destructive" />
                    </motion.div>
                  ))}
                </div>
              )
            ) : activityTab === "liked" ? (
              likedProfiles.length === 0 ? (
                <div className="text-center py-10">
                  <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">{t("noLikedPeople")}</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">{t("swipeRight")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {likedProfiles.map((p: any) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-card"
                    >
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary text-lg font-bold">{p.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-card-foreground truncate">{p.name}{p.age ? `, ${p.age}` : ""}</p>
                        <p className="text-xs text-muted-foreground">{p.occupation} · {p.city}</p>
                        {p.bio && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{p.bio}</p>}
                      </div>
                      <Heart className="w-4 h-4 text-destructive fill-destructive" />
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              pendingSquads.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">{t("noPendingSquads")}</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">{t("squadsJoinHere")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSquads.map((invite) => (
                    <motion.div
                      key={invite.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-2xl p-4 shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-card-foreground">{invite.squads?.name || "Squad"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {invite.squads?.preferred_locations?.join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Budget: ₪{invite.squads?.budget_min?.toLocaleString()} – ₪{invite.squads?.budget_max?.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent text-accent-foreground">
                          {t("pending")}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
            <SheetTitle className="text-lg font-extrabold text-foreground">{t("notifications")}</SheetTitle>
          </SheetHeader>

          <div className="px-5 pt-3 pb-2 flex gap-2">
            {[
              { key: "matches" as const, label: t("matches"), icon: Heart },
              { key: "squads" as const, label: t("squads"), icon: Users },
              { key: "apartments" as const, label: t("hotRooms"), icon: Home },
            ].map((tab) => {
              const Icon = tab.icon;
              const count = tab.key === "matches" ? matches.filter(m => !readNotifs.has(`match_${m.user_id}`)).length : tab.key === "squads" ? activeSquads.filter(s => !readNotifs.has(`squad_${s.id}`)).length : highMatchApartments.filter(a => !readNotifs.has(`apt_${a.id}`)).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setNotifTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors relative ${
                    notifTab === tab.key
                      ? "gradient-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
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
                      onClick={() => { markRead(`match_${p.user_id}`); setNotificationsOpen(false); navigate("/chats"); }}
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
                      onClick={() => { markRead(`squad_${squad.id}`); setNotificationsOpen(false); navigate(`/squad/${squad.id}`); }}
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
                      onClick={() => { markRead(`apt_${apt.id}`); setNotificationsOpen(false); navigate(`/apartment/${apt.id}`); }}
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
      <PremiumSheet open={premiumOpen} onOpenChange={setPremiumOpen} />
    </div>
  );
}
