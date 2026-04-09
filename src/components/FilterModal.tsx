import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
          className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm"
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
              <h2 className="text-lg font-extrabold text-foreground">Filters</h2>
              <button onClick={onClose} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-4 space-y-6">
              {/* Budget Range */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Budget (₪/month)
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
                  Number of Rooms
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
                  Minimum Size (m²)
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
                  Minimum Match %
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
                  Room Type
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
                      {opt === "any" ? "Any" : opt === "private" ? "Private" : "Shared OK"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Furnished */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Apartment Preferences
                </label>
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">Furnished</span>
                  <TriButton
                    options={[
                      { value: "any", label: "Any" },
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    value={local.furnished}
                    onChange={(v) => update("furnished", v as Filters["furnished"])}
                  />
                </div>
              </div>

              {/* Lifestyle */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Lifestyle Preferences
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">Smoking</span>
                    <TriButton
                      options={[
                        { value: "any", label: "Any" },
                        { value: "no", label: "No" },
                        { value: "yes", label: "Yes" },
                      ]}
                      value={local.smoking}
                      onChange={(v) => update("smoking", v as Filters["smoking"])}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">Pets</span>
                    <TriButton
                      options={[
                        { value: "any", label: "Any" },
                        { value: "no", label: "No" },
                        { value: "yes", label: "Yes" },
                      ]}
                      value={local.pets}
                      onChange={(v) => update("pets", v as Filters["pets"])}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">Work from Home</span>
                    <TriButton
                      options={[
                        { value: "any", label: "Any" },
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                      value={local.wfh}
                      onChange={(v) => update("wfh", v as Filters["wfh"])}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">Religious Level</span>
                    <TriButton
                      options={[
                        { value: "any", label: "Any" },
                        { value: "secular", label: "Secular" },
                        { value: "traditional", label: "Trad." },
                        { value: "religious", label: "Religious" },
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
                  Sleep Schedule
                </label>
                <div className="flex gap-2">
                  {([
                    { value: "any", label: "Any" },
                    { value: "early", label: "Early Bird" },
                    { value: "night", label: "Night Owl" },
                    { value: "flexible", label: "Flexible" },
                  ] as const).map((opt) => (
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
                  Min. Roommate Cleanliness
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
                  Amenities
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

            {/* Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border px-5 py-4 flex gap-3 z-20">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-secondary text-secondary-foreground active:scale-95 transition-transform"
              >
                Reset All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold gradient-primary text-primary-foreground shadow-elevated active:scale-95 transition-transform"
              >
                Show Results{activeCount > 0 ? ` (${activeCount})` : ""}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
