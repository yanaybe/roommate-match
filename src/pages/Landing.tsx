import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, MessageCircle, Zap, Star, Shield,
  ChevronRight, Heart, MapPin, Check, Sparkles, Globe
} from "lucide-react";
import { useLanguage, languages } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const TESTIMONIALS = [
  {
    name: "Maya L.",
    city: "Tel Aviv",
    quote: "Found my perfect roommate in 3 days. The compatibility score actually works — we're now best friends!",
    avatar: "M",
    color: "from-pink-500 to-rose-500",
    stars: 5,
  },
  {
    name: "Yonatan K.",
    city: "Jerusalem",
    quote: "Used the squad feature with 2 friends — we found an apartment together in under a week. Game changer.",
    avatar: "Y",
    color: "from-blue-500 to-indigo-500",
    stars: 5,
  },
  {
    name: "Noa S.",
    city: "Haifa",
    quote: "As a French speaker, having the app in my language made everything so much easier. Highly recommend.",
    avatar: "N",
    color: "from-emerald-500 to-teal-500",
    stars: 5,
  },
];

const PREVIEW_LISTINGS = [
  { title: "Modern Flat · Florentin", price: "₪3,200", match: 92, city: "Tel Aviv", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop" },
  { title: "Penthouse · Neve Tzedek", price: "₪3,800", match: 87, city: "Tel Aviv", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=260&fit=crop" },
  { title: "Sea View · Bat Galim", price: "₪2,600", match: 81, city: "Haifa", img: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&h=260&fit=crop" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { t, language, setLanguage, languageInfo } = useLanguage();
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
    { value: "14", label: t("statsFactorsLabel") },
    { value: "85%", label: "Avg match quality" },
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
    { name: t("planFree"), price: "₪0", features: [t("planBrowseListings"), t("plan8Likes"), t("planMatchChat")] },
    { name: t("planGold"), price: "₪29", features: [t("planUnlimitedLikes"), t("planSeeWhoLiked"), t("planWeeklyBoost")], highlight: true },
    { name: t("planPlatinum"), price: "₪39", features: [t("planMessageBefore"), t("planPriorityPlacement"), t("plan3Boosts")] },
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
            {/* Language switcher */}
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
              onClick={() => navigate("/auth?mode=login")}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("signIn")}
            </button>
            <button
              onClick={() => navigate("/auth?mode=register")}
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">What our users say</h2>
          <p className="text-muted-foreground mt-2">Real stories from people who found their match</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.name}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
              className="bg-card rounded-2xl p-5 shadow-card flex flex-col gap-3"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: item.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed flex-1">"{item.quote}"</p>
              <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border/50">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-sm font-bold">{item.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
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
              <p className="text-muted-foreground mb-6 max-w-lg">
                {t("squadSectionDesc")}
              </p>
              {/* Squad 3-step explainer */}
              <div className="flex items-center gap-2 mb-5">
                {[
                  { step: "1", label: "Invite 2–4 friends" },
                  { step: "2", label: "Browse & vote together" },
                  { step: "3", label: "Move in as a group" },
                ].map(({ step, label }, i) => (
                  <div key={step} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center mb-1 shrink-0">
                        <span className="text-[11px] font-bold text-primary-foreground">{step}</span>
                      </div>
                      <span className="text-[10px] text-foreground font-medium leading-tight max-w-[56px]">{label}</span>
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
                onClick={() => navigate("/auth")}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
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
