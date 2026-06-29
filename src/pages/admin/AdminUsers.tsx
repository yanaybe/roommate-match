import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import AdminUserDetail from "./AdminUserDetail";

interface UserRow {
  user_id: string;
  name: string;
  avatar_url: string | null;
  city: string;
  subscription_tier: string;
  is_banned: boolean;
  is_admin: boolean;
  onboarding_complete: boolean;
  created_at: string;
}

const PAGE_SIZE = 20;

const TIER_COLORS: Record<string, string> = {
  free: "bg-secondary text-muted-foreground",
  plus: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  gold: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  platinum: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

type FilterType = "all" | "onboarded" | "premium" | "banned" | "admins";

function statusLabel(u: UserRow): { text: string; cls: string } {
  if (u.is_banned) return { text: "Banned", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  if (!u.onboarding_complete) return { text: "Incomplete", cls: "bg-secondary text-muted-foreground" };
  return { text: "Active", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id,name,avatar_url,city,subscription_tier,is_banned,is_admin,onboarding_complete,created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
      } else {
        setUsers((data ?? []) as UserRow[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let rows = users;
    if (filter === "onboarded") rows = rows.filter((u) => u.onboarding_complete);
    else if (filter === "premium") rows = rows.filter((u) => u.subscription_tier !== "free");
    else if (filter === "banned") rows = rows.filter((u) => u.is_banned);
    else if (filter === "admins") rows = rows.filter((u) => u.is_admin);

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((u) => u.name?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q));
    }
    return rows;
  }, [users, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleBanToggle = async (userId: string, banned: boolean) => {
    if (!window.confirm(banned ? "Ban this user?" : "Unban this user?")) return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: banned })
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(banned ? "User banned" : "User unbanned");
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, is_banned: banned } : u)));
    }
  };

  const handleAdminToggle = async (userId: string, isAdmin: boolean) => {
    const confirmMsg = isAdmin
      ? "Grant admin privileges to this user?"
      : "Remove admin privileges from this user?";
    if (!window.confirm(confirmMsg)) return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAdmin ? "Admin granted" : "Admin removed");
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, is_admin: isAdmin } : u)));
    }
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "onboarded", label: "Onboarded" },
    { key: "premium", label: "Premium" },
    { key: "banned", label: "Banned" },
    { key: "admins", label: "Admins" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} total registered users</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name or city…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted h-14" />
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            No users match the current filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3">User</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3 hidden sm:table-cell">City</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3">Tier</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3 hidden lg:table-cell">Joined</th>
                  <th className="text-right text-xs font-bold text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.map((u) => {
                  const status = statusLabel(u);
                  return (
                    <tr key={u.user_id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {u.name?.[0] ?? "?"}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-foreground">{u.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{u.city || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_COLORS[u.subscription_tier] ?? TIER_COLORS.free}`}>
                          {u.subscription_tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedId(u.user_id)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleBanToggle(u.user_id, !u.is_banned)}
                            className={`text-xs font-semibold ${u.is_banned ? "text-green-600 hover:underline" : "text-destructive hover:underline"}`}
                          >
                            {u.is_banned ? "Unban" : "Ban"}
                          </button>
                          <button
                            onClick={() => handleAdminToggle(u.user_id, !u.is_admin)}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline hidden sm:inline"
                          >
                            {u.is_admin ? "Unadmin" : "Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AdminUserDetail
        userId={selectedId}
        onClose={() => setSelectedId(null)}
        onBanToggle={(uid, banned) =>
          setUsers((prev) => prev.map((u) => (u.user_id === uid ? { ...u, is_banned: banned } : u)))
        }
      />
    </div>
  );
}
