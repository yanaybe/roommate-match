// BoostListingSheet — lets a listing owner pay to feature their apartment.
// Paddle one-time purchase: pass apartment_id + boost_days in customData.
// The paddle-webhook handles transaction.completed and sets is_featured = true.

import { useState, useEffect, useCallback } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Loader2, Gift } from "lucide-react";

const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string;
const PADDLE_ENV = (import.meta.env.VITE_PADDLE_ENV ?? "sandbox") as "sandbox" | "production";

const BOOST_TIERS = [
  {
    key: "day",
    label: "1-Day Boost",
    days: 1,
    price: "₪39",
    priceId: import.meta.env.VITE_PADDLE_PRICE_BOOST_DAY as string,
    desc: "Top placement for 24 hours",
    emoji: "⚡",
  },
  {
    key: "week",
    label: "1-Week Boost",
    days: 7,
    price: "₪149",
    priceId: import.meta.env.VITE_PADDLE_PRICE_BOOST_WEEK as string,
    desc: "Stay at the top for 7 days",
    emoji: "🔥",
    popular: true,
  },
  {
    key: "month",
    label: "1-Month Boost",
    days: 30,
    price: "₪399",
    priceId: import.meta.env.VITE_PADDLE_PRICE_BOOST_MONTH as string,
    desc: "Maximum visibility for 30 days",
    emoji: "👑",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  apartmentId: string;
  apartmentTitle: string;
}

function isWithinLastWeek(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(dateStr).getTime() > oneWeekAgo;
}

export default function BoostListingSheet({ open, onOpenChange, apartmentId, apartmentTitle }: Props) {
  const { user } = useAuth();
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("week");
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [boostDates, setBoostDates] = useState<{
    gold_boost_used_at: string | null;
    platinum_boost_used_at_1: string | null;
    platinum_boost_used_at_2: string | null;
    platinum_boost_used_at_3: string | null;
  }>({
    gold_boost_used_at: null,
    platinum_boost_used_at_1: null,
    platinum_boost_used_at_2: null,
    platinum_boost_used_at_3: null,
  });

  useEffect(() => {
    if (!PADDLE_CLIENT_TOKEN) return;
    initializePaddle({ environment: PADDLE_ENV, token: PADDLE_CLIENT_TOKEN })
      .then((p) => { if (p) setPaddle(p); });
  }, []);

  useEffect(() => {
    if (!user || !open) return;
    supabase
      .from("profiles")
      .select("subscription_tier, gold_boost_used_at, platinum_boost_used_at_1, platinum_boost_used_at_2, platinum_boost_used_at_3")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSubscriptionTier((data as any).subscription_tier ?? "free");
          setBoostDates({
            gold_boost_used_at: (data as any).gold_boost_used_at ?? null,
            platinum_boost_used_at_1: (data as any).platinum_boost_used_at_1 ?? null,
            platinum_boost_used_at_2: (data as any).platinum_boost_used_at_2 ?? null,
            platinum_boost_used_at_3: (data as any).platinum_boost_used_at_3 ?? null,
          });
        }
      });
  }, [user, open]);

  // Calculate free boosts available
  const freeBoostsInfo = (() => {
    if (subscriptionTier === "gold") {
      const used = isWithinLastWeek(boostDates.gold_boost_used_at);
      return { available: used ? 0 : 1, total: 1, tier: "gold" };
    }
    if (subscriptionTier === "platinum") {
      const slots = [
        boostDates.platinum_boost_used_at_1,
        boostDates.platinum_boost_used_at_2,
        boostDates.platinum_boost_used_at_3,
      ];
      const usedCount = slots.filter((d) => isWithinLastWeek(d)).length;
      return { available: 3 - usedCount, total: 3, tier: "platinum" };
    }
    return { available: 0, total: 0, tier: "free" };
  })();

  const handleFreeBoost = useCallback(async () => {
    if (!user || freeBoostsInfo.available === 0) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase.rpc("use_free_boost", {
        p_apartment_id: apartmentId,
      });
      if (error) throw error;
      const res = result as { ok?: boolean; error?: string } | null;
      if (res?.error === "no_boosts_available") {
        toast.error("No free boost slots available this week.");
        return;
      }
      if (res?.error === "not_owner") {
        toast.error("You can only boost your own listings.");
        return;
      }
      if (res?.error) {
        toast.error("Could not apply boost. Please try again.");
        return;
      }
      toast.success("Free boost applied! Your listing is now featured for 7 days.");
      onOpenChange(false);
    } catch {
      toast.error("Could not apply boost. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, freeBoostsInfo.available, apartmentId, onOpenChange]);

  const handleBoost = useCallback(async () => {
    const tier = BOOST_TIERS.find((t) => t.key === selected);
    if (!tier || !user) return;
    if (!tier.priceId) {
      toast.error("This boost tier is not set up yet — add VITE_PADDLE_PRICE_BOOST_* to your env.");
      return;
    }
    if (!paddle) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }
    setLoading(true);
    try {
      paddle.Checkout.open({
        items: [{ priceId: tier.priceId, quantity: 1 }],
        customer: { email: user.email! },
        customData: {
          user_id: user.id,
          apartment_id: apartmentId,
          boost_days: tier.days,
        },
        settings: { displayMode: "overlay", theme: "dark", locale: "en" },
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Paddle checkout error:", err);
      toast.error("Could not open checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [paddle, selected, user, apartmentId, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-extrabold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Boost Your Listing
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{apartmentTitle}</p>
        </SheetHeader>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Featured listings appear at the top of search results with a <strong>🔥 Hot</strong> badge — get up to 5× more views.
          </p>

          {/* Free boost banner for Gold/Platinum */}
          {freeBoostsInfo.available > 0 && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-violet-500/30 bg-violet-500/10">
              <Gift className="w-5 h-5 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
                  {freeBoostsInfo.available === 1
                    ? "1 Free Boost Available"
                    : `${freeBoostsInfo.available} Free Boosts Available`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscriptionTier === "gold" ? "Gold benefit — resets weekly" : "Platinum benefit — up to 3/week"}
                </p>
              </div>
              <button
                onClick={handleFreeBoost}
                disabled={loading}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Use Free"}
              </button>
            </div>
          )}

          {freeBoostsInfo.total > 0 && freeBoostsInfo.available === 0 && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-secondary/50">
              <Gift className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Free boost{freeBoostsInfo.total > 1 ? "s" : ""} used this week — resets in 7 days
              </p>
            </div>
          )}

          <div className="space-y-2.5 mt-2">
            {BOOST_TIERS.map((tier) => (
              <button
                key={tier.key}
                onClick={() => setSelected(tier.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  selected === tier.key
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-2xl">{tier.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${selected === tier.key ? "text-primary" : "text-foreground"}`}>
                      {tier.label}
                    </span>
                    {tier.popular && (
                      <span className="text-xs font-bold px-1.5 py-0.5 gradient-primary text-primary-foreground rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{tier.desc}</p>
                </div>
                <span className={`text-base font-extrabold ${selected === tier.key ? "text-primary" : "text-foreground"}`}>
                  {tier.price}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleBoost}
            disabled={loading}
            className="w-full py-3.5 gradient-primary text-primary-foreground rounded-2xl font-bold text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…</>
            ) : (
              <><Zap className="w-4 h-4" /> Boost Now</>
            )}
          </button>

          <p className="text-[11px] text-center text-muted-foreground pb-2">
            One-time payment · Boost activates immediately after payment
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
