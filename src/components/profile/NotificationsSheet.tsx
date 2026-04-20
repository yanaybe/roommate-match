import { motion } from "framer-motion";
import { format } from "date-fns";
import { Heart, Users, CheckCheck, MessageCircle, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // kept for API compatibility with Profile.tsx
  user?: any;
  profile?: any;
  t: (key: string) => string;
}

interface NotifPrefs {
  notify_on_match: boolean;
  notify_on_message: boolean;
  notify_on_squad_invite: boolean;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  match: Heart,
  squad_invite: Users,
};

const TYPE_COLOR: Record<string, string> = {
  match: "bg-primary/10 text-primary",
  squad_invite: "bg-accent/10 text-accent-foreground",
};

export default function NotificationsSheet({ open, onOpenChange, t }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [prefs, setPrefs] = useState<NotifPrefs>({
    notify_on_match: true,
    notify_on_message: true,
    notify_on_squad_invite: true,
  });

  // Load saved prefs when sheet opens
  useEffect(() => {
    if (!open || !user?.id) return;
    supabase
      .from("profiles")
      .select("notify_on_match, notify_on_message, notify_on_squad_invite")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const row = data as unknown as NotifPrefs;
          setPrefs({
            notify_on_match: row.notify_on_match ?? true,
            notify_on_message: row.notify_on_message ?? true,
            notify_on_squad_invite: row.notify_on_squad_invite ?? true,
          });
        }
      });
  }, [open, user?.id]);

  const updatePref = async (key: keyof NotifPrefs, value: boolean) => {
    if (!user?.id) return;
    setPrefs((prev) => ({ ...prev, [key]: value }));
    const { error } = await supabase
      .from("profiles")
      .update({ [key]: value })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to save preference");
      setPrefs((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const handleTap = async (n: (typeof notifications)[number]) => {
    await markRead(n.id);
    onOpenChange(false);
    if (n.type === "match") navigate("/chats");
    if (n.type === "squad_invite" && n.reference_id) navigate(`/squad/${n.reference_id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-extrabold text-foreground">
              {t("notifications")}
              {unreadCount > 0 && (
                <span className="ml-2 gradient-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-80px)] px-5 py-4">
          {/* Notification preferences */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Notify me about
              </p>
            </div>
            <div className="bg-card rounded-2xl shadow-card divide-y divide-border">
              {(
                [
                  { key: "notify_on_match" as const, label: "New matches", Icon: Heart },
                  { key: "notify_on_message" as const, label: "New messages", Icon: MessageCircle },
                  { key: "notify_on_squad_invite" as const, label: "Squad invites", Icon: Users },
                ] as { key: keyof NotifPrefs; label: string; Icon: React.ElementType }[]
              ).map(({ key, label, Icon }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                  </div>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={(val) => updatePref(key, val)}
                  />
                </div>
              ))}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-muted-foreground text-sm font-semibold">{t("noMatchesYet")}</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Matches and squad invites will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Heart;
                const colorClass = TYPE_COLOR[n.type] ?? "bg-primary/10 text-primary";
                return (
                  <motion.button
                    key={n.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleTap(n)}
                    className={`w-full flex items-center gap-3 bg-card rounded-2xl p-3.5 shadow-card text-left transition-colors hover:bg-secondary/50 relative ${
                      n.read ? "opacity-70" : ""
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {format(new Date(n.created_at), "MMM d, HH:mm")}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
