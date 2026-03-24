import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";

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
};

const allAmenities = ["Balcony", "AC", "Laundry", "WiFi", "Rooftop", "Parking", "Gym", "Elevator", "Security", "Garden"];

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (f: Filters) => void;
}

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
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[85vh] overflow-y-auto pb-24"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card z-10 px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-foreground">Filters</h2>
              <button onClick={onClose} className="p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

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

              {/* Lifestyle */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">
                  Lifestyle Preferences
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">Smoking</span>
                    <div className="flex gap-1">
                      {(["any", "no", "yes"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => update("smoking", opt)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            local.smoking === opt
                              ? "gradient-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {opt === "any" ? "Any" : opt === "no" ? "No" : "Yes"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground mb-1 block">Pets</span>
                    <div className="flex gap-1">
                      {(["any", "no", "yes"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => update("pets", opt)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            local.pets === opt
                              ? "gradient-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {opt === "any" ? "Any" : opt === "no" ? "No" : "Yes"}
                        </button>
                      ))}
                    </div>
                  </div>
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
