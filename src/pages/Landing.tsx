import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home, Users, MessageCircle, Zap, Star, Shield,
  ChevronRight, Heart, MapPin, Check, Sparkles
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const STATS = [
  { value: "14", label: "Compatibility factors" },
  { value: "3", label: "Languages" },
  { value: "100%", label: "Free to start" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Build your profile",
    desc: "Answer a few questions about your lifestyle, budget, and habits. Takes 3 minutes.",
  },
  {
    step: "02",
    icon: Heart,
    title: "Swipe & match",
    desc: "Browse roommates and apartments. Swipe right on who feels right — matches are mutual.",
  },
  {
    step: "03",
    icon: MessageCircle,
    title: "Chat & move in",
    desc: "Message your matches directly. Find your new home and roommate in one place.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    title: "Squad Search",
    desc: "Search for apartments as a group. The only roommate app that lets you house-hunt together.",
    badge: "Unique",
  },
  {
    icon: Sparkles,
    color: "bg-primary/10 text-primary",
    title: "Smart Matching",
    desc: "14 weighted lifestyle factors — sleep schedule, cleanliness, noise level, pets and more.",
    badge: null,
  },
  {
    icon: Shield,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    title: "Safe & Trusted",
    desc: "Report and block system, profile verification, and moderated listings.",
    badge: null,
  },
  {
    icon: MapPin,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    title: "Map View",
    desc: "Browse apartments on an interactive map. See listings in your exact neighbourhood.",
    badge: null,
  },
];

const PLANS = [
  { name: "Free", price: "₪0", features: ["Browse listings", "8 likes/day", "Match & chat"] },
  { name: "Gold", price: "₪29", features: ["Unlimited likes", "See who liked you", "Weekly boost"], highlight: true },
  { name: "Platinum", price: "₪39", features: ["Message before matching", "Priority placement", "3 boosts/week"] },
];

// Static preview cards (no auth needed)
const PREVIEW_LISTINGS = [
  { title: "Modern Flat · Florentin", price: "₪3,200", match: 92, city: "Tel Aviv", rooms: 3, img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=260&fit=crop" },
  { title: "Penthouse · Neve Tzedek", price: "₪3,800", match: 87, city: "Tel Aviv", rooms: 3, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=260&fit=crop" },
  { title: "Sea View · Bat Galim", price: "₪2,600", match: 81, city: "Haifa", rooms: 3, img: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400&h=260&fit=crop" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="w-full px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-extrabold text-foreground">
            Room<span className="text-primary">Match</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="gradient-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl shadow-md"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-16 pb-20 px-5">
        {/* Background blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl bg-accent" />

        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5"
          >
            <Zap className="w-3.5 h-3.5" />
            Israel's smartest roommate app
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4"
          >
            Find your perfect{" "}
            <span className="relative">
              <span className="relative z-10" style={{ WebkitTextFillColor: "transparent", backgroundImage: "var(--gradient-primary)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
                roommate
              </span>
            </span>
            {" "}and apartment — together
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto"
          >
            Match on lifestyle, not just location. Browse apartments, swipe on roommates,
            and even search as a squad — all in one place.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto gradient-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl text-base shadow-elevated flex items-center justify-center gap-2"
            >
              Find my roommate
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto bg-secondary text-secondary-foreground font-bold px-8 py-3.5 rounded-2xl text-base"
            >
              Browse listings
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

      {/* ── Preview listings ── */}
      <section className="px-5 pb-16 max-w-5xl mx-auto">
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
            <p className="text-sm font-bold text-foreground text-center">See all listings</p>
            <p className="text-xs text-muted-foreground text-center mt-1">Sign up free to browse</p>
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">How it works</h2>
            <p className="text-muted-foreground mt-2">From sign-up to move-in in days, not weeks</p>
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

      {/* ── Features ── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Everything you need</h2>
          <p className="text-muted-foreground mt-2">Built specifically for the Israeli rental market</p>
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
            className="bg-card rounded-3xl shadow-elevated overflow-hidden"
          >
            <div className="p-8 sm:p-10">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                <Zap className="w-3.5 h-3.5" />
                Only on RoomMatch
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
                Search as a Squad 🚀
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg">
                Already know some people you want to live with? Form a squad, invite your friends,
                and vote on apartments together. No other app does this.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {["Create a squad", "Invite your friends", "Vote on apartments together", "Move in as a group"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{step}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="gradient-primary text-primary-foreground font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 w-fit"
              >
                <Users className="w-4 h-4" />
                Start a squad
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">Simple pricing</h2>
          <p className="text-muted-foreground mt-2">Start free. Upgrade when you're ready.</p>
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
                  MOST POPULAR
                </div>
              )}
              <p className={`text-sm font-bold mb-1 ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {plan.name}
              </p>
              <p className={`text-3xl font-extrabold mb-4 ${plan.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                {plan.price}<span className="text-sm font-medium">/mo</span>
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
                Get started
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
            Ready to find your people?
          </h2>
          <p className="text-muted-foreground mb-7">
            Join thousands of Israelis who found their roommate on RoomMatch.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="gradient-primary text-primary-foreground font-bold px-10 py-4 rounded-2xl text-base shadow-elevated inline-flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Create your free profile
          </button>
          <p className="text-xs text-muted-foreground mt-3">No credit card required</p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 px-5 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-extrabold text-foreground">
            Room<span className="text-primary">Match</span>
          </span>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate("/terms-of-service")} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => navigate("/contact-support")} className="hover:text-foreground transition-colors">Contact</button>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 RoomMatch</p>
        </div>
      </footer>
    </div>
  );
}
