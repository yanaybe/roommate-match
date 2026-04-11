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
} from "lucide-react";
import { mockApartments, mockUsers, type UserProfile, getMatchColor, getMatchTextColor } from "@/data/mockData";
import MatchBadge from "@/components/MatchBadge";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isUUID, getMockSavedApartmentKey } from "@/lib/profileUtils";
import { useBlockReport } from "@/hooks/useBlockReport";
import ReportSheet from "@/components/ReportSheet";

function RoommateProfileModal({
  user,
  onClose,
}: {
  user: UserProfile;
  onClose: () => void;
}) {
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
              <p className="text-muted-foreground text-sm mt-1">{user.bio}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Living Habits</h3>
              <div className="grid grid-cols-2 gap-2">
                <InfoChip label="Sleep" value={user.sleepSchedule} />
                <InfoChip label="Cleanliness" value={`${user.cleanliness}/5`} />
                <InfoChip label="Budget" value={`₪${user.budget.toLocaleString()}`} />
                <InfoChip label="Room" value={user.roomType} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">Lifestyle</h3>
              <div className="flex flex-wrap gap-2">
                <Tag label={user.smoking ? "Smoker 🚬" : "Non-smoker"} />
                <Tag label={user.pets ? "Has pets 🐾" : "No pets"} />
                <Tag label={user.wfh ? "Works from home 💻" : "Works outside"} />
                <Tag label={`Social: ${user.social}/5`} />
                <Tag label={`Noise: ${user.noise}/5`} />
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
      <span className="text-muted-foreground text-[10px] block">{label}</span>
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
  const { canSave, savesLimit, recordSave, openPremiumSheet } = useDailyLimits();
  const { reportListing } = useBlockReport();
  const [imgIndex, setImgIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const apartmentIsUuid = id ? isUUID(id) : false;
  const [saved, setSaved] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState<UserProfile | null>(null);

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

  const apartment = mockApartments.find((a) => a.id === id);

  if (!apartment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground mb-2">Apartment not found</h2>
          <button
            onClick={() => navigate("/")}
            className="text-primary font-semibold text-sm"
          >
            Back to listings
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
    <div className="min-h-screen bg-background pb-24">
      {/* Image gallery */}
      <div className="relative max-w-2xl mx-auto overflow-hidden">
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
            <button className="bg-card/70 backdrop-blur-md p-2.5 rounded-full shadow-lg">
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
                <div className="absolute right-0 top-11 w-44 bg-card rounded-2xl shadow-elevated border border-border/50 overflow-hidden z-50">
                  <button
                    onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
                  >
                    <Flag size={15} className="text-destructive shrink-0" />
                    <span className="text-foreground">Report listing</span>
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
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Title & Price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-foreground">{apartment.title}</h1>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {apartment.location}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-extrabold text-primary">
                ₪{apartment.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs block">/month</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card rounded-xl p-3 text-center shadow-card">
            <Bed className="w-4 h-4 mx-auto text-primary mb-1" />
            <span className="text-foreground text-sm font-bold block">{apartment.rooms}</span>
            <span className="text-muted-foreground text-[10px]">Rooms</span>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-card">
            <Bath className="w-4 h-4 mx-auto text-primary mb-1" />
            <span className="text-foreground text-sm font-bold block">{apartment.bathrooms}</span>
            <span className="text-muted-foreground text-[10px]">Baths</span>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-card">
            <Maximize className="w-4 h-4 mx-auto text-primary mb-1" />
            <span className="text-foreground text-sm font-bold block">{apartment.size}</span>
            <span className="text-muted-foreground text-[10px]">m²</span>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-card">
            <Calendar className="w-4 h-4 mx-auto text-primary mb-1" />
            <span className="text-foreground text-xs font-bold block leading-tight">
              {apartment.available}
            </span>
            <span className="text-muted-foreground text-[10px]">Available</span>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-2">Amenities</h2>
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
            Current Roommates ({apartment.roommates.length})
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
                      <span className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-full">
                        {rm.sleepSchedule}
                      </span>
                      <span className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-full">
                        Clean: {rm.cleanliness}/5
                      </span>
                      {rm.pets && (
                        <span className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-full">
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
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          <button
            onClick={() => requireAuth(() => navigate("/chats"))}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Message Owner
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
    </div>
  );
}
