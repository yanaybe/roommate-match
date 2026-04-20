// BoostListingSheet — lets a listing owner pay to feature their apartment.
// Paddle one-time purchase: pass apartment_id + boost_days in customData.
// The paddle-webhook handles transaction.completed and sets is_featured = true.

import { useState, useEffect, useCallback } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";

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

export default function BoostListingSheet({ open, onOpenChange, apartmentId, apartmentTitle }: Props) {
  const { user } = useAuth();
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("week");

  useEffect(() => {
    if (!PADDLE_CLIENT_TOKEN) return;
    initializePaddle({ environment: PADDLE_ENV, token: PADDLE_CLIENT_TOKEN })
      .then((p) => { if (p) setPaddle(p); });
  }, []);

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
