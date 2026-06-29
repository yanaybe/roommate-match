import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, Star } from "lucide-react";

interface ApartmentRow {
  id: string;
  title: string;
  city: string;
  price: number;
  room_type: string;
  images: string[];
  is_featured: boolean;
  created_at: string;
  user_id: string;
  owner_name?: string;
}

const PAGE_SIZE = 20;

type FilterType = "all" | "featured" | "recent";

export default function AdminRooms() {
  const [rooms, setRooms] = useState<ApartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: apartments, error } = await supabase
        .from("apartments")
        .select("id,title,city,price,room_type,images,is_featured,created_at,user_id")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const rows = apartments ?? [];

      // Fetch owner names
      const ownerIds = [...new Set(rows.map((r) => r.user_id))];
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id,name")
          .in("user_id", ownerIds);

        const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.name]));
        setRooms(
          rows.map((r) => ({ ...r, owner_name: nameMap.get(r.user_id) ?? "Unknown" }))
        );
      } else {
        setRooms(rows);
      }

      setLoading(false);
    };

    load().catch((err) => {
      toast.error(err instanceof Error ? err.message : String(err));
      setLoading(false);
    });
  }, []);

  const sevenDaysAgo = useMemo(() => new Date(Date.now() - 7 * 86400000).toISOString(), []);

  const filtered = useMemo(() => {
    let rows = rooms;
    if (filter === "featured") rows = rows.filter((r) => r.is_featured);
    else if (filter === "recent") rows = rows.filter((r) => r.created_at >= sevenDaysAgo);

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [rooms, filter, search, sevenDaysAgo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("apartments")
      .update({ is_featured: !current })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(current ? "Listing unfeatured" : "Listing featured");
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, is_featured: !current } : r)));
    }
  };

  const deleteRoom = async (id: string, title: string) => {
    if (!window.confirm(`Delete listing "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("apartments").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Listing deleted");
      setRooms((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "featured", label: "Featured" },
    { key: "recent", label: "Recent (7d)" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Rooms</h1>
        <p className="text-sm text-muted-foreground mt-1">{rooms.length} total listings</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by title or city…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1.5">
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
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted h-16" />
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            No listings match the current filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3 w-10"></th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3">Title</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3 hidden sm:table-cell">City</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3">Price</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3 hidden lg:table-cell">Owner</th>
                  <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3 hidden lg:table-cell">Created</th>
                  <th className="text-right text-xs font-bold text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden">
                        {r.images?.[0] ? (
                          <img src={r.images[0]} alt={r.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-secondary" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground line-clamp-1">{r.title}</span>
                        {r.is_featured && (
                          <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">{r.city}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">₪{r.price?.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">{r.room_type}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{r.owner_name}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleFeatured(r.id, r.is_featured)}
                          className={`text-xs font-semibold ${r.is_featured ? "text-amber-600 hover:underline" : "text-muted-foreground hover:text-foreground hover:underline"}`}
                        >
                          {r.is_featured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          onClick={() => deleteRoom(r.id, r.title)}
                          className="text-xs font-semibold text-destructive hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
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
    </div>
  );
}
