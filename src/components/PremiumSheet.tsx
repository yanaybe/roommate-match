import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Star, Gem, Zap, Check, Lock, Heart, MessageCircle,
  Eye, Undo2, TrendingUp, BadgeCheck, Rocket, X, Loader2, Sparkles, Users, Shield, RefreshCcw
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

interface PremiumSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// TODO (High | Product + Trust)
// Paddle is in "sandbox" mode by default (VITE_PADDLE_ENV ?? "sandbox").
// Before going live, ensure VITE_PADDLE_ENV=production is set in Vercel env vars
// and all PRICE_IDS are production Paddle IDs (not sandbox).
// Sandbox payments don't charge real money — if this goes live in sandbox mode,
// users will think they paid but no revenue is collected.
// See UX Audit: Roomatch audit — payment flow integrity.

const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string;
const PADDLE_ENV = (import.meta.env.VITE_PADDLE_ENV ?? "sandbox") as "sandbox" | "production";

const PRICE_IDS: Record<string, string> = {
  plus: import.meta.env.VITE_PADDLE_PRICE_PLUS as string,
  gold: import.meta.env.VITE_PADDLE_PRICE_GOLD as string,
  platinum: import.meta.env.VITE_PADDLE_PRICE_PLATINUM as string,
};

const ANNUAL_PRICE_IDS: Record<string, string> = {
  plus: import.meta.env.VITE_PADDLE_PRICE_PLUS_ANNUAL as string,
  gold: import.meta.env.VITE_PADDLE_PRICE_GOLD_ANNUAL as string,
  platinum: import.meta.env.VITE_PADDLE_PRICE_PLATINUM_ANNUAL as string,
};

// Annual prices in ₪ — ~2 months free relative to monthly × 12
const ANNUAL_PRICES: Record<string, number> = { plus: 129, gold: 199, platinum: 279 };

