import * as Sentry from "@sentry/react";
import { Search, SlidersHorizontal, Map, List, ArrowRight, X, RefreshCw, Users, UserRound, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import React, { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import ApartmentCard from "@/components/ApartmentCard";
import { Skeleton } from "@/components/ui/skeleton";
import FilterModal, { defaultFilters, type Filters } from "@/components/FilterModal";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import type { Apartment } from "@/data/mockData";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMySquads } from "@/hooks/useSquad";
import { calculateRoomMatch } from "@/lib/matching";

const ApartmentMap = lazy(() => import("@/components/ApartmentMap"));

// Fallback coordinates when a listing hasn't been geocoded yet
const CITY_COORDS: Record<string, [number, number]> = {
  "Tel Aviv": [32.0853, 34.7818],
  "Jerusalem": [31.7683, 35.2137],
  "Haifa": [32.7940, 34.9896],
  "Beer Sheva": [31.2520, 34.7915],
  "Netanya": [32.3226, 34.8533],
  "Herzliya": [32.1663, 34.8434],
  "Ramat Gan": [32.0826, 34.8127],
  "Rishon LeZion": [31.9730, 34.7925],
  "Petah Tikva": [32.0842, 34.8841],
  "Ashdod": [31.8010, 34.6550],
};

// Rotating live-activity strip — hides after 5 visits or user dismissal
function ActivityStrip() {
  const { t } = useLanguage();
  const [items, setItems] = React.useState<string[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const views = parseInt(localStorage.getItem("activity_strip_views") ?? "0", 10);
    if (views >= 5) return;
    localStorage.setItem("activity_strip_views", String(views + 1));
    supabase
      .from("public_activity")
      .select("display_text")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setItems(data.map((d) => d.display_text));
          setVisible(true);
        }
      });
  }, []);

  React.useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!visible || items.length === 0) return null;

  return (
    <div className="mx-4 mb-3 flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 text-xs">
      <span className="font-bold text-primary shrink-0">{t("liveLabel")}</span>
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
      <span className="flex-1 truncate text-foreground">{items[idx]}</span>
      <button
        onClick={() => { setVisible(false); localStorage.setItem("activity_strip_views", "5"); }}
        aria-label={t("dismiss")}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function ApartmentCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-card">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToApartment(row: any): Apartment {
  const amenities: string[] = [];
  if (row.has_balcony) amenities.push("Balcony");
  if (row.has_parking) amenities.push("Parking");
  if (row.has_elevator) amenities.push("Elevator");
  if (row.has_ac) amenities.push("AC");
  if (row.has_laundry) amenities.push("Laundry");
  if (row.has_wifi) amenities.push("WiFi");
  if (row.has_gym) amenities.push("Gym");
  if (row.has_security) amenities.push("Security");
  if (row.has_rooftop) amenities.push("Rooftop");
  if (row.has_garden) amenities.push("Garden");
  if (row.pet_friendly) amenities.push("Pet Friendly");
  if (row.is_furnished) amenities.push("Furnished");

  const coords: [number, number] =
    Array.isArray(row.coordinates) && row.coordinates.length === 2
      ? [row.coordinates[0], row.coordinates[1]]
      : CITY_COORDS[row.city] ?? [32.0853, 34.7818];

  return {
    id: row.id,
    title: row.title,
    price: row.price,
    location: `${row.neighborhood}, ${row.city}`,
    coordinates: coords,
    images: row.images?.length ? row.images : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
    rooms: row.rooms,
    bathrooms: row.bathrooms,
    size: row.size,
    roommates: [],
    matchPercent: 0,
    amenities,
    available: row.available_date,
    isBoosted: (row.is_featured === true && (!row.featured_until || new Date(row.featured_until) > new Date())) ?? false,
    listingType: (row.listing_type ?? "room") as "room" | "entire_place",
    ownerId: row.user_id,
  };
}

const SQUAD_BANNER_KEY = "squad_banner_dismissed_at";
const SQUAD_BANNER_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week

