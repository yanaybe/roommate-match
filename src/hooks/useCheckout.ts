import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";

// Maps tier name → Stripe price ID env vars (set in .env.local)
const TIER_PRICE_IDS: Record<string, string> = {
  gold: import.meta.env.VITE_STRIPE_GOLD_PRICE_ID ?? "",
  platinum: import.meta.env.VITE_STRIPE_PLATINUM_PRICE_ID ?? "",
};

export function useCheckout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkout = async (tier: "gold" | "platinum") => {
    if (!user) { toast.error("Please sign in first"); return; }

    const priceId = TIER_PRICE_IDS[tier];
    if (!priceId) {
      // Stripe not yet configured — show a friendly message instead of crashing
      toast.info("Payment coming soon! We're finalising the billing setup.");
      return;
    }

    setLoading(true);
    try {
      analytics.upgradeClick("pricing_page", tier);
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { priceId, userId: user.id, tier },
      });
      if (error || !data?.url) throw new Error(error?.message ?? "No checkout URL returned");
      window.location.href = data.url;
    } catch (err) {
      toast.error("Couldn't start checkout. Please try again.");
      console.error("Checkout error:", err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return { checkout, loading };
}
