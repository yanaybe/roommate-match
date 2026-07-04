import { Home, Users, Handshake, MessageCircle, User, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSidebar } from "@/hooks/useSidebar";


export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useUnreadCount();
  const { unreadCount: unreadNotifs } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { collapsed, toggle } = useSidebar();

  const tabs = [
    { path: "/", icon: Home, label: t("navRooms") },
    { path: "/roommates", icon: Users, label: t("navRoommates") },
    { path: "/my-squads", icon: Handshake, label: t("navSquads") },
    { path: "/chats", icon: MessageCircle, label: t("navChats") },
    { path: "/profile", icon: User, label: t("navProfile") },
    ...(profile?.is_admin ? [{ path: "/admin", icon: Shield, label: t("navAdmin") }] : []),
  ];

  const publicOnlyPaths = ["/auth", "/terms-of-service", "/privacy-policy", "/contact-support", "/onboarding", "/help-center", "/verify-email", "/welcome"];
  if (publicOnlyPaths.includes(location.pathname)) return null;
  if (location.pathname.startsWith("/admin")) return null;
  if (!user) return null;

  return (
    <>
      {/* ── Mobile: bottom bar ── */}
      {/* safe-area-inset-bottom via inline style for iOS home indicator */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", transform: "translateZ(0)" }}
      >
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
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-lg"
              >
                {isCreate ? (
                  <>
                    <div className="gradient-primary rounded-xl p-1.5 shadow-md mb-0.5">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{tab.label}</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ opacity: isActive ? 1 : 0, scaleX: isActive ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-6 h-0.5 bg-primary rounded-full mb-1"
                    />
                    <div className="relative">
                      <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {tab.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop: left sidebar ── */}
      <aside
        className={`hidden md:flex fixed top-0 bottom-0 z-50 bg-card/95 backdrop-blur-xl border-border flex-col ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l transition-all duration-200 overflow-hidden ${
          collapsed ? "w-14" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className={`border-b border-border/50 flex items-center shrink-0 ${collapsed ? "px-0 py-6 justify-center" : "px-6 py-6 justify-between"}`}>
          {collapsed ? (
            <img src="/logo.png" alt="RooMatch" className="w-8 h-8 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="RooMatch" className="w-9 h-9 object-contain" />
              <div>
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
                  Roo<span className="text-primary">Match</span>
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">{t("heroFindPerfectRoommate")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? "px-1" : "px-3"}`}>
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
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? tab.label : undefined}
                className={`w-full flex items-center rounded-xl transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
                } ${
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
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className={`text-sm font-semibold ${isCreate ? "text-primary-foreground" : ""}`}>
                      {tab.label}
                    </span>
                    {isActive && !isCreate && (
                      <motion.div
                        layoutId="activeTabDesktop"
                        className="ltr:ml-auto rtl:mr-auto w-1.5 h-5 bg-primary rounded-full"
                      />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`py-4 border-t border-border/50 ${collapsed ? "px-1" : "px-3"}`}>
          {profile && (
            <button
              onClick={() => navigate("/profile")}
              title={collapsed ? profile.name : undefined}
              className={`w-full flex items-center rounded-xl hover:bg-secondary transition-colors text-left mb-2 ${
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  : <span className="text-primary text-sm font-bold">{profile.name.charAt(0).toUpperCase()}</span>}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{profile.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.occupation}</p>
                </div>
              )}
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={toggle}
            title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            className={`w-full flex items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors py-2 ${
              collapsed ? "justify-center px-0" : "gap-2 px-3"
            }`}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <><ChevronLeft className="w-4 h-4" /><span className="text-xs font-medium">{t("collapseSidebarLabel")}</span></>}
          </button>

          {!collapsed && (
            <p className="text-[11px] text-muted-foreground/60 text-center mt-2">
              © {new Date().getFullYear()} RooMatch
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
