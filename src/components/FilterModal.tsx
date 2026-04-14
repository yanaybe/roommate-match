import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

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
  roomType: "any" | "private" | "shared";
  religiousLevel: "any" | "secular" | "traditional" | "religious";
  sleepSchedule: "any" | "early" | "night" | "flexible";
  cleanlinessMin: number;
  wfh: "any" | "yes" | "no";
  furnished: "any" | "yes" | "no";
}

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
  roomType: "any",
  religiousLevel: "any",
  sleepSchedule: "any",
  cleanlinessMin: 1,
  wfh: "any",
  furnished: "any",
};

const allAmenities = ["Balcony", "AC", "Laundry", "WiFi", "Rooftop", "Parking", "Gym", "Elevator", "Security", "Garden"];

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (f: Filters) => void;
}

const TriButton = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex gap-1">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          value === opt.value
            ? "gradient-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function FilterModal({ open, onClose, filters, onApply }: FilterModalProps) {
  const [local, setLocal] = useState<Filters>(filters);
  const { t } = useLanguage();

  const update = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setLocal((p) => ({ ...p, [key]: val }));

  const toggleAmenity = (a: string) =>
    setLocal((p) => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter((x) => x !== a)
        : [...p.amenities, a],
    }));

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(defaultFilters);
  };

  const activeCount = (() => {
    let c = 0;
    if (local.budgetMin > 0 || local.budgetMax < 10000) c++;
    if (local.roomsMin > 1 || local.roomsMax < 10) c++;
    if (local.sizeMin > 0) c++;
    if (local.matchMin > 0) c++;
    if (local.amenities.length > 0) c++;
    if (local.smoking !== "any") c++;
    if (local.pets !== "any") c++;
    if (local.roomType !== "any") c++;
    if (local.religiousLevel !== "any") c++;
    if (local.sleepSchedule !== "any") c++;
    if (local.cleanlinessMin > 1) c++;
    if (local.wfh !== "any") c++;
    if (local.furnished !== "any") c++;
    return c;
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-foreground/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card z-10 px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-foreground">{t("filterTitle")}</h2>
              <button onClick={onClose} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-4 space-y-6">
              {/* Budget Range */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("budgetMonthly")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={local.budgetMin}
                    onChange={(e) => update("budgetMin", Number(e.target.value))}
                    placeholder="Min"
                    className="flex-1 bg-secondary text-secondary-foreground px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <input
                    type="number"
                    value={local.budgetMax}
                    onChange={(e) => update("budgetMax", Number(e.target.value))}
                    placeholder="Max"
                    className="flex-1 bg-secondary text-secondary-foreground px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Rooms */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("numberOfRooms")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={local.roomsMin}
                    onChange={(e) => update("roomsMin", Number(e.target.value))}
                    min={1}
                    className="flex-1 bg-secondary text-secondary-foreground px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <input
                    type="number"
                    value={local.roomsMax}
                    onChange={(e) => update("roomsMax", Number(e.target.value))}
                    min={1}
                    className="flex-1 bg-secondary text-secondary-foreground px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Min size */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("minimumSize")}
                </label>
                <input
                  type="number"
                  value={local.sizeMin}
                  onChange={(e) => update("sizeMin", Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Match minimum */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("minimumMatchPct")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={local.matchMin}
                    onChange={(e) => update("matchMin", Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-bold text-primary w-10 text-right">
                    {local.matchMin}%
                  </span>
                </div>
              </div>

              {/* Room type */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("roomType")}
                </label>
                <div className="flex gap-2">
                  {(["any", "private", "shared"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => update("roomType", opt)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                        local.roomType === opt
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {opt === "any" ? t("optAny") : opt === "private" ? t("optPrivate") : t("optSharedOk")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Furnished */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("apartmentPreferences")}
                </label>
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">{t("furnishedLbl")}</span>
                  <TriButton
                    options={[
                      { value: "any", label: t("optAny") },
                      { value: "yes", label: t("optYes") },
                      { value: "no", label: t("optNo") },
                    ]}
                    value={local.furnished}
                    onChange={(v) => update("furnished", v as Filters["furnished"])}
                  />
                </div>
              </div>

              {/* Lifestyle */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("lifestylePreferences")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">{t("smokingLbl")}</span>
                    <TriButton
                      options={[
                        { value: "any", label: t("optAny") },
                        { value: "no", label: t("optNo") },
                        { value: "yes", label: t("optYes") },
                      ]}
                      value={local.smoking}
                      onChange={(v) => update("smoking", v as Filters["smoking"])}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">{t("petsLbl")}</span>
                    <TriButton
                      options={[
                        { value: "any", label: t("optAny") },
                        { value: "no", label: t("optNo") },
                        { value: "yes", label: t("optYes") },
                      ]}
                      value={local.pets}
                      onChange={(v) => update("pets", v as Filters["pets"])}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">{t("wfhFilter")}</span>
                    <TriButton
                      options={[
                        { value: "any", label: t("optAny") },
                        { value: "yes", label: t("optYes") },
                        { value: "no", label: t("optNo") },
                      ]}
                      value={local.wfh}
                      onChange={(v) => update("wfh", v as Filters["wfh"])}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">{t("religiousLevelFilter")}</span>
                    <TriButton
                      options={[
                        { value: "any", label: t("optAny") },
                        { value: "secular", label: t("optSecular") },
                        { value: "traditional", label: t("optTrad") },
                        { value: "religious", label: t("optReligious") },
                      ]}
                      value={local.religiousLevel}
                      onChange={(v) => update("religiousLevel", v as Filters["religiousLevel"])}
                    />
                  </div>
                </div>
              </div>

              {/* Sleep Schedule */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("sleepScheduleFilter")}
                </label>
                <div className="flex gap-2">
                  {([
                    { value: "any" as const, label: t("optAny") },
                    { value: "early" as const, label: t("optEarlyBird") },
                    { value: "night" as const, label: t("optNightOwl") },
                    { value: "flexible" as const, label: t("optFlexible") },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update("sleepSchedule", opt.value)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                        local.sleepSchedule === opt.value
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Cleanliness */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("minCleanliness")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={local.cleanlinessMin}
                    onChange={(e) => update("cleanlinessMin", Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-bold text-primary w-8 text-right">
                    {local.cleanlinessMin}/5
                  </span>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  {t("amenitiesLabel")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {allAmenities.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        local.amenities.includes(a)
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>

            {/* Footer */}
            <div className="bg-card border-t border-border px-5 py-4 flex gap-3 shrink-0">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-secondary text-secondary-foreground active:scale-95 transition-transform"
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
