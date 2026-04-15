import { Home, Users, Plus, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useUnreadCount();
  const { unreadCount: unreadNotifs } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();

  const tabs = [
    { path: "/", icon: Home, label: t("navRooms") },
    { path: "/roommates", icon: Users, label: t("navRoommates") },
    { path: "/create", icon: Plus, label: t("navCreate") },
    { path: "/chats", icon: MessageCircle, label: t("navChats") },
    { path: "/profile", icon: User, label: t("navProfile") },
  ];

  const publicOnlyPaths = ["/auth", "/terms-of-service", "/privacy-policy", "/contact-support", "/onboarding"];
  if (publicOnlyPaths.includes(location.pathname)) return null;
  if (location.pathname === "/" && !user) return null;

  return (
    <>
      {/* ── Mobile: bottom bar ── */}
      <nav className="desk:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16 w-full px-2">
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
      <aside className="hidden desk:flex fixed top-0 bottom-0 w-64 z-50 bg-card/95 backdrop-blur-xl border-border flex-col ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l">
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
                    className="ltr:ml-auto rtl:mr-auto w-1.5 h-5 gradient-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border/50">
          {profile && (
            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-left mb-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  : <span className="text-primary text-sm font-bold">{profile.name.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{profile.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{profile.occupation}</p>
              </div>
            </button>
          )}
          <p className="text-[11px] text-muted-foreground/60 text-center">
            © 2026 Roomatch
          </p>
        </div>
      </aside>
    </>
  );
}