const plans = [
  {
    id: "plus",
    name: "Plus",
    price: 19,
    tagline: "Remove limits",
    popular: false,
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
    lightColor: "from-emerald-500/15 to-teal-500/10",
    textColor: "text-emerald-500",
    borderColor: "border-emerald-500",
    ringColor: "ring-emerald-500",
    features: [
      { icon: Heart, text: "Unlimited likes" },
      { icon: Undo2, text: "Rewind last swipe" },
      { icon: Eye, text: "Control who sees you" },
      { icon: Zap, text: "Ad-free experience" },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 29,
    tagline: "Most popular",
    popular: true,
    icon: Crown,
    color: "from-amber-400 to-orange-500",
    lightColor: "from-amber-400/20 to-orange-500/10",
    textColor: "text-amber-500",
    borderColor: "border-amber-400",
    ringColor: "ring-amber-400",
    features: [
      { icon: Check, text: "Everything in Plus" },
      { icon: Eye, text: "See everyone who liked you" },
      { icon: MessageCircle, text: "Unlimited chats" },
      { icon: Star, text: "Daily top matches" },
      { icon: Rocket, text: "1 free boost per week" },
      { icon: TrendingUp, text: "Higher search visibility" },
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 39,
    tagline: "For serious searchers",
    popular: false,
    icon: Gem,
    color: "from-violet-500 to-purple-600",
    lightColor: "from-violet-500/15 to-purple-600/10",
    textColor: "text-violet-500",
    borderColor: "border-violet-500",
    ringColor: "ring-violet-500",
    features: [
      { icon: Check, text: "Everything in Gold" },
      { icon: MessageCircle, text: "Message before matching" },
      { icon: Rocket, text: "3 boosts per week" },
      { icon: BadgeCheck, text: "\"Top Match\" profile badge" },
      { icon: Crown, text: "Priority in all listings" },
    ],
  },
];

const boosts = [
  { label: "1 Day", priceId: import.meta.env.VITE_PADDLE_PRICE_BOOST_DAY as string, price: 10, desc: "24h boost" },
  { label: "1 Week", priceId: import.meta.env.VITE_PADDLE_PRICE_BOOST_WEEK as string, price: 50, desc: "7-day boost" },
  { label: "1 Month", priceId: import.meta.env.VITE_PADDLE_PRICE_BOOST_MONTH as string, price: 150, desc: "30-day boost" },
];

const extras = [
  { label: "Instant Message", priceId: import.meta.env.VITE_PADDLE_PRICE_INSTANT_MSG as string, price: 5, desc: "Message without matching", icon: MessageCircle },
  { label: "Profile Highlight", priceId: import.meta.env.VITE_PADDLE_PRICE_HIGHLIGHT as string, price: 7, desc: "Stand out in search", icon: Star },
];

// Fake blurred avatar colors for the teaser
const avatarColors = ["bg-pink-400", "bg-violet-400", "bg-sky-400", "bg-amber-400", "bg-emerald-400"];

export default function PremiumSheet({ open, onOpenChange }: PremiumSheetProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>("gold");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!PADDLE_CLIENT_TOKEN) return;
    initializePaddle({ environment: PADDLE_ENV, token: PADDLE_CLIENT_TOKEN }).then((p) => {
      if (p) setPaddle(p);
    });
  }, []);

  const openCheckout = useCallback(async (priceId: string, tier?: string) => {
    if (!paddle) { toast.error("Payment system not ready. Please try again."); return; }
    if (!priceId) { toast.error("This plan is not available yet."); return; }
    if (!user) { toast.error("Please sign in first."); return; }
    analytics.upgradeClick("premium_sheet", tier);
    setLoading(true);
    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: user.email! },
        customData: { user_id: user.id },
        settings: { displayMode: "overlay", theme: "dark", locale: "en" },
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Paddle checkout error:", err instanceof Error ? err.message : String(err));
      toast.error("Could not open checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [paddle, user, onOpenChange]);

  const handleSubscribe = () => {
    const priceId = billing === "annual"
      ? (ANNUAL_PRICE_IDS[selectedPlan] || PRICE_IDS[selectedPlan])
      : PRICE_IDS[selectedPlan];
    openCheckout(priceId, selectedPlan);
  };
  const activePlan = plans.find((p) => p.id === selectedPlan)!;
  const activePrice = billing === "annual"
    ? ANNUAL_PRICES[selectedPlan]
    : activePlan.price;
  const annualSavings = Math.round((1 - ANNUAL_PRICES[selectedPlan] / (activePlan.price * 12)) * 100);;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[94vh] rounded-t-3xl p-0 overflow-hidden border-0">

        {/* Hero header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-amber-500 px-5 pt-8 pb-6">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10 blur-lg" />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-white/80 text-sm font-semibold tracking-wide uppercase">Roo<span className="text-amber-300">match</span> Premium</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight mb-1">
              Find your roommate<br />10× faster
            </h2>
            <p className="text-white/70 text-sm">Unlock every feature. No limits.</p>

            {/* Social proof */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex -space-x-2">
                {avatarColors.slice(0, 4).map((c, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-white/80 text-xs font-medium">
                Join our growing community
              </p>
            </div>
          </motion.div>
        </div>

        <ScrollArea className="h-[calc(94vh-190px)]">
          <div className="px-5 py-5 space-y-5">

            {/* Who liked you — FOMO teaser */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-orange-500/5 p-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/5 to-transparent animate-pulse pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="relative flex -space-x-2.5">
                  {avatarColors.map((c, i) => (
                    <div key={i} className={`w-11 h-11 rounded-full ${c} border-2 border-card blur-[5px] opacity-80`} />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-foreground">
                    People liked you 👀
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Upgrade Gold to see who they are</p>
                </div>
                <div className="bg-amber-400/20 text-amber-600 text-xs font-extrabold px-2 py-1 rounded-full border border-amber-400/30">
                  GOLD+
                </div>
              </div>
            </motion.div>

            {/* Plan selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-foreground">Choose your plan</h3>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Cancel anytime</span>
              </div>

              {/* Billing toggle */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center bg-secondary rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      billing === "monthly"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling("annual")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      billing === "annual"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Annual
                    <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                      SAVE {annualSavings}%
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {plans.map((plan, idx) => {
                  const isSelected = selectedPlan === plan.id;
                  const Icon = plan.icon;

                  return (
                    <motion.button
                      key={plan.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full relative rounded-2xl border-2 transition-all overflow-hidden ${
                        isSelected
                          ? `${plan.borderColor} bg-gradient-to-r ${plan.lightColor} shadow-lg`
                          : "border-border/60 bg-card"
                      }`}
                    >
                      {plan.popular && (
                        <div className={`absolute top-0 right-0 bg-gradient-to-r ${plan.color} text-white text-[9px] font-extrabold px-3 py-1 rounded-bl-xl`}>
                          ⭐ MOST POPULAR
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-3.5">
                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? `${plan.borderColor} bg-gradient-to-br ${plan.color}` : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0 shadow-sm`}>
                          <Icon className="w-4.5 h-4.5 text-white" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-foreground">{plan.name}</span>
                            <span className={`text-xs font-semibold ${plan.textColor}`}>{plan.tagline}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {plan.features.slice(0, 2).map((f, i) => {
                              const FIcon = f.icon;
                              return (
                                <span key={i} className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <FIcon className="w-2.5 h-2.5" />
                                  {f.text}
                                  {i < 1 && <span className="mx-0.5 opacity-30">·</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          {billing === "annual" ? (
                            <>
                              <span className="text-lg font-extrabold text-foreground">₪{ANNUAL_PRICES[plan.id]}</span>
                              <span className="text-xs text-muted-foreground block">/yr</span>
                              <span className="text-[10px] text-emerald-500 font-bold">≈₪{Math.round(ANNUAL_PRICES[plan.id] / 12)}/mo</span>
                            </>
                          ) : (
                            <>
                              <span className="text-lg font-extrabold text-foreground">₪{plan.price}</span>
                              <span className="text-xs text-muted-foreground block">/mo</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded features when selected */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 grid grid-cols-2 gap-1.5 border-t border-border/30 pt-3">
                              {plan.features.map((feat, i) => {
                                const FIcon = feat.icon;
                                return (
                                  <div key={i} className="flex items-center gap-1.5">
                                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}>
                                      <FIcon className="w-2 h-2 text-white" />
                                    </div>
                                    <span className="text-[11px] text-foreground leading-tight">{feat.text}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubscribe}
                disabled={loading}
                className={`w-full mt-4 py-4 rounded-2xl font-extrabold text-base text-white flex items-center justify-center gap-2 shadow-xl disabled:opacity-70 relative overflow-hidden bg-gradient-to-r ${activePlan.color}`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {billing === "annual"
                      ? `Get ${activePlan.name} — ₪${ANNUAL_PRICES[selectedPlan]}/year`
                      : `Get ${activePlan.name} — ₪${activePlan.price}/month`}
                  </>
                )}
              </motion.button>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  Secure payment
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Check className="w-3 h-3" />
                  Cancel anytime
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <RefreshCcw className="w-3 h-3" />
                  7-day money-back guarantee
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground font-semibold">OR ONE-TIME</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Boosts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Boost Profile / Listing</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {boosts.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => b.priceId && openCheckout(b.priceId)}
                    className="bg-card border border-border rounded-2xl p-3 text-center hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95"
                  >
                    <Rocket className="w-5 h-5 text-primary mx-auto mb-1.5" />
                    <p className="text-xs font-extrabold text-foreground">{b.label}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                    <p className="text-sm font-extrabold text-primary mt-1">₪{b.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="space-y-2 pb-6">
              {extras.map((e) => {
                const Icon = e.icon;
                return (
                  <button
                    key={e.label}
                    onClick={() => e.priceId && openCheckout(e.priceId)}
                    className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-3.5 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-foreground">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{e.desc}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-primary">₪{e.price}</span>
                      <span className="text-xs text-muted-foreground block">one-time</span>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
