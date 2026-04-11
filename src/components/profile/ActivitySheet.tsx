import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Heart, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  t: (key: string) => string;
}

export default function ActivitySheet({ open, onOpenChange, user, t }: Props) {
  const navigate = useNavigate();
  const [activityTab, setActivityTab] = useState<"saved" | "liked" | "squads">("saved");
  const [savedApartments, setSavedApartments] = useState<any[]>([]);
  const [likedProfiles, setLikedProfiles] = useState<any[]>([]);
  const [pendingSquads, setPendingSquads] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActivityLoading(true);

    const fetchActivity = async () => {
      const { data: saves } = await supabase
        .from("saved_apartments")
        .select("*, apartments(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setSavedApartments(saves || []);

      const { data: likes } = await supabase
        .from("liked_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const likedUserIds = (likes || []).map((l: any) => l.liked_user_id);
      const dbProfiles = likedUserIds.length > 0
        ? (await supabase.from("profiles").select("*").in("user_id", likedUserIds)).data ?? []
        : [];

      setLikedProfiles(dbProfiles);

      const { data: invites } = await supabase
        .from("squad_invites")
        .select("*, squads(*)")
        .eq("inviter_id", user.id)
        .eq("status", "pending");

      setPendingSquads(invites || []);
      setActivityLoading(false);
    };

    fetchActivity();
  }, [open, user]);

  const tabs = [
    { key: "saved" as const, label: t("savedRooms"), icon: Home },
    { key: "liked" as const, label: t("likedPeople"), icon: Heart },
    { key: "squads" as const, label: t("pendingSquads"), icon: Users },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-extrabold text-foreground">{t("myActivity")}</SheetTitle>
        </SheetHeader>

        <div className="px-5 pt-3 pb-2 flex gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActivityTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activityTab === key ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
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
                    onClick={() => { onOpenChange(false); navigate(`/apartment/${item.apartments?.id}`); }}
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
                {pendingSquads.map((invite: any) => (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl p-4 shadow-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-card-foreground">{invite.squads?.name || "Squad"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{invite.squads?.preferred_locations?.join(", ")}</p>
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
  );
}
