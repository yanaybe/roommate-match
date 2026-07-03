import { ArrowLeft, Bookmark, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ApartmentCard from "@/components/ApartmentCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { dbRowToApartment } from "@/lib/apartments";
import { calculateRoomMatch } from "@/lib/matching";

export default function SavedListings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();

  const { data: saved, isPending } = useQuery({
    queryKey: ["saved-apartments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_apartments")
        .select("*, apartments(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? [])
        .map((row) => row.apartments)
        .filter(Boolean)
        .map(dbRowToApartment);
    },
  });

  const scored = useMemo(() => {
    if (!profile?.budget || !saved) return saved ?? [];
    return saved.map((apt) => ({
      ...apt,
      matchPercent: calculateRoomMatch(profile, apt.price, []),
    }));
  }, [saved, profile]);

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-8">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            aria-label={t("back")}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft size={18} className="text-foreground rtl:rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t("savedRooms")}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        {isPending ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : scored.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center py-16"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bookmark className="w-7 h-7 text-primary" />
            </div>
            <p className="text-foreground font-bold">{t("noSavedRooms")}</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">{t("tapBookmark")}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-5 gradient-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-xl shadow-md"
            >
              {t("browseListings")}
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scored.map((apt, i) => (
              <ApartmentCard key={apt.id} apartment={apt} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
