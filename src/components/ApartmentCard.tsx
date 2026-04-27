import { MessageCircle, Bookmark, MapPin, Bed, Bath, Maximize, Calendar, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import MatchBadge from "./MatchBadge";
import type { Apartment } from "@/data/mockData";
import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useDailyLimits } from "@/hooks/useDailyLimits";

const FALLBACK_APARTMENT = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800";
const avatarFallback = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=80`;

const getMockSavedApartmentKey = (userId: string, apartmentId: string) => `saved_apartment:${userId}:${apartmentId}`;

interface ApartmentCardProps {
  apartment: Apartment;
  index: number;
}

export default function ApartmentCard({ apartment, index }: ApartmentCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [messaging, setMessaging] = useState(false);
  const { requireAuth } = useRequireAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canSave, savesLimit, recordSave, openPremiumSheet } = useDailyLimits();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apartment.id);

  const [saved, setSaved] = useState(() => {
    if (!user || !isUuid) {
      try {
        const stored = user ? localStorage.getItem(getMockSavedApartmentKey(user.id, apartment.id)) : null;
        return stored === "true";
      } catch { return false; }
    }
    return false;
  });

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }

    if (!isUuid) {
      try {
        setSaved(localStorage.getItem(getMockSavedApartmentKey(user.id, apartment.id)) === "true");
      } catch {
        setSaved(false);
      }
      return;
    }

    supabase
      .from("saved_apartments")
      .select("id")
      .eq("user_id", user.id)
      .eq("apartment_id", apartment.id)
      .maybeSingle()
      .then(({ data }) => {
        setSaved(Boolean(data));
      });
  }, [user, apartment.id, isUuid]);

  const toggleSave = async () => {
    if (!user) return;
    const newSaved = !saved;

    if (newSaved && !canSave) {
      toast.error(`You've reached your ${savesLimit} daily saves. Upgrade to save more.`);
      openPremiumSheet();
      return;
    }

    setSaved(newSaved);
    if (!isUuid) {
      localStorage.setItem(getMockSavedApartmentKey(user.id, apartment.id), String(newSaved));
      return;
    }
    if (newSaved) {
      await supabase.from("saved_apartments").upsert({
        user_id: user.id,
        apartment_id: apartment.id,
      }, { onConflict: "user_id,apartment_id" });
      recordSave();
    } else {
      await supabase.from("saved_apartments")
        .delete()
        .eq("user_id", user.id)
        .eq("apartment_id", apartment.id);
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    if (isUuid && (apartment as any).user_id && (apartment as any).user_id !== user.id) {
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
              .eq("user_id", (apartment as any).user_id)
              .maybeSingle();
            if (other) {
              existingConvId = p.conversation_id;
              break;
            }
          }
        }

        if (!existingConvId) {
          await supabase.rpc("create_conversation_with_participant", {
            other_user_id: (apartment as any).user_id,
          });
        }
        navigate("/chats");
      } catch {
        toast.error("Could not start conversation");
      } finally {
        setMessaging(false);
      }
    } else {
      navigate("/chats");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.3 }}
      className="bg-card rounded-2xl shadow-card overflow-hidden cursor-pointer group hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => navigate(`/apartment/${apartment.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={apartment.images[imgIndex]}
          alt={apartment.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_APARTMENT; }}
        />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {apartment.images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
              className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "bg-primary-foreground w-4" : "bg-primary-foreground/50 w-1.5"}`}
            />
          ))}
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <MatchBadge percent={apartment.matchPercent} size="md" />
          {apartment.listingType === "entire_place" && (
            <span className="bg-background/90 backdrop-blur text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              🏠 Entire Apt
            </span>
          )}
        </div>
        {apartment.isBoosted && (
          <div className="absolute top-3 right-14 gradient-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
            🔥 Hot
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); requireAuth(() => toggleSave()); }}
            className="bg-card/80 backdrop-blur-sm p-2 rounded-full hover:scale-105 active:scale-95 transition-transform"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={saved ? "saved" : "unsaved"}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Bookmark className={`w-4 h-4 transition-colors ${saved ? "fill-primary text-primary" : "text-foreground"}`} />
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
        <div className="absolute bottom-3 right-3 flex -space-x-2">
          {apartment.roommates.map((rm) => (
            <button
              key={rm.id}
              onClick={(e) => { e.stopPropagation(); navigate(`/roommate/${rm.id}`); }}
              title={rm.name}
              className="focus:outline-none"
            >
              <img
                src={rm.avatar}
                alt={rm.name}
                className="w-8 h-8 rounded-full border-2 border-card object-cover hover:scale-110 transition-transform"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = avatarFallback(rm.name); }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-card-foreground truncate">{apartment.title}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{apartment.location}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{apartment.listingType === "entire_place" ? "Apt" : "Room"} / month</div>
            <span className="text-lg font-extrabold text-primary">₪{apartment.price.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Calendar className="w-3 h-3" />
          <span>Available {apartment.available}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-muted-foreground text-xs border-t border-border/40 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Apt:</span>
          <span className="flex items-center gap-1 shrink-0"><Bed className="w-3.5 h-3.5" /> {apartment.rooms} bed</span>
          <span className="flex items-center gap-1 shrink-0"><Bath className="w-3.5 h-3.5" /> {apartment.bathrooms} bath</span>
          <span className="flex items-center gap-1 shrink-0"><Maximize className="w-3.5 h-3.5" /> {apartment.size}m²</span>
        </div>

        <div className="flex gap-2 flex-wrap pt-1">
          {apartment.amenities.slice(0, 4).map((a) => (
            <span key={a} className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); requireAuth(() => handleMessage()); }}
            disabled={messaging}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm gradient-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {messaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {messaging ? "Opening…" : "Message"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/apartment/${apartment.id}`); }}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] transition-all"
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}
