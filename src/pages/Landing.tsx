import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, MessageCircle, Zap, Star, Shield,
  ChevronRight, Heart, MapPin, Check, Sparkles, Globe, Lock
} from "lucide-react";
import { useLanguage, languages } from "@/hooks/useLanguage";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const PREVIEW_LISTINGS = [
  { title: "Modern Flat · Florentin", price: "₪3,200", match: 92, city: "Tel Aviv", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop" },
  { title: "Penthouse · Neve Tzedek", price: "₪3,800", match: 87, city: "Tel Aviv", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=260&fit=crop" },
  { title: "Sea View · Bat Galim", price: "₪2,600", match: 81, city: "Haifa", img: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&h=260&fit=crop" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { t, language, setLanguage, languageInfo } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  const STATS = [
    { value: "14", label: t("statsFactorsLabel") },
    { value: "3", label: t("statsLanguagesLabel") },
    { value: "₪0", label: t("statsFreeToStart") },
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
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="RooMatch" className="w-8 h-8 object-contain" />
            <span className="text-lg font-extrabold text-foreground">
              Roo<span className="text-primary">Match</span>
            </span>
          </div>
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
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        >
          {PREVIEW_LISTINGS.map((l, i) => (
            <motion.div
              key={l.title}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }} custom={i}
              onClick={() => navigate("/auth")}
              className="relative bg-card rounded-2xl shadow-card overflow-hidden shrink-0 w-64 snap-start cursor-pointer hover:shadow-elevated transition-shadow"
            >
              <div className="relative h-40 overflow-hidden">
                <img src={l.img} alt={l.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 left-3 gradient-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {l.match}% match
                </div>
                <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />Sign in to view
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
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }} custom={3}
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
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }}
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
                  variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }} custom={i}
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

      {/* ── Why RooMatch? ── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Why RooMatch?</h2>
          <p className="text-muted-foreground mt-2">Built differently — because finding a roommate is about more than location</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🧬",
              title: "14 lifestyle factors",
              desc: "We match on sleep schedule, cleanliness, noise level, pets, cooking habits, and 9 more — not just budget and city.",
            },
            {
              icon: "👥",
              title: "Squad search",
              desc: "The only roommate platform that lets 2–4 friends search together, vote on apartments, and move in as a group.",
            },
            {
              icon: "🔒",
              title: "Verified profiles",
              desc: "Every account is email-verified. No anonymous browsing — everyone on the platform is real and accountable.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }} custom={i}
              className="bg-card rounded-2xl p-6 shadow-card flex flex-col gap-3 text-center items-center"
            >
              <span className="text-4xl mb-1">{item.icon}</span>
              <h3 className="font-bold text-foreground text-base">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }}
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
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }} custom={i}
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
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }}
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
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{t("pricingTitle")}</h2>
          <p className="text-muted-foreground mt-2">{t("pricingSub")}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }} custom={i}
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
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.01 }}
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
      <footer className="border-t border-border/50 px-5 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="RooMatch" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-base font-extrabold text-foreground">Roo<span className="text-primary">Match</span></span>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">Find your perfect roommate</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com/_roomatch" target="_blank" rel="noopener noreferrer" aria-label="Follow RooMatch on Instagram"
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center hover:scale-105 transition-transform">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="mailto:roomatchltd@gmail.com" aria-label="Email RooMatch support"
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center hover:scale-105 transition-transform">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
              <button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground transition-colors">{t("footerPrivacy")}</button>
              <button onClick={() => navigate("/terms-of-service")} className="hover:text-foreground transition-colors">{t("footerTerms")}</button>
              <button onClick={() => navigate("/contact-support")} className="hover:text-foreground transition-colors">{t("footerContact")}</button>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 RooMatch · Made in Israel 🇮🇱</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
