import { Search, SlidersHorizontal, Map, List, ArrowRight } from "lucide-react";
import { useState, useMemo, lazy, Suspense, useEffect } from "react";
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
  };
}

export default function Index() {
  const [view, setView] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [apartmentsLoading, setApartmentsLoading] = useState(true);
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { squads, loading: squadsLoading } = useMySquads();
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("apartments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error("Failed to load apartments:", error); }
        setApartments((data ?? []).map(dbRowToApartment));
        setApartmentsLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return apartments.filter((apt) => {
      if (search.trim()) {
        const q = search.toLowerCase();
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
      return true;
    });
  }, [search, filters, apartments]);

  const activeFilterCount = (() => {
    let c = 0;
    if (filters.budgetMin > 0 || filters.budgetMax < 10000) c++;
    if (filters.roomsMin > 1 || filters.roomsMax < 10) c++;
    if (filters.sizeMin > 0) c++;
    if (filters.matchMin > 0) c++;
    if (filters.amenities.length > 0) c++;
    if (filters.smoking !== "any") c++;
    if (filters.pets !== "any") c++;
    if (filters.roomType !== "any") c++;
    if (filters.religiousLevel !== "any") c++;
    if (filters.sleepSchedule !== "any") c++;
    if (filters.cleanlinessMin > 1) c++;
    if (filters.wfh !== "any") c++;
    if (filters.furnished !== "any") c++;
    return c;
  })();

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 pt-12 desk:pt-6 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Roo<span className="text-primary">match</span>
              </h1>
              <p className="text-muted-foreground text-sm">{t("findYourPerfectRoom")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(view === "list" ? "map" : "list")}
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
              className="bg-secondary p-2.5 rounded-xl relative hover:bg-secondary/80 active:scale-95 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 text-secondary-foreground" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 gradient-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* content below sticky header — clipped so nothing bleeds horizontally */}
      <div className="w-full" style={{ overflowX: "clip" }}>
      {user && profile && !profile.onboarding_complete && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <button
            onClick={() => navigate("/onboarding")}
            className="w-full flex items-center gap-3 p-3.5 bg-primary/10 border border-primary/20 rounded-2xl text-left"
          >
            <span className="text-2xl">👤</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{t("completeProfileBanner")}</p>
              <p className="text-xs text-muted-foreground">{t("unlockMatchBanner")}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          </button>
        </div>
      )}

      {user && profile?.onboarding_complete && !squadsLoading && squads.length === 0 && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <button
            onClick={() => navigate("/create-squad")}
            className="w-full flex items-center gap-3 p-3.5 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-primary/20 rounded-2xl text-left"
          >
            <span className="text-2xl">👥</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">{t("searchingWithFriends")}</p>
              <p className="text-xs text-muted-foreground">{t("createSquadBanner")}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {view === "list" ? (
          apartmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ApartmentCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((apt, i) => (
                <ApartmentCard key={apt.id} apartment={apt} index={i} />
              ))}
            </div>
          ) : (
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
              ) : search.trim() ? (
                <button
                  onClick={() => setSearch("")}
                  className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Clear search
                </button>
              ) : null}
            </div>
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
