import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ban, Shield, X } from "lucide-react";

interface UserDetail {
  user_id: string;
  name: string;
  avatar_url: string | null;
  city: string;
  budget: number;
  occupation: string;
  age: number | null;
  onboarding_complete: boolean;
  is_admin: boolean;
  is_banned: boolean;
  subscription_tier: string;
  sleep_schedule: string;
  smoking: boolean;
  pets: boolean;
  cleanliness: number;
  wfh: boolean;
  created_at: string;
  updated_at: string;
  paddle_customer_id: string | null;
}

function maskPaddle(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 8) return "••••••••";
  return id.slice(0, 4) + "••••" + id.slice(-4);
}

const TIER_COLORS: Record<string, string> = {
  free: "bg-secondary text-muted-foreground",
  plus: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  gold: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  platinum: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

interface Props {
  userId: string | null;
  onClose: () => void;
  onBanToggle?: (userId: string, banned: boolean) => void;
}

export default function AdminUserDetail({ userId, onClose, onBanToggle }: Props) {
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setProfile(null);

    supabase
      .from("profiles")
      .select(
        "user_id,name,avatar_url,city,budget,occupation,age,onboarding_complete,is_admin,is_banned,subscription_tier,sleep_schedule,smoking,pets,cleanliness,wfh,created_at,updated_at,paddle_customer_id"
      )
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setProfile(data as UserDetail | null);
        setLoading(false);
      });
  }, [userId]);

  const toggleBan = async () => {
    if (!profile) return;
    const newVal = !profile.is_banned;
    const confirmMsg = newVal
      ? `Ban ${profile.name}? They will not be able to use the app.`
      : `Unban ${profile.name}?`;
    if (!window.confirm(confirmMsg)) return;

    setActioning(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: newVal })
      .eq("user_id", profile.user_id);
    setActioning(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(newVal ? "User banned" : "User unbanned");
      setProfile((p) => (p ? { ...p, is_banned: newVal } : p));
      onBanToggle?.(profile.user_id, newVal);
    }
  };

  const toggleAdmin = async () => {
    if (!profile) return;
    const newVal = !profile.is_admin;
    const confirmMsg = newVal
      ? `Grant admin privileges to ${profile.name}?`
      : `Remove admin privileges from ${profile.name}?`;
    if (!window.confirm(confirmMsg)) return;

    setActioning(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: newVal })
      .eq("user_id", profile.user_id);
    setActioning(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(newVal ? "Admin granted" : "Admin removed");
      setProfile((p) => (p ? { ...p, is_admin: newVal } : p));
    }
  };

  return (
    <Sheet open={!!userId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Detail</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="space-y-3 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted rounded-xl h-10" />
            ))}
          </div>
        )}

        {!loading && !profile && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            User not found
          </div>
        )}

        {!loading && profile && (
          <div className="space-y-6 mt-4">
            {/* Avatar + name + badges */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                    {profile.name?.[0] ?? "?"}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">{profile.name}</h2>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_COLORS[profile.subscription_tier] ?? TIER_COLORS.free}`}>
                    {profile.subscription_tier}
                  </span>
                  {profile.is_admin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Admin
                    </span>
                  )}
                  {profile.is_banned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                      Banned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Key stats */}
            <section>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Profile</h3>
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {[
                  ["City", profile.city || "—"],
                  ["Budget", profile.budget ? `₪${profile.budget.toLocaleString()}` : "—"],
                  ["Occupation", profile.occupation || "—"],
                  ["Age", profile.age ?? "—"],
                  ["Onboarded", profile.onboarding_complete ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <span className="text-xs font-semibold text-foreground">{String(v)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Lifestyle */}
            <section>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Lifestyle</h3>
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {[
                  ["Sleep", profile.sleep_schedule || "—"],
                  ["Smoking", profile.smoking ? "Yes" : "No"],
                  ["Pets", profile.pets ? "Yes" : "No"],
                  ["Cleanliness", `${profile.cleanliness}/5`],
                  ["Works from home", profile.wfh ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <span className="text-xs font-semibold text-foreground">{String(v)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Account info */}
            <section>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Account</h3>
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {[
                  ["User ID", profile.user_id.slice(0, 8) + "…"],
                  ["Created", new Date(profile.created_at).toLocaleDateString()],
                  ["Updated", new Date(profile.updated_at).toLocaleDateString()],
                  ["Subscription", profile.subscription_tier],
                  ["Paddle ID", maskPaddle(profile.paddle_customer_id)],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <span className="text-xs font-semibold text-foreground font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick actions */}
            <section className="flex flex-col gap-2 pb-4">
              <button
                onClick={toggleBan}
                disabled={actioning}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  profile.is_banned
                    ? "bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                }`}
              >
                <Ban className="w-4 h-4" />
                {profile.is_banned ? "Unban User" : "Ban User"}
              </button>
              <button
                onClick={toggleAdmin}
                disabled={actioning}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                {profile.is_admin ? "Remove Admin" : "Make Admin"}
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
