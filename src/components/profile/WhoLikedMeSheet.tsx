import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Lock, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import PremiumSheet from "@/components/PremiumSheet";
import type { User } from "@supabase/supabase-js";

interface Profile {
  user_id: string;
  name: string;
  age: number | null;
  occupation: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  t: (key: string) => string;
}

const GOLD_TIERS = new Set(["gold", "platinum"]);

export default function WhoLikedMeSheet({ open, onOpenChange, user, t }: Props) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState<string>("free");
  const [premiumOpen, setPremiumOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const fetch = async () => {
      const [{ data: profileData }, { data: likes }] = await Promise.all([
        supabase.from("profiles").select("subscription_tier").eq("user_id", user.id).maybeSingle(),
        supabase.from("liked_profiles").select("user_id").eq("liked_user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const currentTier = profileData?.subscription_tier ?? "free";
      setTier(currentTier);

      const likerIds = (likes ?? []).map((l) => l.user_id);

      if (likerIds.length === 0 || !GOLD_TIERS.has(currentTier)) {
        // For non-gold users we only need the count, not the actual profiles
        if (!GOLD_TIERS.has(currentTier)) {
          // Populate with placeholder profiles so the blur wall shows the right count
          setProfiles(likerIds.map((id) => ({ user_id: id, name: "???", age: null, occupation: null, city: null, bio: null, avatar_url: null })));
        } else {
          setProfiles([]);
        }
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, age, occupation, city, bio, avatar_url")
        .in("user_id", likerIds);

      setProfiles((data as Profile[]) ?? []);
      setLoading(false);
    };

    fetch();
  }, [open, user.id]);

  const isGold = GOLD_TIERS.has(tier);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
            <SheetTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-destructive fill-destructive" />
              {t("whoLikedMe")}
              {!isGold && (
                <span className="ml-auto flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  <Crown className="w-3 h-3" /> Gold
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(85vh-80px)] px-5 py-4">
            {loading ? (
              <p className="text-muted-foreground text-sm text-center py-10">{t("loading")}</p>
            ) : !isGold ? (
              /* Paywall: always shown for free users — dummy cards if no real likes yet */
              <div className="relative">
                <div className="space-y-3 pointer-events-none select-none">
                  {(profiles.length > 0 ? profiles.slice(0, 5) : [{}, {}, {}]).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-sm blur-sm">
                      <div className="w-14 h-14 rounded-full bg-primary/20 shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-4 w-28 bg-secondary rounded" />
                        <div className="h-3 w-20 bg-secondary rounded" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <div className="bg-card/95 backdrop-blur-md rounded-3xl p-6 shadow-elevated border border-border/50 max-w-xs w-full">
                    <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-base font-extrabold text-foreground mb-1">
                      {profiles.length > 0
                        ? `${profiles.length} ${profiles.length === 1 ? "person" : "people"} liked you`
                        : "See who likes you"}
                    </h3>
                    <p className="text-muted-foreground text-xs mb-4">
                      Upgrade to Gold to see who liked you and message them first.
                    </p>
                    <button
                      onClick={() => { onOpenChange(false); setPremiumOpen(true); }}
                      className="w-full gradient-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Crown className="w-4 h-4" /> Upgrade to Gold
                    </button>
                  </div>
                </div>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">{t("noLikesReceived")}</p>
                <p className="text-muted-foreground/60 text-xs mt-1">{t("noLikesReceivedDesc")}</p>
              </div>
            ) : (
              /* Gold user: show real profiles */
              <div className="space-y-3">
                {profiles.map((p) => (
                  <motion.div
                    key={p.user_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { onOpenChange(false); navigate(`/roommate/${p.user_id}`); }}
                    className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-card cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=112`;
                          }}
                        />
                      ) : (
                        <span className="text-primary text-lg font-bold">{p.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-card-foreground truncate">
                        {p.name}{p.age ? `, ${p.age}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.occupation}{p.city ? ` · ${p.city}` : ""}
                      </p>
                      {p.bio && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{p.bio}</p>}
                    </div>
                    <Heart className="w-4 h-4 text-destructive fill-destructive shrink-0" />
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <PremiumSheet open={premiumOpen} onOpenChange={setPremiumOpen} />
    </>
  );
}
