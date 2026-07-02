import { RotateCcw } from "lucide-react";
import { defaultFilters, type Filters } from "@/components/FilterModal";
import { useLanguage } from "@/hooks/useLanguage";
import { AMENITY_ICONS } from "@/lib/amenityIcons";

const RAIL_AMENITIES = ["Balcony", "AC", "WiFi", "Parking", "Laundry", "Rooftop", "Gym", "Elevator", "Security", "Garden"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ label, selected, onClick, icon: Icon }: {
  label: string; selected: boolean; onClick: () => void; icon?: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
        selected ? "gradient-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

/**
 * Desktop-only persistent filter sidebar for the apartments feed.
 * Unlike FilterModal (mobile, apply-on-close), changes here apply immediately —
 * results update live next to the controls.
 */
export default function FilterRail({ filters, onChange }: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const { t } = useLanguage();
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  const isDirty = JSON.stringify(filters) !== JSON.stringify(defaultFilters);

  const toggleAmenity = (key: string) =>
    set(
      "amenities",
      filters.amenities.includes(key)
        ? filters.amenities.filter((a) => a !== key)
        : [...filters.amenities, key],
    );

  return (
    <aside className="hidden desk:block w-60 shrink-0">
      <div className="sticky top-28 space-y-5 bg-card rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground">{t("filters")}</h2>
          {isDirty && (
            <button
              onClick={() => onChange(defaultFilters)}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <RotateCcw className="w-3 h-3" /> {t("clearFilters")}
            </button>
          )}
        </div>

        <Section title={t("budgetMonthly")}>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1 bg-secondary rounded-xl px-2.5 py-2">
              <span className="text-xs text-muted-foreground shrink-0">₪</span>
              <input
                type="number"
                value={filters.budgetMin || ""}
                placeholder="0"
                onChange={(e) => set("budgetMin", Number(e.target.value) || 0)}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                aria-label={t("budgetMonthly") + " min"}
              />
            </div>
            <span className="text-muted-foreground text-xs">–</span>
            <div className="flex-1 flex items-center gap-1 bg-secondary rounded-xl px-2.5 py-2">
              <span className="text-xs text-muted-foreground shrink-0">₪</span>
              <input
                type="number"
                value={filters.budgetMax === 10000 ? "" : filters.budgetMax}
                placeholder="10k+"
                onChange={(e) => set("budgetMax", Number(e.target.value) || 10000)}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                aria-label={t("budgetMonthly") + " max"}
              />
            </div>
          </div>
        </Section>

        <Section title={t("listingTypeLbl")}>
          <div className="flex flex-wrap gap-1.5">
            <Chip label={t("optAny")} selected={filters.listingType === "any"} onClick={() => set("listingType", "any")} />
            <Chip label={t("roomLbl")} selected={filters.listingType === "room"} onClick={() => set("listingType", "room")} />
            <Chip label={t("entireApt")} selected={filters.listingType === "entire_place"} onClick={() => set("listingType", "entire_place")} />
          </div>
        </Section>

        <Section title={t("furnishedLbl")}>
          <div className="flex flex-wrap gap-1.5">
            <Chip label={t("optAny")} selected={filters.furnished === "any"} onClick={() => set("furnished", "any")} />
            <Chip label={t("yes")} selected={filters.furnished === "yes"} onClick={() => set("furnished", "yes")} />
            <Chip label={t("no")} selected={filters.furnished === "no"} onClick={() => set("furnished", "no")} />
          </div>
        </Section>

        <Section title={t("amenitiesLabel")}>
          <div className="flex flex-wrap gap-1.5">
            {RAIL_AMENITIES.map((key) => (
              <Chip
                key={key}
                label={key}
                icon={AMENITY_ICONS[key]}
                selected={filters.amenities.includes(key)}
                onClick={() => toggleAmenity(key)}
              />
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}
