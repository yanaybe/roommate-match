import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
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
  listingType: "any" | "room" | "entire_place";
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

// TODO [SPRINT 2]: Add a "Save this search & get alerts" toggle at the bottom
// of the filter panel. Saved searches are the #1 missing retention mechanism —
// without them users have no reason to open the app daily. A notification like
// "2 new listings match your Tel Aviv ₪3,500 search" drives re-engagement.
//
// FULL IMPLEMENTATION:
//
// 1. SUPABASE MIGRATION — run this SQL in your Supabase SQL editor:
//    create table saved_searches (
//      id           uuid primary key default gen_random_uuid(),
//      user_id      uuid references auth.users not null,
//      label        text,                    -- e.g. "2BR in Tel Aviv under ₪3,500"
//      city         text,
//      max_price    int,
//      min_rooms    int,
//      amenities    jsonb default '[]',
//      notify_email boolean default true,
//      created_at   timestamptz default now()
//    );
//    alter table saved_searches enable row level security;
//    create policy "Users manage own searches"
//      on saved_searches for all using (auth.uid() = user_id);
//
// 2. FRONTEND — add at the very bottom of the filter panel, above the Apply button:
//    const [saveSearch, setSaveSearch] = useState(false);
//    {/* Save search toggle */}
//    <div className="flex items-center justify-between py-3 border-t border-border mt-4">
//      <div>
//        <p className="text-sm font-semibold text-foreground">Save this search</p>
//        <p className="text-xs text-muted-foreground">Get notified when new listings match</p>
//      </div>
//      <button
//        onClick={() => setSaveSearch(s => !s)}
//        className={`w-11 h-6 rounded-full transition-colors ${
//          saveSearch ? "bg-primary" : "bg-secondary"
//        }`}
//      >
//        <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${
//          saveSearch ? "translate-x-5" : "translate-x-0"
//        }`} />
//      </button>
//    </div>
//
// 3. When onApply() is called with saveSearch=true, upsert a row:
//    await supabase.from("saved_searches").insert({
//      user_id: currentUser.id,
//      city: filters.city ?? null,
//      max_price: filters.budgetMax,
//      min_rooms: filters.roomsMin,
//      amenities: filters.amenities,
//      label: `${filters.roomsMin}+ rooms · up to ₪${filters.budgetMax}`,
//    });
//    toast.success("Search saved! We'll notify you when new listings match.");
//
// 4. EDGE FUNCTION — create supabase/functions/listing-alerts/index.ts:
//    - Triggered by a pg_cron job (or Supabase scheduled function) once per day at 9am
//    - Queries apartments inserted in the last 24 hours
//    - For each apartment, checks against all saved_searches
//    - Sends email via Resend (https://resend.com) to matching users
//    - Resend free tier: 100 emails/day — enough for early stage

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

const TABS = ["Basics", "Vibe", "Amenities"] as const;
type Tab = typeof TABS[number];

export default function FilterModal({ open, onClose, filters, onApply }: FilterModalProps) {
  const [local, setLocal] = useState<Filters>(filters);
  const [activeTab, setActiveTab] = useState<Tab>("Basics");
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

  const handleApply = () => { onApply(local); onClose(); };
  const handleReset = () => setLocal(defaultFilters);

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

                {/* ── VIBE TAB ── */}
                {activeTab === "Vibe" && <>
                  {/* Lifestyle rows */}
                  <div>
                    <SectionLabel>🌿 {t("lifestylePreferences")}</SectionLabel>
                    <div className="bg-secondary/50 rounded-2xl px-3 py-2 space-y-2">
                      <FilterRow
                        emoji="🚬"
                        label={t("smokingLbl")}
                        options={[
                          { value: "any", label: t("optAny") },
                          { value: "no", label: t("optNo") },
                          { value: "yes", label: t("optYes") },
                        ]}
                        value={local.smoking}
                        onChange={(v) => update("smoking", v as Filters["smoking"])}
                      />
                      <div className="h-px bg-border/50" />
                      <FilterRow
                        emoji="🐾"
                        label={t("petsLbl")}
                        options={[
                          { value: "any", label: t("optAny") },
                          { value: "no", label: t("optNo") },
                          { value: "yes", label: t("optYes") },
                        ]}
                        value={local.pets}
                        onChange={(v) => update("pets", v as Filters["pets"])}
                      />
                      <div className="h-px bg-border/50" />
                      <FilterRow
                        emoji="🏠"
                        label={t("wfhFilter")}
                        options={[
                          { value: "any", label: t("optAny") },
                          { value: "yes", label: t("optYes") },
                          { value: "no", label: t("optNo") },
                        ]}
                        value={local.wfh}
                        onChange={(v) => update("wfh", v as Filters["wfh"])}
                      />
                    </div>
                  </div>

                  {/* Religious level */}
                  <div>
                    <SectionLabel>🕍 {t("religiousLevelFilter")}</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {(["any", "secular", "traditional", "religious"] as const).map((opt) => (
                        <Chip
                          key={opt}
                          label={
                            opt === "any" ? t("optAny") :
                            opt === "secular" ? t("optSecular") :
                            opt === "traditional" ? t("optTrad") :
                            t("optReligious")
                          }
                          selected={local.religiousLevel === opt}
                          onClick={() => update("religiousLevel", opt)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sleep schedule */}
                  <div>
                    <SectionLabel>🌙 {t("sleepScheduleFilter")}</SectionLabel>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { value: "any" as const, label: t("optAny") },
                        { value: "early" as const, label: `🌅 ${t("optEarlyBird")}` },
                        { value: "night" as const, label: `🦉 ${t("optNightOwl")}` },
                        { value: "flexible" as const, label: `〜 ${t("optFlexible")}` },
                      ]).map((opt) => (
                        <Chip
                          key={opt.value}
                          label={opt.label}
                          selected={local.sleepSchedule === opt.value}
                          onClick={() => update("sleepSchedule", opt.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Cleanliness slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <SectionLabel>✨ {t("minCleanliness")}</SectionLabel>
                      <span className="text-xs font-bold text-primary -mt-0.5">
                        {"⭐".repeat(local.cleanlinessMin)}
                        {"☆".repeat(5 - local.cleanlinessMin)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={local.cleanlinessMin}
                      onChange={(e) => update("cleanlinessMin", Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{t("sliderRelaxed")}</span>
                      <span className="text-xs text-muted-foreground">{t("spotless")}</span>
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