function isSquadBannerDismissed() {
  try {
    const ts = localStorage.getItem(SQUAD_BANNER_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < SQUAD_BANNER_TTL;
  } catch { return false; }
}

export default function Index() {
  const PAGE_SIZE = 20;
  const [view, setView] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [newApartments, setNewApartments] = useState<Apartment[]>([]);
  const [squadBannerDismissed, setSquadBannerDismissed] = useState(isSquadBannerDismissed);
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { squads, loading: squadsLoading } = useMySquads();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Paginated feed via React Query — cached across navigations, deduped
  // between components, no refetch storm when filters change (filtering is
  // client-side over the loaded pages).
  const {
    data: apartmentPages,
    isPending: apartmentsLoading,
    isFetchingNextPage: loadingMore,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["apartments"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      if (error) {
        Sentry.captureMessage(error.message, "error");
        toast.error(t("failedToLoadApartments"));
        throw new Error(error.message);
      }
      return (data ?? []).map(dbRowToApartment);
    },
    getNextPageParam: (lastPage, pages) => (lastPage.length === PAGE_SIZE ? pages.length : undefined),
  });
  const allLoaded = useMemo(() => (apartmentPages?.pages ?? []).flat(), [apartmentPages]);

  const dismissSquadBanner = () => {
    try { localStorage.setItem(SQUAD_BANNER_KEY, String(Date.now())); } catch { /* storage unavailable */ }
    setSquadBannerDismissed(true);
  };

  // One promo banner at a time, priority-ordered — stacked banners pushed
  // listings below the fold on mobile. Complete-profile wins (blocks matching),
  // then the squad pitch, then the ambient activity strip.
  const promoSlot: "profile" | "squad" | "activity" =
    user && profile && !profile.onboarding_complete
      ? "profile"
      : user && profile?.onboarding_complete && !squadsLoading && squads.length === 0 && !squadBannerDismissed
      ? "squad"
      : "activity";

  // Debounce search input by 300ms so filtering doesn't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Real-time subscription — collect new inserts into a pending banner
  useEffect(() => {
    const channel = supabase
      .channel("apartments:realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "apartments" },
        (payload) => {
          const apt = dbRowToApartment(payload.new);
          setNewApartments((prev) => {
            // avoid duplicates if initial load races with realtime
            if (prev.some((a) => a.id === apt.id)) return prev;
            return [apt, ...prev];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const showNewListings = () => {
    queryClient.setQueryData(
      ["apartments"],
      (old: { pages: Apartment[][]; pageParams: number[] } | undefined) => {
        if (!old?.pages?.length) return old;
        const existing = new Set(old.pages.flat().map((a) => a.id));
        const deduped = newApartments.filter((a) => !existing.has(a.id));
        if (deduped.length === 0) return old;
        return { ...old, pages: [[...deduped, ...old.pages[0]], ...old.pages.slice(1)] };
      },
    );
    setNewApartments([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Score each listing against the viewer's profile (budget fit for now —
  // roommate compatibility folds in once roommate profiles load per listing).
  // MatchBadge hides itself when the score is 0/unknown.
  const scored = useMemo(() => {
    if (!profile?.budget) return allLoaded;
    return allLoaded.map((apt) => ({
      ...apt,
      matchPercent: calculateRoomMatch(profile, apt.price, []),
    }));
  }, [allLoaded, profile]);

  const recommended = useMemo(() => {
    if (!profile?.budget || !profile?.city) return [];
    const budget = profile.budget;
    const city = profile.city.toLowerCase();
    return scored
      .filter((apt) => {
        const withinBudget = apt.price <= budget * 1.15;
        const cityMatch = apt.location.toLowerCase().includes(city);
        return withinBudget && cityMatch;
      })
      .slice(0, 3);
  }, [scored, profile]);

  const filtered = useMemo(() => {
    return scored.filter((apt) => {
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        if (
          !apt.location.toLowerCase().includes(q) &&
          !apt.title.toLowerCase().includes(q)
        )
          return false;
      }
      if (apt.price < filters.budgetMin || apt.price > filters.budgetMax) return false;
      if (apt.rooms < filters.roomsMin || apt.rooms > filters.roomsMax) return false;
      if (apt.size < filters.sizeMin) return false;
      if (filters.amenities.length > 0) {
        if (!filters.amenities.every((a) => apt.amenities.includes(a))) return false;
      }
      if (filters.listingType !== "any" && apt.listingType !== filters.listingType) return false;
      if (filters.furnished === "yes" && !apt.amenities.includes("Furnished")) return false;
      if (filters.furnished === "no" && apt.amenities.includes("Furnished")) return false;
      return true;
    });
  }, [debouncedSearch, filters, scored]);

  const activeFilterCount = (() => {
    let c = 0;
    if (filters.budgetMin > 0 || filters.budgetMax < 10000) c++;
    if (filters.roomsMin > 1 || filters.roomsMax < 10) c++;
    if (filters.sizeMin > 0) c++;
    if (filters.matchMin > 0) c++;
    if (filters.amenities.length > 0) c++;
    if (filters.furnished !== "any") c++;
    if (filters.listingType !== "any") c++;
    return c;
  })();

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 pt-12 desk:pt-6 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Roo<span className="text-primary">Match</span>
              </h1>
              <p className="text-muted-foreground text-sm">{t("heroFindPerfectRoommate")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(view === "list" ? "map" : "list")}
                aria-label={view === "list" ? t("mapView") : t("listView")}
                className="bg-secondary p-2.5 rounded-xl hover:bg-secondary/80 active:scale-95 transition-all"
              >
                {view === "list" ? (
                  <Map className="w-4 h-4 text-secondary-foreground" />
                ) : (
                  <List className="w-4 h-4 text-secondary-foreground" />
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              aria-label={t("filters")}
              className="bg-secondary p-2.5 rounded-xl relative hover:bg-secondary/80 active:scale-95 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 text-secondary-foreground" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* content below sticky header — clipped so nothing bleeds horizontally (disabled in map view: Leaflet breaks under overflow:clip) */}
      <div className="w-full" style={view === "list" ? { overflowX: "clip" } : undefined}>

      {newApartments.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <button
            onClick={showNewListings}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-elevated active:scale-[0.98] transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            {newApartments.length === 1
              ? t("newListingBanner")
              : t("newListingsBanner").replace("{count}", String(newApartments.length))}
          </button>
        </div>
      )}

      {promoSlot === "profile" && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <button
            onClick={() => navigate("/onboarding")}
            className="w-full flex items-center gap-3 p-3.5 bg-primary/10 border border-primary/20 rounded-2xl text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{t("completeProfileBanner")}</p>
              <p className="text-xs text-muted-foreground">{t("unlockMatchBanner")}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          </button>
        </div>
      )}

      {promoSlot === "squad" && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <div className="w-full flex items-center gap-3 p-3.5 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-primary/20 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{t("searchingWithFriends")}</p>
              <p className="text-xs text-muted-foreground">{t("createSquadBanner")}</p>
            </div>
            <button
              onClick={() => navigate("/create-squad")}
              className="shrink-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-xl"
            >
              {t("createAction")}
            </button>
            <button onClick={dismissSquadBanner} aria-label={t("dismiss")} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {promoSlot === "activity" && <ActivityStrip />}

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {view === "list" ? (
          apartmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ApartmentCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <>
            {recommended.length > 0 ? (
              <div className="mb-5">
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="text-base font-extrabold text-foreground">{t("pickedForYou")}</h2>
                  <p className="text-xs text-muted-foreground">{t("basedOnBudgetLocation")}</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                  {recommended.map((apt, i) => (
                    <div key={apt.id} className="shrink-0 w-64 snap-start">
                      <ApartmentCard apartment={apt} index={i} />
                    </div>
                  ))}
                </div>
              </div>
            ) : user && profile?.onboarding_complete && (!profile?.budget || !profile?.city) && (
              <div className="mb-5">
                <button
                  onClick={() => navigate("/onboarding?edit=true")}
                  className="w-full flex items-center gap-3 p-3.5 bg-primary/5 border border-primary/20 rounded-2xl text-left hover:bg-primary/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t("completePicksTitle")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("completePicksDesc")}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((apt, i) => (
                <React.Fragment key={apt.id}>
                  <ApartmentCard apartment={apt} index={i} />
                  {i === Math.min(2, filtered.length - 1) && filtered.length > 1 && squads.length === 0 && (
                    <div
                      className="col-span-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 cursor-pointer flex items-center gap-4"
                      onClick={() => navigate("/create-squad")}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm">{t("searchingWithFriends")}</p>
                        <p className="text-xs text-muted-foreground">{t("createSquadBanner")}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            {hasNextPage && view === "list" && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-xl font-bold text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {loadingMore ? t("loadingEllipsis") : t("loadMore")}
                </button>
              </div>
            )}
            </>
          ) : (
            <>
            {activeFilterCount > 0 || debouncedSearch.trim() ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                  <Search className="w-9 h-9 text-primary" />
                </div>
                <h2 className="text-xl font-extrabold text-foreground mb-2">{t("noResultsFound")}</h2>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs">{t("tryAdjusting")}</p>
                {JSON.stringify(filters) !== JSON.stringify(defaultFilters) ? (
                  <button
                    onClick={() => setFilters(defaultFilters)}
                    className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {t("clearFilters")}
                  </button>
                ) : (
                  <button
                    onClick={() => setSearch("")}
                    className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {t("clearSearch")}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                  <Search className="w-9 h-9 text-primary" />
                </div>
                <h2 className="text-xl font-extrabold text-foreground mb-2">
                  {profile?.city ? t("noListingsInCity").replace("{city}", profile.city) : t("noResultsFound")}
                </h2>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                  {profile?.city
                    ? t("beFirstToPost").replace("{city}", profile.city)
                    : t("tryAdjusting")}
                </p>
                <button
                  onClick={() => navigate("/post-apartment")}
                  className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  {t("postAListing")}
                </button>
              </div>
            )}
            </>
          )
        ) : (
          <Suspense
            fallback={
              <div className="bg-secondary rounded-2xl h-[60vh] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">{t("loadingMap")}</p>
              </div>
            }
          >
            <ApartmentMap apartments={filtered} />
          </Suspense>
        )}
      </div>
      </div>{/* end overflow-x clip wrapper */}

      <FilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
