import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Pencil, Eye, MapPin, Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  t: (key: string) => string;
  isPremium: boolean;
}

export default function MyListingsSheet({ open, onOpenChange, user, t, isPremium }: Props) {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const fetchListings = async () => {
      const { data: apts } = await supabase
        .from("apartments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setListings(apts ?? []);

      if (isPremium && apts && apts.length > 0) {
        try {
          const ids = apts.map((a: any) => a.id);
          const { data: views } = await (supabase as any)
            .from("apartment_views")
            .select("apartment_id")
            .in("apartment_id", ids);

          if (views) {
            const counts: Record<string, number> = {};
            for (const v of views) {
              counts[v.apartment_id] = (counts[v.apartment_id] ?? 0) + 1;
            }
            setViewCounts(counts);
          }
        } catch {
          // apartment_views table may not exist yet — graceful degradation
        }
      }

      setLoading(false);
    };

    fetchListings();
  }, [open, user, isPremium]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-extrabold text-foreground">My Listings</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-80px)] px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 bg-card rounded-2xl p-3">
                  <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-9 h-9 text-primary" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground mb-1">No listings yet</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                Post your first apartment and start finding roommates.
              </p>
              <button
                onClick={() => { onOpenChange(false); navigate("/post-apartment"); }}
                className="flex items-center gap-2 gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Post a listing
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((apt, i) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl shadow-card overflow-hidden"
                >
                  <div className="flex gap-3 p-3">
                    {apt.images?.[0] ? (
                      <img
                        src={apt.images[0]}
                        alt={apt.title}
                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200";
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <Building2 className="w-7 h-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-card-foreground text-sm truncate">{apt.title}</p>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{apt.neighborhood}, {apt.city}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{apt.available_date}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-sm font-extrabold text-primary">
                          ₪{apt.price?.toLocaleString()}
                          <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                        </span>
                        {isPremium && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            {viewCounts[apt.id] ?? 0} views
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/40 px-3 py-2.5 flex gap-2">
                    <button
                      onClick={() => { onOpenChange(false); navigate(`/apartment/${apt.id}`); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 active:scale-[0.98] transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => { onOpenChange(false); navigate(`/post-apartment?id=${apt.id}`); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold gradient-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      <Pencil className="w-3 h-3" /> Edit Listing
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
