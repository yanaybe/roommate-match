import { useState, useEffect } from "react";
import { Crown, CreditCard, Calendar, AlertTriangle, Check, ChevronRight, X, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionTier: string;
}

const TIER_COLORS: Record<string, string> = {
  gold: "text-amber-500",
  platinum: "text-violet-500",
};

const TIER_PRICES: Record<string, string> = {
  gold: "₪29/mo",
  platinum: "₪39/mo",
};

export default function SubscriptionManagementSheet({ open, onOpenChange, subscriptionTier }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
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

  const tierLabel = subscriptionTier === "gold" ? "Gold" : "Platinum";
  const tierColor = TIER_COLORS[subscriptionTier] ?? "text-primary";
  const tierPrice = TIER_PRICES[subscriptionTier] ?? "";

  // Build features list from translation keys
  const features = subscriptionTier === "gold"
    ? [t("subFeatGold1"), t("subFeatGold2"), t("subFeatGold3"), t("subFeatGold4"), t("subFeatGold5"), t("subFeatGold6")]
    : [t("subFeatPlatinum1"), t("subFeatPlatinum2"), t("subFeatPlatinum3"), t("subFeatPlatinum4"), t("subFeatPlatinum5"), t("subFeatPlatinum6")];

  // Format renewal date — use DB value if available, fall back to dash
  const renewalLabel = (() => {
    if (loadingDates) return t("loading");
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
      toast.error("Could not cancel automatically. Please contact support@roomatch.app");
    } finally {
      setCancelling(false);
    }
  };

  if (!TIER_COLORS[subscriptionTier]) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto pb-10">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Crown className={`w-5 h-5 ${tierColor}`} />
            {tierLabel} Plan
          </SheetTitle>
        </SheetHeader>

        {/* Plan card */}
        <div className="bg-secondary rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`text-lg font-extrabold ${tierColor}`}>{tierLabel}</p>
              <p className="text-2xl font-extrabold text-foreground">{tierPrice}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <p className="text-xs font-bold text-green-600">{t("subActive")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>
              {subscriptionExpiresAt ? t("subRenews") : t("subNextBilling")}:{" "}
              <span className="font-semibold text-foreground">{renewalLabel}</span>
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-foreground mb-3">{t("subWhatsIncluded")}</p>
          <div className="space-y-2">
            {features.map((f) => (
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
            <span className="text-sm font-semibold text-foreground">{t("billingHistory")}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Cancel */}
        {!cancelConfirm ? (
          <button
            onClick={() => setCancelConfirm(true)}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-destructive border border-destructive/30 hover:bg-destructive/5 transition-colors"
          >
            {t("subCancelSub")}
          </button>
        ) : (
          <div className="border border-destructive/30 rounded-2xl p-4 bg-destructive/5">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  {t("subCancelTitle").replace("{tier}", tierLabel)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {subscriptionExpiresAt
                    ? t("subCancelDesc").replace("{date}", renewalLabel)
                    : t("subCancelDescNoDate")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground"
              >
                <X className="w-4 h-4 inline mr-1" />{t("subKeepPlan")}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {cancelling ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("subCancelling")}</>
                ) : (
                  t("subYesCancel")
                )}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
