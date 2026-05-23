import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDailyLimits } from "@/hooks/useDailyLimits";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MoreVertical,
  Flag,
  Loader2,
} from "lucide-react";
import { type UserProfile, type Apartment } from "@/data/mockData";
import MatchBadge from "@/components/MatchBadge";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isUUID, getMockSavedApartmentKey } from "@/lib/profileUtils";
import { useBlockReport } from "@/hooks/useBlockReport";
import ReportSheet from "@/components/ReportSheet";
import { useLanguage } from "@/hooks/useLanguage";
import BoostListingSheet from "@/components/BoostListingSheet";
import { Zap } from "lucide-react";

const CITY_COORDS: Record<string, [number, number]> = {
  "Tel Aviv": [32.0853, 34.7818], "Jerusalem": [31.7683, 35.2137],
  "Haifa": [32.7940, 34.9896], "Beer Sheva": [31.2520, 34.7915],
  "Netanya": [32.3226, 34.8533], "Herzliya": [32.1663, 34.8434],
  "Ramat Gan": [32.0826, 34.8127], "Rishon LeZion": [31.9730, 34.7925],
  "Petah Tikva": [32.0842, 34.8841], "Ashdod": [31.8010, 34.6550],
};

function dbRowToApartment(row: any): Apartment & { ownerId: string } {
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
    id: row.id, title: row.title, price: row.price,
    location: `${row.neighborhood}, ${row.city}`,
    coordinates: coords,
    images: row.images?.length ? row.images : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
    rooms: row.rooms, bathrooms: row.bathrooms, size: row.size,
    roommates: [], matchPercent: 0, amenities,
    available: row.available_date,
    isBoosted: row.is_featured && (!row.featured_until || new Date(row.featured_until) > new Date()),
    ownerId: row.user_id,
    listingType: (row.listing_type ?? "room") as "room" | "entire_place",
  };
}

function RoommateProfileModal({
  user,
  onClose,
}: {
  user: UserProfile;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 22 }}
          className="bg-card rounded-3xl w-full max-w-sm max-h-[80vh] overflow-y-auto shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-56 object-cover rounded-t-3xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=400`;
              }}
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm p-2 rounded-full"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">
                {user.name}, {user.age}
              </h2>
              <p className="text-muted-foreground text-sm">
                {user.occupation} · {user.city}
              </p>
              <p className="text-muted-foreground text-sm mt-1 line-clamp-3">{user.bio}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">{t("livingHabitsSection")}</h3>
              <div className="grid grid-cols-2 gap-2">
                <InfoChip label={t("sleepScheduleLabel")} value={user.sleepSchedule} />
                <InfoChip label={t("cleanlinessLabel")} value={`${user.cleanliness}/5`} />
                <InfoChip label={t("budgetLabel")} value={`₪${user.budget.toLocaleString()}`} />
                <InfoChip label={t("roomTypeLabel")} value={user.roomType} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">{t("lifestyleSection")}</h3>
              <div className="flex flex-wrap gap-2">
                <Tag label={user.smoking ? t("smokerLabel") : t("nonSmokerLabel")} />
                <Tag label={user.pets ? t("hasPetsLabel") : t("noPetsLabel")} />
                <Tag label={user.wfh ? t("worksFromHomeLabel") : t("worksOutsideLabel")} />
                <Tag label={`${t("socialLevelLabel")}: ${user.social}/5`} />
                <Tag label={`${t("noiseLevelLabel")}: ${user.noise}/5`} />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded-xl px-3 py-2">
      <span className="text-muted-foreground text-xs block">{label}</span>
      <span className="text-foreground text-sm font-semibold">{value}</span>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
    </span>
  );
}

