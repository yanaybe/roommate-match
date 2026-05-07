import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, MessageCircle, Zap, Star, Shield,
  ChevronRight, Heart, MapPin, Check, Sparkles, Globe, Quote,
} from "lucide-react";
import { useLanguage, languages } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCheckout } from "@/hooks/useCheckout";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

// Static preview cards shown to unauthenticated visitors
const PREVIEW_LISTINGS = [
  { title: "Modern Flat · Florentin", price: "₪3,200", match: 92, city: "Tel Aviv", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop" },
  { title: "Penthouse · Neve Tzedek", price: "₪3,800", match: 87, city: "Tel Aviv", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=260&fit=crop" },
  { title: "Sea View · Bat Galim", price: "₪2,600", match: 81, city: "Haifa", img: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&h=260&fit=crop" },
];

const TESTIMONIALS = [
  {
    name: "Dana L.",
    city: "Tel Aviv",
    quote: "Found my roommate in 3 days. The match score was 89% and she turned out to be exactly right — same sleep schedule, same cleanliness standards. Zero drama.",
    avatar: "D",
    color: "bg-violet-500",
  },
  {
    name: "Roee M.",
    city: "Jerusalem",
    quote: "The squad feature is genius. Me and two friends found a 4-bedroom together instead of each searching alone. Saved us months.",
    avatar: "R",
    color: "bg-blue-500",
  },
  {
    name: "Noa S.",
    city: "Haifa",
    quote: "I was sceptical about the algorithm but the 14-factor matching actually works. My previous roommate was a random Yad2 find — never again.",
    avatar: "N",
    color: "bg-emerald-500",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { t, language, setLanguage, languageInfo } = useLanguage();
  const { user } = useAuth();
  const { checkout, loading: checkoutLoading } = useCheckout();
  const [langOpen, setLangOpen] = useState(false);
  const [activeSearcherCount, setActiveSearcherCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_complete", true)
      .then(({ count }) => {
        if (count !== null) setActiveSearcherCount(Math.max(count, 50));
      });
  }, []);

  const STATS = [
    { value: "14", label: "Compatibility checks" },
    { value: "2 min", label: "Setup time" },
    { value: activeSearcherCount ? `${activeSearcherCount}+` : "50+", label: "Active searchers" },
  ];

  const HOW_IT_WORKS = [
    { step: "01", icon: Users, title: t("howBuildProfile"), desc: t("howBuildProfileDesc") },
    { step: "02", icon: Heart, title: t("howSwipeMatch"), desc: t("howSwipeMatchDesc") },
    { step: "03", icon: MessageCircle, title: t("howChatMoveIn"), desc: t("howChatMoveInDesc") },
  ];

  const FEATURES = [
    {
      icon: Zap,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      title: t("featureSquadSearch"),
      desc: t("featureSquadSearchDesc"),
      badge: t("featureUnique"),
    },
    {
      icon: Sparkles,
      color: "bg-primary/10 text-primary",
      title: t("featureSmartMatching"),
      desc: t("featureSmartMatchingDesc"),
      badge: null,
    },
    {
      icon: Shield,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      title: t("featureSafeTrusted"),
      desc: t("featureSafeTrustedDesc"),
      badge: null,
    },
    {
      icon: MapPin,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      title: t("featureMapView"),
      desc: t("featureMapViewDesc"),
      badge: null,
    },
  ];

  const PLANS = [
    {
      name: t("planFree"),
      price: "₪0",
      features: [
        "Browse all apartment listings",
        "30 profile likes per day",
        "Chat after mutual match",
        "Map view",
        "Basic lifestyle filters",
        "Profile verification badge",
      ],
    },
    {
      name: t("planGold"),
      price: "₪29",
      highlight: true,
      features: [
        "Unlimited profile likes",
        "See who liked you",
        "1 weekly profile boost",
        "Advanced lifestyle filters",
        "Priority in search results",
        "Save & get alerts for searches",
        "Early access to new features",
      ],
    },
    {
      name: t("planPlatinum"),
      price: "₪39",
      features: [
        "Everything in Gold",
        "Message before matching",
        "3 monthly profile boosts",
        "Top placement in city search",
        "Squad creation & management",
        "Profile performance analytics",
        "Priority support",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background" onClick={() => setLangOpen(false)}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="w-full px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-extrabold text-foreground">
            Room<span className="text-primary">Match</span>
          </span>
          <div className="flex items-center gap-3">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{languageInfo.shortCode}</span>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-2xl shadow-elevated overflow-hidden z-50"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                          language === lang.code
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{lang.nativeLabel}</span>
                        {language === lang.code && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("signIn")}
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="gradient-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl shadow-md"
            >
              {t("getStarted")}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 pb-20 px-5">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl bg-accent" />

        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5"
          >
            <Zap className="w-3.5 h-3.5" />
            {t("landingBadge")}
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4"
          >
            {t("landingHeroTitle")}
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto"
          >
            {t("landingSubtitle")}
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto gradient-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl text-base shadow-elevated flex items-center justify-center gap-2"
            >
              {t("findMyRoommate")}
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById("preview-listings")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto bg-secondary text-secondary-foreground font-bold px-8 py-3.5 rounded-2xl text-base"
            >
              {t("browseListings")}
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="flex items-center justify-center gap-8 mt-10"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── App UI Mockup ── */}
      <section className="px-5 pb-16 max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">See it in action</h2>
          <p className="text-muted-foreground mt-2">Swipe, match, and chat — all in under 5 minutes</p>
        </motion.div>
        <div className="flex justify-center gap-6 flex-wrap">
          {/* Phone frame: Swipe card */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}
            className="relative w-52 rounded-[2.5rem] border-4 border-gray-800 bg-gray-900 shadow-2xl overflow-hidden"
            style={{ height: 400 }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-1 bg-gray-700 rounded-full z-10" />
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=500&fit=crop&crop=face"
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute top-6 left-3 gradient-primary text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-lg">
              89% match
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-extrabold text-lg leading-tight">Yael, 26</p>
              <p className="text-white/70 text-xs mt-0.5">📍 Florentin, Tel Aviv · Designer</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">🌙 Night owl</span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">🐾 Has pets</span>
              </div>
              <div className="flex justify-between mt-4">
                <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-sm">
                  <span className="text-lg">✕</span>
                </div>
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-lg">
                  <Heart className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phone frame: Chat */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="relative w-52 rounded-[2.5rem] border-4 border-gray-800 bg-background shadow-2xl overflow-hidden hidden sm:block"
            style={{ height: 400 }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-1 bg-gray-700 rounded-full z-10" />
            {/* Chat header */}
            <div className="flex items-center gap-2.5 px-4 pt-7 pb-3 border-b border-border bg-card">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">Y</div>
              <div>
                <p className="text-xs font-bold text-foreground">Yael</p>
                <p className="text-[10px] text-primary font-semibold">89% match · Matched today</p>
              </div>
            </div>
            {/* Messages */}
            <div className="flex flex-col gap-2 p-3 flex-1">
              <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%] self-start">
                <p className="text-[11px] text-foreground">Hey! Saw we matched 😊 are you still looking for a place in Florentin?</p>
              </div>
              <div className="gradient-primary rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] self-end">
                <p className="text-[11px] text-primary-foreground">Yes! I move in July. I love that we're both night owls 🌙</p>
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%] self-start">
                <p className="text-[11px] text-foreground">Same! Want to check out an apartment together this weekend?</p>
              </div>
            </div>
            {/* Input bar */}
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-4 pt-2 border-t border-border bg-background">
              <div className="bg-secondary rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Message Yael…</span>
                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Preview listings ── */}
      <section id="preview-listings" className="px-5 pb-16 max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        >
          {PREVIEW_LISTINGS.map((l, i) => (
            <motion.div
              key={l.title}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
              onClick={() => navigate("/auth")}
              className="relative bg-card rounded-2xl shadow-card overflow-hidden shrink-0 w-64 snap-start cursor-pointer hover:shadow-elevated transition-shadow"
            >
              <div className="relative h-40 overflow-hidden">
                <img src={l.img} alt={l.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 left-3 gradient-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {l.match}% match
                </div>
                <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Example
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm text-foreground">{l.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />{l.city}
                  </span>
                  <span className="text-sm font-extrabold text-primary">{l.price}/mo</span>
                </div>
              </div>
            </motion.div>
          ))}
          {/* Blur CTA card */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={3}
            onClick={() => navigate("/auth")}
            className="relative bg-card rounded-2xl shadow-card overflow-hidden shrink-0 w-64 snap-start cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mb-3">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground text-center">{t("previewSeeAll")}</p>
            <p className="text-xs text-muted-foreground text-center mt-1">{t("previewSignUpFree")}</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 py-16 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{t("howItWorksTitle")}</h2>
            <p className="text-muted-foreground mt-2">{t("howItWorksSub")}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                  className="bg-card rounded-2xl p-6 shadow-card relative"
                >
                  <span className="absolute top-4 right-4 text-xs font-extrabold text-muted-foreground/30">{step.step}</span>
                  <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Real roommates, real stories</h2>
          <p className="text-muted-foreground mt-2">From our beta users across Israel</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
              className="bg-card rounded-2xl p-6 shadow-card flex flex-col gap-4"
            >
              <Quote className="w-6 h-6 text-primary/40 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.city}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-5 py-16 bg-secondary/40 max-w-5xl mx-auto rounded-3xl">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{t("featuresTitle")}</h2>
          <p className="text-muted-foreground mt-2">{t("featuresSub")}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                className="bg-card rounded-2xl p-5 shadow-card flex gap-4"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-sm">{f.title}</h3>
                    {f.badge && (
                      <span className="gradient-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Squad highlight ── */}
      <section className="px-5 py-16 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="bg-card rounded-2xl shadow-elevated overflow-hidden"
          >
            <div className="p-8 sm:p-10">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                <Zap className="w-3.5 h-3.5" />
                {t("onlyOnRoomMatch")}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
                {t("squadSectionTitle")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg">
                {t("squadSectionDesc")}
              </p>
              {/* 3-step visual explainer */}
              <div className="flex items-start gap-2 mb-8 flex-wrap">
                {[
                  { step: "1", label: "Invite 2–4 friends", desc: "Anyone searching for an apartment" },
                  { step: "2", label: "Browse & vote together", desc: "Real-time collaborative search" },
                  { step: "3", label: "Move in as a group", desc: "More power, less stress" },
                ].map(({ step, label, desc }, i) => (
                  <div key={step} className="flex items-start gap-2">
                    {i > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />}
                    <div className="flex flex-col items-center text-center max-w-[90px]">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center mb-2 shrink-0 shadow-md">
                        <span className="text-sm font-bold text-primary-foreground">{step}</span>
                      </div>
                      <span className="text-xs text-foreground font-semibold leading-tight">{label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="gradient-primary text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 w-fit"
              >
                <Users className="w-4 h-4" />
                {t("startASquad")}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{t("pricingTitle")}</h2>
          <p className="text-muted-foreground mt-2">{t("pricingSub")}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
              className={`rounded-2xl p-6 relative ${
                plan.highlight
                  ? "gradient-primary text-primary-foreground shadow-elevated scale-[1.02]"
                  : "bg-card shadow-card"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-extrabold px-3 py-1 rounded-full">
                  {t("mostPopular")}
                </div>
              )}
              <p className={`text-sm font-bold mb-1 ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {plan.name}
              </p>
              <p className={`text-3xl font-extrabold mb-4 ${plan.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                {plan.price}<span className="text-sm font-medium">{t("perMo")}</span>
              </p>
              <div className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-primary-foreground" : "text-primary"}`} />
                    <span className={`text-sm ${plan.highlight ? "text-primary-foreground" : "text-foreground"}`}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                disabled={checkoutLoading}
                onClick={() => {
                  if (!user) { navigate("/auth"); return; }
                  const tier = plan.name === t("planGold") ? "gold" : plan.name === t("planPlatinum") ? "platinum" : null;
                  if (tier) checkout(tier as "gold" | "platinum");
                  else navigate("/");
                }}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${
                  plan.highlight
                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {t("getStarted")}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 py-16">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            {t("ctaTitle")}
          </h2>
          <p className="text-muted-foreground mb-7">
            {t("ctaDesc")}
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="gradient-primary text-primary-foreground font-bold px-10 py-4 rounded-2xl text-base shadow-elevated inline-flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            {t("ctaBtn")}
          </button>
          <p className="text-xs text-muted-foreground mt-3">{t("ctaNoCreditCard")}</p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 px-5 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-extrabold text-foreground">
            Room<span className="text-primary">Match</span>
          </span>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground transition-colors">{t("footerPrivacy")}</button>
            <button onClick={() => navigate("/terms-of-service")} className="hover:text-foreground transition-colors">{t("footerTerms")}</button>
            <button onClick={() => navigate("/contact-support")} className="hover:text-foreground transition-colors">{t("footerContact")}</button>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 RoomMatch</p>
        </div>
      </footer>
    </div>
  );
}
