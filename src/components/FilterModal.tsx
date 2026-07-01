import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Filters {
  budgetMin: number;
  budgetMax: number;
  roomsMin: number;
  roomsMax: number;
  sizeMin: number;
  matchMin: number;
  amenities: string[];
  smoking: "any" | "no" | "yes";
  pets: "any" | "no" | "yes";
  listingType: "any" | "room" | "entire_place";
  roomType: "any" | "private" | "shared";
  religiousLevel: "any" | "secular" | "traditional" | "religious";
  sleepSchedule: "any" | "early" | "night" | "flexible";
  cleanlinessMin: number;
  wfh: "any" | "yes" | "no";
  furnished: "any" | "yes" | "no";
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultFilters: Filters = {
  budgetMin: 0,
  budgetMax: 10000,
  roomsMin: 1,
  roomsMax: 10,
  sizeMin: 0,
  matchMin: 0,
  amenities: [],
  smoking: "any",
  pets: "any",
  listingType: "any",
  roomType: "any",
  religiousLevel: "any",
  sleepSchedule: "any",
  cleanlinessMin: 1,
  wfh: "any",
  furnished: "any",
};

const allAmenities = [
  { key: "Balcony", emoji: "🌅" },
  { key: "AC", emoji: "❄️" },
  { key: "WiFi", emoji: "📶" },
  { key: "Parking", emoji: "🅿️" },
  { key: "Laundry", emoji: "🧺" },
  { key: "Rooftop", emoji: "🏙️" },
  { key: "Gym", emoji: "💪" },
  { key: "Elevator", emoji: "🛗" },
  { key: "Security", emoji: "🔒" },
  { key: "Garden", emoji: "🌿" },
];

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (f: Filters) => void;
}

// ── small reusable pieces ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
      {children}
    </p>
  );
}