export default function ApartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { canSave, savesLimit, recordSave, openPremiumSheet } = useDailyLimits();
  const { reportListing } = useBlockReport();
  const [imgIndex, setImgIndex] = useState(0);
  const [messaging, setMessaging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const apartmentIsUuid = id ? isUUID(id) : false;
  const [saved, setSaved] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState<UserProfile | null>(null);
  const [dbApartment, setDbApartment] = useState<(Apartment & { ownerId: string }) | null>(null);

  useEffect(() => {
    if (!apartmentIsUuid || !id) return;
    supabase.from("apartments").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) {
        setDbApartment(dbRowToApartment(data));
        if (!user || user.id !== data.user_id) {
          supabase.from("apartment_views").insert({
            apartment_id: data.id,
            viewer_id: user?.id ?? null,
          }).then(() => {});
        }
      }
    });
  }, [id, apartmentIsUuid, user]);

  useEffect(() => {
    if (!user || !id) { setSaved(false); return; }
    if (!apartmentIsUuid) {
      try { setSaved(localStorage.getItem(getMockSavedApartmentKey(user.id, id)) === "true"); } catch { setSaved(false); }
      return;
    }
    supabase.from("saved_apartments").select("id").eq("user_id", user.id).eq("apartment_id", id).maybeSingle().then(({ data }) => setSaved(Boolean(data)));
  }, [user, id, apartmentIsUuid]);

  const toggleSave = async () => {
    if (!user || !id) return;
    const newSaved = !saved;

    if (newSaved && !canSave) {
      toast.error(`You've reached your ${savesLimit} daily saves. Upgrade to save more.`);
      openPremiumSheet();
      return;
    }

    setSaved(newSaved);
    if (!apartmentIsUuid) {
      localStorage.setItem(getMockSavedApartmentKey(user.id, id), String(newSaved));
      return;
    }
    if (newSaved) {
      await supabase.from("saved_apartments").upsert({ user_id: user.id, apartment_id: id }, { onConflict: "user_id,apartment_id" });
      recordSave();
    } else {
      await supabase.from("saved_apartments").delete().eq("user_id", user.id).eq("apartment_id", id);
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const apartment: (Apartment & { ownerId?: string }) | undefined = dbApartment ?? undefined;
  const isOwner = user && apartment?.ownerId === user.id;

  if (!apartment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-5 mx-auto">
            <MapPin className="w-9 h-9 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground mb-2">{t("apartmentNotFound")}</h2>
          <p className="text-muted-foreground text-sm mb-6">This listing may have been removed or is no longer available.</p>
          <button
            onClick={() => navigate("/")}
            className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {t("backToListings")}
          </button>
        </div>
      </div>
    );
  }

  const nextImg = () =>
    setImgIndex((i) => (i + 1) % apartment.images.length);
  const prevImg = () =>
    setImgIndex((i) => (i - 1 + apartment.images.length) % apartment.images.length);

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      {/* Image gallery */}
      <div className="relative max-w-3xl mx-auto overflow-hidden">
        <div className="relative aspect-[16/10] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={imgIndex}
              src={apartment.images[imgIndex]}
              alt={apartment.title}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800";
              }}
            />
          </AnimatePresence>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

          {/* Nav buttons */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-card/70 backdrop-blur-md p-2.5 rounded-full shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: apartment?.title, url }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(url).then(() => toast.success("Link copied!")).catch(() => toast.info(`Copy: ${url}`));
                }
              }}
              className="bg-card/70 backdrop-blur-md p-2.5 rounded-full shadow-lg"
            >
              <Share2 className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={() => requireAuth(() => toggleSave())}
              className="bg-card/70 backdrop-blur-md p-2.5 rounded-full shadow-lg"
            >
              <Bookmark
                className={`w-4 h-4 ${saved ? "fill-primary text-primary" : "text-foreground"}`}
              />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="bg-card/70 backdrop-blur-md p-2.5 rounded-full shadow-lg"
              >
                <MoreVertical className="w-4 h-4 text-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-11 w-48 bg-card rounded-2xl shadow-elevated border border-border/50 overflow-hidden z-50">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); setBoostOpen(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
                      >
                        <Zap size={15} className="text-primary shrink-0" />
                        <span className="text-foreground font-medium">{t("boostListing")}</span>
                      </button>
                      <div className="border-t border-border/40" />
                    </>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
                  >
                    <Flag size={15} className="text-destructive shrink-0" />
                    <span className="text-foreground">{t("reportListing")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image arrows */}
          {apartment.images.length > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/70 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-card/90 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/70 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-card/90 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            {imgIndex + 1} / {apartment.images.length}
          </div>

          {/* Match badge */}
          <div className="absolute bottom-4 right-4">
            <MatchBadge percent={apartment.matchPercent} size="lg" />
          </div>

          {/* Hot listing badge */}
          {apartment.isBoosted && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              🔥 Hot Listing
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {apartment.images.length > 1 && (
          <div className="flex gap-2 p-3 bg-card">
            {apartment.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={`relative flex-1 aspect-[4/3] rounded-lg overflow-hidden transition-all ${
                  i === imgIndex ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "opacity-60 hover:opacity-90"
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800";
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
        {/* Title */}
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{apartment.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {apartment.location}
            </div>
            {apartment.listingType === "entire_place" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                🏠 Entire Apartment
              </span>
            )}
          </div>
        </div>

        {/* Room details */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{apartment.listingType === "entire_place" ? "This Listing" : t("yourRoom")}</span>
              <div className="flex-1 h-px bg-primary/20" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                <span className="text-primary text-xs font-semibold uppercase tracking-wide block mb-0.5">{t("monthlyRent")}</span>
                <span className="text-foreground text-lg font-extrabold">₪{apartment.price.toLocaleString()}</span>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                <Calendar className="w-4 h-4 mx-auto text-primary mb-1" />
                <span className="text-foreground text-xs font-bold block leading-tight">{apartment.available}</span>
                <span className="text-muted-foreground text-xs">{t("available")}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("theApartment")}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="bg-card rounded-xl p-3 text-center shadow-card">
                <Bed className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <span className="text-foreground text-sm font-bold block">{apartment.rooms}</span>
                <span className="text-muted-foreground text-xs">{t("bedroomsLabel")}</span>
              </div>
              <div className="bg-card rounded-xl p-3 text-center shadow-card">
                <Bath className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <span className="text-foreground text-sm font-bold block">{apartment.bathrooms}</span>
                <span className="text-muted-foreground text-xs">{t("bathroomsLabel")}</span>
              </div>
              <div className="bg-card rounded-xl p-3 text-center shadow-card">
                <Maximize className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <span className="text-foreground text-sm font-bold block">{apartment.size}</span>
                <span className="text-muted-foreground text-xs">{t("mSquaredTotal")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-2">{t("amenitiesLabel")}</h2>
          <div className="flex flex-wrap gap-2">
            {apartment.amenities.map((a) => (
              <span
                key={a}
                className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Roommates */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">
            {t("currentRoommates")} ({apartment.roommates.length})
          </h2>
          <div className="space-y-2">
            {apartment.roommates.map((rm) => {
              // Calculate a simple mock match percent based on roommate traits
              const matchPercent = Math.round(60 + Math.random() * 35);
              return (
                <motion.button
                  key={rm.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRoommate(rm)}
                  className="w-full bg-card rounded-2xl p-3 shadow-card flex items-center gap-3 text-left"
                >
                  <div className="relative">
                    <img
                      src={rm.avatar}
                      alt={rm.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(rm.name)}&background=random&size=112`;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">
                        {rm.name}, {rm.age}
                      </span>
                      <MatchBadge percent={matchPercent} size="sm" />
                    </div>
                    <p className="text-muted-foreground text-xs">{rm.occupation}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                        {rm.sleepSchedule}
                      </span>
                      <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                        Clean: {rm.cleanliness}/5
                      </span>
                      {rm.pets && (
                        <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                          🐾 Pets
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 ltr:left-0 ltr:md:left-64 rtl:right-0 rtl:md:right-64 ltr:right-0 rtl:left-0 bg-card/95 backdrop-blur-xl border-t border-border z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-3">
          <button
            onClick={() => requireAuth(async () => {
              if (!user || !apartment) return;
              const ownerId = apartment.ownerId;
              if (!ownerId || ownerId === user.id) { navigate("/chats"); return; }
              setMessaging(true);
              try {
                const { data: existing } = await supabase
                  .from("conversation_participants")
                  .select("conversation_id")
                  .eq("user_id", user.id);
                let existingConvId: string | null = null;
                if (existing) {
                  for (const p of existing) {
                    const { data: other } = await supabase
                      .from("conversation_participants")
                      .select("user_id")
                      .eq("conversation_id", p.conversation_id)
                      .eq("user_id", ownerId)
                      .maybeSingle();
                    if (other) { existingConvId = p.conversation_id; break; }
                  }
                }
                if (!existingConvId) {
                  await supabase.rpc("find_or_create_conversation", { other_user_id: ownerId });
                }
                navigate("/chats");
              } catch {
                toast.error("Could not start conversation");
              } finally {
                setMessaging(false);
              }
            })}
            disabled={messaging}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {messaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {messaging ? "Opening…" : t("messageOwner")}
          </button>
        </div>
      </div>

      {/* Roommate profile modal */}
      {selectedRoommate && (
        <RoommateProfileModal
          user={selectedRoommate}
          onClose={() => setSelectedRoommate(null)}
        />
      )}

      <ReportSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetName="this listing"
        onSubmit={(reason, details) => reportListing(id!, reason, details)}
      />

      {isOwner && apartment && (
        <BoostListingSheet
          open={boostOpen}
          onOpenChange={setBoostOpen}
          apartmentId={apartment.id}
          apartmentTitle={apartment.title}
        />
      )}
    </div>
  );
}
