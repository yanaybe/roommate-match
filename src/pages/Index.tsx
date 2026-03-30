import { Search, SlidersHorizontal, Map, List } from "lucide-react";
import { useState, useMemo, lazy, Suspense } from "react";
import ApartmentCard from "@/components/ApartmentCard";
import FilterModal, { defaultFilters, type Filters } from "@/components/FilterModal";
import { mockApartments } from "@/data/mockData";
import { useLanguage } from "@/hooks/useLanguage";

const ApartmentMap = lazy(() => import("@/components/ApartmentMap"));

export default function Index() {
  const [view, setView] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { t } = useLanguage();

  const filtered = useMemo(() => {
    return mockApartments.filter((apt) => {
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
      if (apt.matchPercent < filters.matchMin) return false;
      if (filters.amenities.length > 0) {
        if (!filters.amenities.every((a) => apt.amenities.includes(a))) return false;
      }
      if (filters.smoking !== "any") {
        const hasSmokingRoommate = apt.roommates.some((r) => r.smoking);
        if (filters.smoking === "no" && hasSmokingRoommate) return false;
        if (filters.smoking === "yes" && !hasSmokingRoommate) return false;
      }
      if (filters.pets !== "any") {
        const hasPetRoommate = apt.roommates.some((r) => r.pets);
        if (filters.pets === "no" && hasPetRoommate) return false;
        if (filters.pets === "yes" && !hasPetRoommate) return false;
      }
      return true;
    });
  }, [search, filters]);

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
    return c;
  })();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3">
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
                className="bg-secondary p-2.5 rounded-xl"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className="bg-secondary p-2.5 rounded-xl relative"
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

      <div className="max-w-lg mx-auto px-4 pt-4">
        {view === "list" ? (
          filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((apt, i) => (
                <ApartmentCard key={apt.id} apartment={apt} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="font-bold text-foreground mb-1">{t("noResultsFound")}</h2>
              <p className="text-muted-foreground text-sm">{t("tryAdjusting")}</p>
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

      <FilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
