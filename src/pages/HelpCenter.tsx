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

export default function HelpCenter() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const categories: FaqCategory[] = [
    {
      icon: Home,
      title: t("helpFindingApts"),
      color: "bg-primary/10 text-primary",
      faqs: [
        { q: t("helpQ1"), a: t("helpA1") },
        { q: t("helpQ2"), a: t("helpA2") },
        { q: t("helpQ3"), a: t("helpA3") },
        { q: t("helpQ4"), a: t("helpA4") },
      ],
    },
    {
      icon: Users,
      title: t("helpRoommates"),
      color: "bg-accent/10 text-accent",
      faqs: [
        { q: t("helpQ5"), a: t("helpA5") },
        { q: t("helpQ6"), a: t("helpA6") },
        { q: t("helpQ7"), a: t("helpA7") },
        { q: t("helpQ8"), a: t("helpA8") },
      ],
    },
    {
      icon: CreditCard,
      title: t("helpBilling"),
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      faqs: [
        { q: t("helpQ9"), a: t("helpA9") },
        { q: t("helpQ10"), a: t("helpA10") },
        { q: t("helpQ11"), a: t("helpA11") },
        { q: t("helpQ12"), a: t("helpA12") },
      ],
    },
    {
      icon: Shield,
      title: t("helpPrivacy"),
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      faqs: [
        { q: t("helpQ13"), a: t("helpA13") },
        { q: t("helpQ14"), a: t("helpA14") },
        { q: t("helpQ15"), a: t("helpA15") },
        { q: t("helpQ16"), a: t("helpA16") },
      ],
    },
    {
      icon: Smartphone,
      title: t("helpAccount"),
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      faqs: [
        { q: t("helpQ17"), a: t("helpA17") },
        { q: t("helpQ18"), a: t("helpA18") },
        { q: t("helpQ19"), a: t("helpA19") },
        { q: t("helpQ20"), a: t("helpA20") },
      ],
    },
  ];

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
            {t("helpHeroTitle")}
          </h2>
          <p className="text-primary-foreground/70 text-sm mb-4">
            {t("helpHeroSub")}
          </p>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("helpSearchPlaceholder")}
              className="w-full ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-3 rounded-xl bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </motion.div>

        {/* Search results count */}
        {search.trim() && (
          <p className="text-xs text-muted-foreground px-1">
            {totalResults} {totalResults !== 1 ? t("helpResultsFound") : t("helpResultFound")}
          </p>
        )}

        {/* Categories */}
        <div className="space-y-3">
          {filtered.map((cat, idx) => (
            <motion.div
              key={idx}
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
                      {cat.faqs.length} {cat.faqs.length !== 1 ? t("helpQuestionsPlural") : t("helpQuestionSingular")}
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
          <h3 className="text-sm font-bold text-foreground mb-1">{t("helpStillNeed")}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t("helpSupportTeam")}
          </p>
          <button
            onClick={() => navigate("/contact-support")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:scale-105 transition-transform"
          >
            {t("helpContactSupport")}
            <ExternalLink size={14} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
