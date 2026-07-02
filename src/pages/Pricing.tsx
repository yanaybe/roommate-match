import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, Zap, Crown, Gem, Heart, Undo2, Eye, MessageCircle,
  Star, Rocket, TrendingUp, BadgeCheck, ArrowLeft, ArrowRight,
} from "lucide-react";

import { PLAN_PRICES, ANNUAL_PRICES } from "@/lib/plans";

const plans = [
  {
    id: "plus",
    name: "Plus",
    price: PLAN_PRICES.plus.monthly,
    annualPrice: PLAN_PRICES.plus.annual,
    tagline: "Remove limits",
    popular: false,
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-500",
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
    price: PLAN_PRICES.gold.monthly,
    annualPrice: PLAN_PRICES.gold.annual,
    tagline: "Most popular",
    popular: true,
    icon: Crown,
    color: "from-amber-400 to-orange-500",
    textColor: "text-amber-600",
    borderColor: "border-amber-400",
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
    price: PLAN_PRICES.platinum.monthly,
    annualPrice: PLAN_PRICES.platinum.annual,
    tagline: "For serious searchers",
    popular: false,
    icon: Gem,
    color: "from-violet-500 to-purple-600",
    textColor: "text-violet-600",
    borderColor: "border-violet-500",
    features: [
      { icon: Check, text: "Everything in Gold" },
      { icon: MessageCircle, text: "Message before matching" },
      { icon: Rocket, text: "3 boosts per week" },
      { icon: BadgeCheck, text: "\"Top Match\" profile badge" },
      { icon: Crown, text: "Priority in all listings" },
    ],
  },
];

const freeFeatures = [
  "Create a full profile",
  "Browse all apartments",
  "14-factor compatibility matching",
  "Up to 10 likes per day",
  "Squad search (group roommate hunting)",
  "3 languages (EN / HE / FR)",
];

const faqs = [
  {
    q: "Can I try RooMatch for free?",
    a: "Yes — the Free plan is free forever with no credit card required. You get full profile creation, apartment browsing, and up to 10 likes per day.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel from Account Settings at any time. You keep access until the end of your billing period — no questions asked.",
  },
  {
    q: "Are prices in Israeli Shekel?",
    a: "Yes, all prices are in ₪ (NIS) and include VAT where applicable.",
  },
  {
    q: "What's the difference between monthly and annual billing?",
    a: "Annual billing saves you roughly 2 months — you pay for 10 and get 12. The price is locked for the full year.",
  },
  {
    q: "Can I get a refund?",
    a: "If you're not satisfied within 14 days of your first charge, contact us at roomatchltd@gmail.com and we'll sort it out.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top nav */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Pricing</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-xs font-semibold text-primary">Simple, honest pricing</span>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
            Find your roommate faster
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Start free. Upgrade when you want more matches, more visibility, and fewer limits.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 mt-6 bg-secondary rounded-2xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                !annual ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                annual ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Annual
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                −17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Free plan */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-secondary/50 border border-border rounded-3xl p-6 mb-4"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Free</p>
              <p className="text-3xl font-extrabold text-foreground">₪0</p>
              <p className="text-xs text-muted-foreground mt-0.5">Forever free · No credit card</p>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
            {freeFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Paid plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const displayPrice = annual
              ? Math.round(plan.annualPrice / 12)
              : plan.price;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className={`relative bg-background border-2 rounded-3xl p-6 flex flex-col ${
                  plan.popular ? `${plan.borderColor} shadow-xl` : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r ${plan.color} text-white text-[11px] font-extrabold px-4 py-1 rounded-full whitespace-nowrap`}>
                    Most Popular
                  </div>
                )}

                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <p className="text-base font-extrabold text-foreground">{plan.name}</p>
                <p className={`text-xs font-semibold ${plan.textColor} mb-4`}>{plan.tagline}</p>

                <div className="mb-1">
                  <span className="text-3xl font-extrabold text-foreground">₪{displayPrice}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                {annual && (
                  <p className="text-xs text-emerald-600 font-semibold mb-4">
                    ₪{plan.annualPrice}/year · 2 months free
                  </p>
                )}
                {!annual && <p className="text-xs text-muted-foreground mb-4">billed monthly</p>}

                <button
                  onClick={() => navigate("/auth")}
                  className={`w-full py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r ${plan.color} shadow-sm hover:opacity-90 transition-opacity mb-5`}
                >
                  Get {plan.name}
                </button>

                <div className="space-y-2.5 flex-1">
                  {plan.features.map((feat) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div key={feat.text} className="flex items-start gap-2.5">
                        <FeatIcon className={`w-4 h-4 ${plan.textColor} shrink-0 mt-0.5`} />
                        <span className="text-sm text-muted-foreground">{feat.text}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-lg font-extrabold text-foreground mb-4">Frequently asked questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-border rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                  <span className={`text-primary font-bold text-lg transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-muted-foreground mb-2">
            Questions? Email us at{" "}
            <a href="mailto:roomatchltd@gmail.com" className="text-primary underline underline-offset-2">
              roomatchltd@gmail.com
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            All prices in ₪ (NIS) · Cancel anytime · No hidden fees
          </p>
        </motion.div>
      </div>
    </div>
  );
}
