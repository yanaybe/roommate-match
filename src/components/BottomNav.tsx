import { Home, Users, Plus, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useLanguage } from "@/hooks/useLanguage";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useUnreadCount();
  const { t } = useLanguage();

  const tabs = [
    { path: "/", icon: Home, label: t("navRooms") },
    { path: "/roommates", icon: Users, label: t("navRoommates") },
    { path: "/create", icon: Plus, label: t("navCreate") },
    { path: "/chats", icon: MessageCircle, label: t("navChats") },
    { path: "/profile", icon: User, label: t("navProfile") },
  ];

  if (location.pathname === "/auth") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          const isCreate = tab.path === "/create";
          const badge = tab.path === "/chats" ? totalUnread : 0;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            >
              {isCreate ? (
                <div className="gradient-primary rounded-2xl p-2.5 -mt-4 shadow-elevated">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 gradient-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
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
  );
}
