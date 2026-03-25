import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Star, Gem, Zap, Check, Lock, Heart, MessageCircle,
  Eye, Undo2, Filter, TrendingUp, BadgeCheck, Rocket, ChevronRight
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface PremiumSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    id: "plus",
    name: "Plus",
    emoji: "🥉",
    price: 19,
    tagline: "Remove Limits",
    popular: false,
    color: "hsl(var(--accent))",
    features: [
      { icon: Heart, text: "Unlimited likes" },
      { icon: Undo2, text: "Undo last swipe (Rewind)" },
      { icon: Eye, text: "Control visibility — only people you liked see you" },
      { icon: Filter, text: "Access to basic filters" },
      { icon: Zap, text: "Hide ads" },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "🥈",
    price: 29,
    tagline: "Most Popular",
    popular: true,
    color: "hsl(var(--match-medium))",
    features: [
      { icon: Check, text: "Everything in Plus" },
      { icon: Eye, text: "See who liked you (users & apartments)" },
      { icon: MessageCircle, text: "Unlimited chats" },
      { icon: Star, text: "Daily \"Top Matches\" suggestions" },
      { icon: Rocket, text: "1 boost per week" },
      { icon: TrendingUp, text: "Higher visibility in search" },
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    emoji: "🥇",
    price: 39,
    tagline: "Power Users",
    popular: false,
    color: "hsl(var(--primary))",
    features: [
      { icon: Check, text: "Everything in Gold" },
      { icon: Rocket, text: "Priority likes — shown before free users" },
      { icon: MessageCircle, text: "Message users before matching" },
      { icon: TrendingUp, text: "Your likes appear first in feeds" },
      { icon: Eye, text: "See all likes you sent" },
      { icon: Zap, text: "3 boosts per week" },
      { icon: BadgeCheck, text: "\"Top Match\" badge on profile" },
      { icon: Crown, text: "Priority placement in listings & map" },
    ],
  },
];

const boosts = [
  { label: "1 Day Boost", price: 10, desc: "Profile/listing boost for 24h" },
  { label: "1 Week Boost", price: 50, desc: "7 days of higher visibility" },
  { label: "1 Month Boost", price: 150, desc: "30 days at the top" },
];

const extras = [
  { label: "Instant Message", price: 5, desc: "Message without matching", icon: MessageCircle },
  { label: "Profile Highlight", price: 7, desc: "Stand out in search", icon: Star },
];

const freeFeatures = [
  "Browse apartment listings & roommate profiles",
  "Save up to 3 apartments/day",
  "Like up to 8 roommates/day",
  "Match when both sides like each other",
  "Send messages only after matching",
  "View match percentage",
];

const freeLimitations = [
  "Cannot see who liked you",
  "Limited daily likes — 8",
  "Limited daily messages — 20",
  "No boosts or priority visibility",
];

export default function PremiumSheet({ open, onOpenChange }: PremiumSheetProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>("gold");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Gem className="w-5 h-5 text-primary" />
            Go Premium
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(92vh-70px)]">
          <div className="px-5 py-4 space-y-6">

            {/* Teaser: blurred likes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-muted blur-[3px] border-2 border-card"
                    />
                  ))}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    12 people liked you
                  </p>
                  <p className="text-xs text-muted-foreground">Upgrade to see who they are</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>

            {/* Free plan summary */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                👤 Your Free Plan
              </h3>
              <div className="bg-card rounded-2xl shadow-card p-4 space-y-2">
                {freeFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
                <div className="border-t border-border/50 pt-2 mt-2">
                  {freeLimitations.map((l, i) => (
                    <div key={i} className="flex items-start gap-2 py-0.5">
                      <Lock className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan selector — side by side cards */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                💎 Choose Your Plan
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {plans.map((plan, idx) => {
                  const isSelected = selectedPlan === plan.id;
                  const iconMap = { plus: Zap, gold: Crown, platinum: Gem };
                  const PlanIcon = iconMap[plan.id as keyof typeof iconMap];
                  const gradients = {
                    plus: "from-accent/20 to-accent/5",
                    gold: "from-[hsl(38,92%,55%)]/25 to-[hsl(38,92%,55%)]/5",
                    platinum: "from-primary/20 to-primary/5",
                  };
                  const iconColors = {
                    plus: "text-accent",
                    gold: "text-[hsl(38,92%,55%)]",
                    platinum: "text-primary",
                  };
                  const ringColors = {
                    plus: "ring-accent",
                    gold: "ring-[hsl(38,92%,55%)]",
                    platinum: "ring-primary",
                  };

                  return (
                    <motion.button
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative flex flex-col items-center text-center rounded-2xl p-3 pt-4 transition-all border-2 bg-gradient-to-b ${gradients[plan.id as keyof typeof gradients]} ${
                        isSelected
                          ? `${ringColors[plan.id as keyof typeof ringColors]} border-transparent ring-2 shadow-lg scale-[1.03]`
                          : "border-border/60 shadow-card"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-primary-foreground whitespace-nowrap" style={{ background: "var(--gradient-primary)" }}>
                          ⭐ BEST VALUE
                        </div>
                      )}

                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${isSelected ? "bg-card shadow-md" : "bg-card/60"}`}>
                        <PlanIcon className={`w-5 h-5 ${iconColors[plan.id as keyof typeof iconColors]}`} />
                      </div>

                      <span className="text-xs font-extrabold text-foreground">{plan.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{plan.tagline}</span>

                      <div className="mt-2 mb-1">
                        <span className="text-xl font-extrabold text-foreground">₪{plan.price}</span>
                        <span className="text-[10px] text-muted-foreground">/mo</span>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-transparent"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Expanded features for selected plan */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedPlan}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 bg-card rounded-2xl shadow-card p-4"
                >
                  <p className="text-xs font-bold text-foreground mb-2">
                    {plans.find(p => p.id === selectedPlan)?.emoji}{" "}
                    {plans.find(p => p.id === selectedPlan)?.name} includes:
                  </p>
                  <div className="space-y-1.5">
                    {plans.find(p => p.id === selectedPlan)?.features.map((feat, i) => {
                      const Icon = feat.icon;
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span className="text-xs text-foreground">{feat.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Subscribe CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 shadow-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Crown className="w-4 h-4" />
                Get {plans.find((p) => p.id === selectedPlan)?.name} — ₪
                {plans.find((p) => p.id === selectedPlan)?.price}/mo
              </motion.button>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Cancel anytime · Billed monthly
              </p>
            </div>

            {/* One-time purchases */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                💰 One-Time Purchases
              </h3>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground mb-1">Boost Profile / Listing</p>
                <div className="grid grid-cols-3 gap-2">
                  {boosts.map((b) => (
                    <button
                      key={b.label}
                      className="bg-card border border-border rounded-xl p-3 text-center hover:border-primary/50 transition-colors shadow-card"
                    >
                      <Rocket className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-[11px] font-bold text-foreground">{b.label}</p>
                      <p className="text-xs font-extrabold text-primary mt-0.5">₪{b.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                {extras.map((e) => {
                  const Icon = e.icon;
                  return (
                    <button
                      key={e.label}
                      className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-colors shadow-card"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold text-foreground">{e.label}</p>
                        <p className="text-[11px] text-muted-foreground">{e.desc}</p>
                      </div>
                      <span className="text-sm font-extrabold text-primary">₪{e.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pb-6" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
