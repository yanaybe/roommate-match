import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Home,
  Flag,
  BarChart2,
  Activity,
  Server,
  LogOut,
  Shield,
} from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/rooms", label: "Rooms", icon: Home },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/admin/logs", label: "Logs", icon: Activity },
  { to: "/admin/system", label: "System", icon: Server },
];

export default function AdminLayout() {
  const { isAdmin, user } = useAdminGuard();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-background border-r border-border fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <Shield className="w-5 h-5 text-primary shrink-0" />
          <div>
            <span className="text-sm font-extrabold text-foreground">RooMatch</span>
            <span className="ml-1.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
              Admin
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="px-3 py-4 border-t border-border space-y-2">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-foreground truncate">
              {user?.email ?? "Admin"}
            </p>
            <p className="text-[11px] text-muted-foreground">Administrator</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* div, not <main> — App.tsx owns the main landmark and nesting them is invalid */}
        <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border flex md:hidden">
        {NAV_ITEMS.map(({ to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center py-3 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="w-5 h-5" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