function Chip({
  label,
  selected,
  onClick,
  size = "md",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full font-semibold transition-all active:scale-95 ${
        size === "sm"
          ? "px-2.5 py-1 text-[11px]"
          : "px-3.5 py-1.5 text-xs"
      } ${
        selected
          ? "gradient-primary text-primary-foreground shadow-sm"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

/** One-row filter: emoji + label on left, chips on right */
function FilterRow({
  emoji,
  label,
  options,
  value,
  onChange,
}: {
  emoji: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-base w-5 shrink-0 text-center">{emoji}</span>
      <span className="text-xs font-medium text-foreground w-16 shrink-0">{label}</span>
      <div className="flex gap-1 flex-1 justify-end flex-wrap">
        {options.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            size="sm"
            selected={value === opt.value}
            onClick={() => onChange(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

const TABS = ["Basics", "Amenities"] as const;
type Tab = typeof TABS[number];

export default function FilterModal({ open, onClose, filters, onApply }: FilterModalProps) {
  const [local, setLocal] = useState<Filters>(filters);
  const [activeTab, setActiveTab] = useState<Tab>("Basics");
  const [saveSearch, setSaveSearch] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();

  const update = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setLocal((p) => ({ ...p, [key]: val }));

  const toggleAmenity = (a: string) =>
    setLocal((p) => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter((x) => x !== a)
        : [...p.amenities, a],
    }));

  const handleApply = async () => {
    onApply(local);
    if (saveSearch) {
      const label = [local.budgetMax < 10000 ? `under ₪${local.budgetMax.toLocaleString()}` : ""].filter(Boolean).join(" · ") || "My search";
      // Persist to localStorage (cross-session, single device)
      const localSaved = JSON.parse(localStorage.getItem("saved_searches") ?? "[]");
      localSaved.push({ label, filters: local, savedAt: new Date().toISOString() });
      localStorage.setItem("saved_searches", JSON.stringify(localSaved));
      // Also persist to Supabase for cross-device sync
      if (user) {
        try {
          await supabase.from("saved_searches").insert({
            user_id: user.id,
            label,
            filters: local,
            notify_email: true,
          });
        } catch {
          // Graceful fallback: keep localStorage copy
        }
      }
      setSaveSearch(false);
    }
    onClose();
  };
  const handleReset = () => setLocal(defaultFilters);

  const activeCount = (() => {
    let c = 0;
    if (local.budgetMin > 0 || local.budgetMax < 10000) c++;
    if (local.roomsMin > 1 || local.roomsMax < 10) c++;
    if (local.sizeMin > 0) c++;
    if (local.matchMin > 0) c++;
    if (local.amenities.length > 0) c++;
    if (local.furnished !== "any") c++;
    if (local.listingType !== "any") c++;
    return c;
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Handle bar ── */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* ── Header ── */}
            <div className="shrink-0 px-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <h2 className="text-base font-extrabold text-foreground">{t("filterTitle")}</h2>
                {activeCount > 0 && (
                  <span className="gradient-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Tab bar ── */}
            <div className="shrink-0 flex gap-1 px-5 pb-3">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "gradient-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-5 pb-4 space-y-5">

                {/* ── BASICS TAB ── */}
                {activeTab === "Basics" && <>
                  {/* Budget */}
                  <div>
                    <SectionLabel>💰 {t("budgetMonthly")}</SectionLabel>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-1.5 bg-secondary rounded-xl px-3 py-2.5">
                        <span className="text-xs text-muted-foreground shrink-0">₪</span>
                        <input
                          type="number"
                          value={local.budgetMin}
                          onChange={(e) => update("budgetMin", Number(e.target.value))}
                          placeholder="Min"
                          className="flex-1 bg-transparent text-foreground text-sm font-medium focus:outline-none w-0"
                        />
                      </div>
                      <div className="w-4 h-px bg-border shrink-0" />
                      <div className="flex-1 flex items-center gap-1.5 bg-secondary rounded-xl px-3 py-2.5">
                        <span className="text-xs text-muted-foreground shrink-0">₪</span>
                        <input
                          type="number"
                          value={local.budgetMax}
                          onChange={(e) => update("budgetMax", Number(e.target.value))}
                          placeholder="Max"
                          className="flex-1 bg-transparent text-foreground text-sm font-medium focus:outline-none w-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rooms */}
                  <div>
                    <SectionLabel>🛏 {t("numberOfRooms")}</SectionLabel>
                    <div className="flex gap-1.5">
                      {[
                        { label: t("optAny"), min: 1, max: 10 },
                        { label: "1", min: 1, max: 1 },
                        { label: "2", min: 2, max: 2 },
                        { label: "3", min: 3, max: 3 },
                        { label: "4", min: 4, max: 4 },
                        { label: "5+", min: 5, max: 10 },
                      ].map((opt) => {
                        const selected = local.roomsMin === opt.min && local.roomsMax === opt.max;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => { update("roomsMin", opt.min); update("roomsMax", opt.max); }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              selected
                                ? "gradient-primary text-primary-foreground shadow-sm"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size + Match */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <SectionLabel>📐 {t("minimumSize")}</SectionLabel>
                      <div className="flex items-center gap-1.5 bg-secondary rounded-xl px-3 py-2.5">
                        <input
                          type="number"
                          value={local.sizeMin || ""}
                          onChange={(e) => update("sizeMin", Number(e.target.value))}
                          placeholder="0"
                          className="flex-1 bg-transparent text-foreground text-sm font-medium focus:outline-none w-0"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">m²</span>
                      </div>
                    </div>
                    <div>
                      <SectionLabel>
                        ✨ {t("minimumMatchPct")}{" "}
                        <span className="text-primary normal-case tracking-normal font-bold">{local.matchMin}%</span>
                      </SectionLabel>
                      <div className="flex items-center gap-2 pt-1.5">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={local.matchMin}
                          onChange={(e) => update("matchMin", Number(e.target.value))}
                          className="flex-1 accent-primary h-1.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Room type */}
                  <div>
                    <SectionLabel>🚪 {t("roomType")}</SectionLabel>
                    <div className="flex gap-2">
                      {(["any", "private", "shared"] as const).map((opt) => (
                        <Chip
                          key={opt}
                          label={opt === "any" ? t("optAny") : opt === "private" ? t("optPrivate") : t("optSharedOk")}
                          selected={local.roomType === opt}
                          onClick={() => update("roomType", opt)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Furnished */}
                  <div>
                    <SectionLabel>🛋 {t("furnishedLbl")}</SectionLabel>
                    <div className="flex gap-2">
                      {(["any", "yes", "no"] as const).map((opt) => (
                        <Chip
                          key={opt}
                          label={opt === "any" ? t("optAny") : opt === "yes" ? t("optYes") : t("optNo")}
                          selected={local.furnished === opt}
                          onClick={() => update("furnished", opt)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Listing type */}
                  <div>
                    <SectionLabel>🏠 Listing Type</SectionLabel>
                    <div className="flex gap-2">
                      {([
                        { value: "any", label: t("optAny") },
                        { value: "room", label: "🚪 Room" },
                        { value: "entire_place", label: "🏠 Entire Apt" },
                      ] as const).map((opt) => (
                        <Chip
                          key={opt.value}
                          label={opt.label}
                          selected={local.listingType === opt.value}
                          onClick={() => update("listingType", opt.value)}
                        />
                      ))}
                    </div>
                  </div>
                </>}

                {/* ── AMENITIES TAB ── */}
                {activeTab === "Amenities" && (
                  <>
                  <div>
                    <SectionLabel>🏠 {t("amenitiesLabel")}</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {allAmenities.map(({ key, emoji }) => (
                        <button
                          key={key}
                          onClick={() => toggleAmenity(key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 hover:brightness-95 ${
                            local.amenities.includes(key)
                              ? "gradient-primary text-primary-foreground shadow-sm"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <span>{emoji}</span>
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>
                      ✨ {t("minimumMatchPct")}{" "}
                      <span className="text-primary normal-case tracking-normal font-bold">{local.matchMin}%</span>
                    </SectionLabel>
                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={local.matchMin}
                        onChange={(e) => update("matchMin", Number(e.target.value))}
                        className="flex-1 accent-primary h-1.5"
                      />
                    </div>
                  </div>
                </>
                )}

              </div>
            </div>

            {/* ── Save search toggle ── */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-border bg-card">
              <div>
                <p className="text-sm font-semibold text-foreground">Save this search</p>
                <p className="text-xs text-muted-foreground">Get notified when new listings match</p>
              </div>
              <button
                type="button"
                onClick={() => setSaveSearch((s) => !s)}
                className={`relative w-11 h-6 rounded-full transition-colors ${saveSearch ? "bg-primary" : "bg-secondary"}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${saveSearch ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 bg-card border-t border-border px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex gap-3">
              <button
                onClick={handleReset}
                className="px-5 py-3.5 rounded-xl text-sm font-bold bg-secondary text-secondary-foreground active:scale-95 transition-transform"
              >
                {t("resetAll")}
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold gradient-primary text-primary-foreground shadow-elevated active:scale-95 transition-transform"
              >
                {t("showResults")}{activeCount > 0 ? ` (${activeCount})` : ""}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
