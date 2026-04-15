import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Search, Home, Users, CreditCard, Shield, MessageCircle,
  Smartphone, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  icon: React.ElementType;
  title: string;
  color: string;
  faqs: FaqItem[];
}

const categories: FaqCategory[] = [
  {
    icon: Home,
    title: "Finding Apartments",
    color: "bg-primary/10 text-primary",
    faqs: [
      { q: "How do I search for apartments?", a: "Browse apartments on the home screen. Use the filter button to narrow results by price, location, room type, and amenities. Swipe through listings or tap 'Details' for more info." },
      { q: "How do I contact an apartment owner?", a: "Tap the 'Message' button on any apartment card or the 'Message Owner' button on the apartment details page. This will open a direct chat with the listing owner." },
      { q: "Can I save apartments for later?", a: "Yes! Tap the bookmark icon on any apartment card to save it. Access your saved apartments from your profile." },
      { q: "What does the match percentage mean?", a: "The match percentage shows how well an apartment fits your preferences based on your profile settings like budget, location, and lifestyle preferences." },
    ],
  },
  {
    icon: Users,
    title: "Roommates & Squads",
    color: "bg-accent/10 text-accent",
    faqs: [
      { q: "How does roommate matching work?", a: "We match you based on lifestyle preferences like sleep schedule, cleanliness, noise level, and social habits. The higher the match percentage, the more compatible you are." },
      { q: "What is a Squad?", a: "A Squad is a group of roommates looking for an apartment together. Create or join a squad to coordinate your apartment search with compatible people." },
      { q: "How do I create a Squad?", a: "Go to 'My Squads' from your profile, then tap 'Create Squad'. Set your group preferences and invite roommates you've matched with." },
      { q: "Can I be in multiple Squads?", a: "Yes, you can join or create multiple squads to explore different roommate combinations." },
    ],
  },
  {
    icon: CreditCard,
    title: "Subscription & Billing",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    faqs: [
      { q: "What plans are available?", a: "We offer Free, Plus, Gold, and Platinum plans. Each tier unlocks additional features like unlimited likes, profile insights, and priority matching." },
      { q: "How do I upgrade my plan?", a: "Go to Settings → Manage Subscription and choose the plan that works for you. Payment is processed securely through our platform." },
      { q: "Can I cancel my subscription?", a: "Yes, you can cancel anytime from Settings → Manage Subscription. Your premium features will remain active until the end of your billing period." },
      { q: "How do refunds work?", a: "Refunds are handled on a case-by-case basis. Contact our support team through the Contact Support page for assistance." },
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Safety",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    faqs: [
      { q: "Is my personal information safe?", a: "Yes. We use industry-standard encryption and never share your personal data with third parties without your consent. Read our Privacy Policy for details." },
      { q: "How do I report a user?", a: "You can report a user from their profile or from a chat conversation. Our team reviews all reports within 24 hours." },
      { q: "Can I block someone?", a: "Yes. Open the user's profile and tap the block option. Blocked users won't be able to see your profile or contact you." },
      { q: "How do I delete my account?", a: "Contact our support team through Settings → Contact Support. We'll process your request and delete all associated data within 30 days." },
    ],
  },
  {
    icon: Smartphone,
    title: "Account & App",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    faqs: [
      { q: "How do I edit my profile?", a: "Go to your Profile page and tap the edit icon. You can update your photos, bio, and all lifestyle preferences." },
      { q: "I'm not receiving notifications", a: "Make sure notifications are enabled in your device settings. Also check Settings → App Settings to ensure in-app notifications are turned on." },
      { q: "How do I change my email?", a: "Contact support to update your email address. For security, we verify the change through both old and new email addresses." },
      { q: "The app is running slowly", a: "Try clearing your app cache, updating to the latest version, or restarting your device. If issues persist, contact support." },
    ],
  },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const filtered = search.trim()
    ? categories.map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter(
          (f) =>
            f.q.toLowerCase().includes(search.toLowerCase()) ||
            f.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => cat.faqs.length > 0)
    : categories;

  const totalResults = filtered.reduce((sum, cat) => sum + cat.faqs.length, 0);

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t("helpCenter")}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl gradient-primary p-6 text-center"
        >
          <h2 className="text-xl font-bold text-primary-foreground mb-1">
            How can we help?
          </h2>
          <p className="text-primary-foreground/70 text-sm mb-4">
            Search our FAQ or browse by category
          </p>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for answers..."
              className="w-full ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-3 rounded-xl bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </motion.div>

        {/* Search results count */}
        {search.trim() && (
          <p className="text-xs text-muted-foreground px-1">
            {totalResults} result{totalResults !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Categories */}
        <div className="space-y-3">
          {filtered.map((cat, idx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="bg-card rounded-2xl shadow-card overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() =>
                    setExpandedCategory(expandedCategory === idx ? null : idx)
                  }
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                    <cat.icon size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{cat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.faqs.length} question{cat.faqs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {(expandedCategory === idx || search.trim()) ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </button>

                {/* FAQs */}
                {(expandedCategory === idx || search.trim()) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border/30"
                  >
                    <Accordion type="single" collapsible className="px-4">
                      {cat.faqs.map((faq, fIdx) => (
                        <AccordionItem key={fIdx} value={`${idx}-${fIdx}`} className="border-border/20">
                          <AccordionTrigger className="text-sm text-left font-medium py-3.5 hover:no-underline">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Still need help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl shadow-card p-5 text-center"
        >
          <MessageCircle size={24} className="text-primary mx-auto mb-2" />
          <h3 className="text-sm font-bold text-foreground mb-1">Still need help?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Our support team is here for you
          </p>
          <button
            onClick={() => navigate("/contact-support")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:scale-105 transition-transform"
          >
            Contact Support
            <ExternalLink size={14} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
