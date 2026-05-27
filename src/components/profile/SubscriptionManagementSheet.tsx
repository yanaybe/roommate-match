import { useState, useEffect } from "react";
import { Crown, CreditCard, Calendar, AlertTriangle, Check, ChevronRight, X, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionTier: string;
}

const TIER_DETAILS: Record<string, { label: string; price: string; color: string; features: string[] }> = {
  gold: {
    label: "Gold",
    price: "₪29/mo",
    color: "text-amber-500",
    features: [
      "Unlimited profile likes",
      "See who liked you",
      "1 weekly profile boost",
      "Advanced lifestyle filters",
      "Priority in search results",
      "Save & get alerts for searches",
    ],
  },
  platinum: {
    label: "Platinum",
    price: "₪39/mo",
    color: "text-violet-500",
    features: [
      "Everything in Gold",
      "Message before matching",
      "3 monthly profile boosts",
      "Top placement in city search",
      "Squad creation & management",
      "Priority support",
    ],
  },
};

export default function SubscriptionManagementSheet({ open, onOpenChange, subscriptionTier }: Props) {
  const { user } = useAuth();
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);

  // Load real subscription expiry from DB when sheet opens
  useEffect(() => {
    if (!open || !user) return;
    setLoadingDates(true);
    supabase
      .from("profiles")
      .select("subscription_expires_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubscriptionExpiresAt(data?.subscription_expires_at ?? null);
        setLoadingDates(false);
      });
  }, [open, user]);

  const tier = TIER_DETAILS[subscriptionTier];

  // Format renewal date — use DB value if available, fall back to "N/A"
  const renewalLabel = (() => {
    if (loadingDates) return "Loading…";
    if (!subscriptionExpiresAt) return "—";
    return new Date(subscriptionExpiresAt).toLocaleDateString("en-IL", {
      day: "numeric", month: "long", year: "numeric",
    });
  })();

  const handleCancel = async () => {
    if (!user) return;
    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { user_id: user.id },
      });
      if (error) throw error;
      toast.success("Subscription cancelled. Your benefits remain active until the end of the billing period.");
      setCancelConfirm(false);
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error("Cancel subscription error:", err);
      // Graceful fallback: let user know to contact support
      toast.error("Could not cancel automatically. Please contact support@roomatch.app");
    } finally {
      setCancelling(false);
    }
  };

  if (!tier) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto pb-10">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Crown className={`w-5 h-5 ${tier.color}`} />
            {tier.label} Plan
          </SheetTitle>
        </SheetHeader>

        {/* Plan card */}
        <div className="bg-secondary rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`text-lg font-extrabold ${tier.color}`}>{tier.label}</p>
              <p className="text-2xl font-extrabold text-foreground">{tier.price}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <p className="text-xs font-bold text-green-600">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>
              {subscriptionExpiresAt ? "Renews" : "Next billing"}:{" "}
              <span className="font-semibold text-foreground">{renewalLabel}</span>
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-foreground mb-3">What's included</p>
          <div className="space-y-2">
            {tier.features.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing history link */}
        <button
          onClick={() => { onOpenChange(false); window.location.href = "/billing-history"; }}
          className="w-full flex items-center justify-between p-4 bg-secondary rounded-2xl mb-3 hover:bg-secondary/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Billing history</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Cancel */}
        {!cancelConfirm ? (
          <button
            onClick={() => setCancelConfirm(true)}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors"
          >
            Cancel subscription
          </button>
        ) : (
          <div className="border border-destructive/30 rounded-2xl p-4 bg-destructive/5">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">Cancel {tier.label}?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {subscriptionExpiresAt
                    ? `You'll keep your benefits until ${renewalLabel}, then revert to the free plan.`
                    : "You'll keep your benefits until the end of your billing period, then revert to the free plan."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground"
              >
                <X className="w-4 h-4 inline mr-1" />Keep plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {cancelling ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling…</>
                ) : (
                  "Yes, cancel"
                )}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
