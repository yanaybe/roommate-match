import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Receipt, CreditCard, Crown, Zap, Star, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

const TIER_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  free:     { label: "Free",     color: "bg-secondary text-secondary-foreground", icon: Zap },
  plus:     { label: "Plus",     color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Star },
  gold:     { label: "Gold",     color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Crown },
  platinum: { label: "Platinum", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Crown },
};

const PADDLE_ENV = import.meta.env.VITE_PADDLE_ENV as string | undefined;
const PADDLE_PORTAL =
  PADDLE_ENV === "production"
    ? "https://customer.paddle.com/subscriptions"
    : "https://sandbox-customer.paddle.com/subscriptions";

interface SubscriptionInfo {
  tier: string;
  paddle_subscription_id: string | null;
  subscription_expires_at: string | null;
}

export default function BillingHistory() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_tier, paddle_subscription_id, subscription_expires_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setInfo({
            tier: (data as any).subscription_tier ?? "free",
            paddle_subscription_id: (data as any).paddle_subscription_id ?? null,
            subscription_expires_at: (data as any).subscription_expires_at ?? null,
          });
        }
        setLoading(false);
      });
  }, [user]);

  const tierInfo = TIER_LABELS[info?.tier ?? "free"] ?? TIER_LABELS.free;
  const TierIcon = tierInfo.icon;
  const isPaid = info?.tier !== "free" && info?.tier != null;

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t("billingHistory")}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Current Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="gradient-primary rounded-2xl p-5 shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-xs font-medium mb-1">{t("billingCurrentPlan")}</p>
                  <div className="flex items-center gap-2">
                    <TierIcon size={22} className="text-primary-foreground" />
                    <p className="text-2xl font-bold text-primary-foreground">{tierInfo.label}</p>
                  </div>
                  {info?.subscription_expires_at && (
                    <p className="text-primary-foreground/60 text-xs mt-1">
                      {t("billingActiveUntil")} {new Date(info.subscription_expires_at).toLocaleDateString()}
                    </p>
                  )}
                  {!isPaid && (
                    <p className="text-primary-foreground/60 text-xs mt-1">{t("billingFreeDesc")}</p>
                  )}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                  <Receipt size={28} className="text-primary-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Manage Subscription */}
            {isPaid && info?.paddle_subscription_id && (
              <motion.a
                href={PADDLE_PORTAL}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-3 bg-card rounded-2xl shadow-card p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t("billingManageSubscription")}</p>
                  <p className="text-xs text-muted-foreground">{t("billingManageDesc")}</p>
                </div>
                <ExternalLink size={16} className="text-muted-foreground shrink-0" />
              </motion.a>
            )}

            {/* Transaction History Note */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl shadow-card p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Receipt size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">{t("billingTransactionHistory")}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("billingTransactionDesc")}
                  </p>
                  {isPaid && info?.paddle_subscription_id && (
                    <a
                      href={PADDLE_PORTAL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline"
                    >
                      {t("billingViewInPaddle")} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Upgrade CTA for free users */}
            {!isPaid && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                onClick={() => navigate("/profile")}
                className="w-full gradient-primary text-primary-foreground rounded-2xl p-4 font-bold text-sm shadow-elevated hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Crown size={16} /> {t("billingUpgradeCta")}
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
