import { Bookmark, MapPin, Bed, Bath, Maximize } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import MatchBadge from "./MatchBadge";
import type { Apartment } from "@/data/mockData";
import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const getMockSavedApartmentKey = (userId: string, apartmentId: string) => `saved_apartment:${userId}:${apartmentId}`;

interface ApartmentCardProps {
  apartment: Apartment;
  index: number;
}

export default function ApartmentCard({ apartment, index }: ApartmentCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const { requireAuth } = useRequireAuth();
  const { user } = useAuth();
  const navigate = useNavigate();

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
    } else {
      await supabase.from("saved_apartments")
        .delete()
        .eq("user_id", user.id)
        .eq("apartment_id", apartment.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-card rounded-2xl shadow-card overflow-hidden cursor-pointer"
      onClick={() => navigate(`/apartment/${apartment.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={apartment.images[imgIndex]}
          alt={apartment.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {apartment.images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? "bg-primary-foreground w-4" : "bg-primary-foreground/50"}`}
            />
          ))}
        </div>
        <div className="absolute top-3 left-3">
          <MatchBadge percent={apartment.matchPercent} size="md" />
        </div>
        {apartment.isBoosted && (
          <div className="absolute top-3 right-14 gradient-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
            🔥 Hot
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); requireAuth(() => toggleSave()); }}
            className="bg-card/80 backdrop-blur-sm p-2 rounded-full"
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-primary text-primary" : "text-foreground"}`} />
          </button>
        </div>
        <div className="absolute bottom-3 right-3 flex -space-x-2">
          {apartment.roommates.map((rm) => (
            <img
              key={rm.id}
              src={rm.avatar}
              alt={rm.name}
              className="w-8 h-8 rounded-full border-2 border-card object-cover"
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-card-foreground">{apartment.title}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {apartment.location}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-extrabold text-primary">₪{apartment.price.toLocaleString()}</span>
            <span className="text-muted-foreground text-xs block">/month</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground text-xs pt-1">
          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {apartment.rooms} rooms</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {apartment.bathrooms} bath</span>
          <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {apartment.size}m²</span>
        </div>

        <div className="flex gap-2 flex-wrap pt-1">
          {apartment.amenities.slice(0, 4).map((a) => (
            <span key={a} className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/apartment/${apartment.id}`); }}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm gradient-primary text-primary-foreground transition-all"
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}
