import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, ChevronRight, Crown, Sparkles, Bell, LogOut, LogIn, Bookmark, ShieldCheck, Pencil, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PremiumSheet from "@/components/PremiumSheet";
import PreferencesSheet from "@/components/profile/PreferencesSheet";
import ActivitySheet from "@/components/profile/ActivitySheet";
import NotificationsSheet from "@/components/profile/NotificationsSheet";
import MyListingsSheet from "@/components/profile/MyListingsSheet";
import VerificationBadges from "@/components/VerificationBadges";
import PhoneVerifySheet from "@/components/PhoneVerifySheet";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

const getMenuItems = (t: (key: string) => string, hasListings: boolean) => [
  { icon: Crown, label: t("goPremium"), desc: t("unlockAllFeatures"), accent: true, action: "premium" },
  { icon: ShieldCheck, label: t("getVerified"), desc: t("addPhoneBadge"), accent: false, action: "verify" },
  { icon: Bookmark, label: t("myActivity"), desc: t("myActivityDesc"), accent: false, action: "activity" },
  ...(hasListings ? [{ icon: Building2, label: "My Listings", desc: "View and edit your posted apartments", accent: false, action: "listings" }] : []),
  { icon: Sparkles, label: t("preferences"), desc: t("preferencesDesc"), accent: false, action: "preferences" },
  { icon: Bell, label: t("notifications"), desc: t("notificationsDesc"), action: "notifications" },
  { icon: Settings, label: t("settings"), desc: t("settingsDesc"), action: "settings" },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  const [hasListings, setHasListings] = useState(false);
  const [listingsOpen, setListingsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("apartments").select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setHasListings((count ?? 0) > 0));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-28 desk:pb-8 flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-1">{t("signInToRoomatch")}</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">{t("signInDesc")}</p>
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
      <div className="min-h-screen bg-background pb-28 desk:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-12 desk:pt-8">
          <div className="flex flex-col items-center text-center mb-6">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-36 mb-2 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded-xl" />
          </div>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 last:border-0">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !profile.onboarding_complete) {
    return (
      <div className="min-h-screen bg-background pb-28 desk:pb-8 flex flex-col items-center justify-center px-4">
        <h2 className="text-xl font-extrabold text-foreground mb-2">{t("completeYourProfile")}</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">{t("fillOutProfile")}</p>
        <button
          onClick={() => navigate("/onboarding")}
          className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-sm"
        >
          {t("setUpProfile")}
        </button>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate("/auth", { replace: true }); }}
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
    if (action === "verify") setPhoneVerifyOpen(true);
    if (action === "listings") setListingsOpen(true);
  };

  const verificationStatus = {
    emailVerified: true, // enforced by Supabase before onboarding
    phoneVerified: (profile as any)?.phone_verified ?? false,
    hasPhotos: !!(profile?.avatar_url),
  };

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-12 desk:pt-8">
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
            <button
              onClick={() => navigate("/onboarding?edit=true")}
              className="absolute bottom-0 right-0 w-7 h-7 gradient-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-background"
              title="Edit profile"
            >
              <Pencil className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
          <h1 className="text-xl font-extrabold text-foreground">
            {profile.name}, {profile.age}
          </h1>
          <p className="text-muted-foreground text-sm">{profile.occupation} · {profile.city}</p>
          {profile.bio && (
            <p className="text-muted-foreground text-sm mt-1 italic">"{profile.bio}"</p>
          )}
          <div className="mt-3">
            <VerificationBadges status={verificationStatus} />
          </div>
        </motion.div>

        <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-4">
          {getMenuItems(t, hasListings).map((item, i) => {
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
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 text-destructive text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          {t("logOut")}
        </button>
      </div>

      <PreferencesSheet open={prefsOpen} onOpenChange={setPrefsOpen} profile={profile} t={t} />
      <ActivitySheet open={activityOpen} onOpenChange={setActivityOpen} user={user} t={t} />
      <NotificationsSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} user={user} profile={profile} t={t} />
      <MyListingsSheet open={listingsOpen} onOpenChange={setListingsOpen} user={user} t={t} isPremium={(profile as any)?.is_premium ?? false} />
      <PremiumSheet open={premiumOpen} onOpenChange={setPremiumOpen} />
      <PhoneVerifySheet open={phoneVerifyOpen} onOpenChange={setPhoneVerifyOpen} onVerified={() => window.location.reload()} />
    </div>
  );
}
