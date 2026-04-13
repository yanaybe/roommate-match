import { Home, Users, Plus, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useUnreadCount();
  const { unreadCount: unreadNotifs } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();

  const tabs = [
    { path: "/", icon: Home, label: t("navRooms") },
    { path: "/roommates", icon: Users, label: t("navRoommates") },
    { path: "/create", icon: Plus, label: t("navCreate") },
    { path: "/chats", icon: MessageCircle, label: t("navChats") },
    { path: "/profile", icon: User, label: t("navProfile") },
  ];

  if (location.pathname === "/auth") return null;
  if (location.pathname === "/" && !user) return null;

  return (
    <>
      {/* ── Mobile: bottom bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            const isCreate = tab.path === "/create";
            const badge =
              tab.path === "/chats" ? totalUnread :
              tab.path === "/profile" ? unreadNotifs : 0;

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer"
              >
                {isCreate ? (
                  <div className="gradient-primary rounded-2xl p-2.5 -mt-4 shadow-elevated">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 gradient-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTabMobile"
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 gradient-primary rounded-full"
                      />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop: left sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 z-50 bg-card/95 backdrop-blur-xl border-r border-border flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-border/50">
          <span className="text-2xl font-extrabold text-foreground tracking-tight">
            Roo<span className="text-primary">match</span>
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">Find your perfect roommate</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            const isCreate = tab.path === "/create";
            const badge =
              tab.path === "/chats" ? totalUnread :
              tab.path === "/profile" ? unreadNotifs : 0;

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  isCreate
                    ? "gradient-primary text-primary-foreground shadow-md mt-2"
                    : isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className="relative shrink-0">
                  <Icon className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 gradient-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                <span className={`text-sm font-semibold ${isCreate ? "text-primary-foreground" : ""}`}>
                  {tab.label}
                </span>
                {isActive && !isCreate && (
                  <motion.div
                    layoutId="activeTabDesktop"
                    className="ml-auto w-1.5 h-5 gradient-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/50">
          <p className="text-[11px] text-muted-foreground/60 text-center">
            © 2026 Roomatch
          </p>
        </div>
      </aside>
    </>
  );
}
