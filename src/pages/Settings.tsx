import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Crown, CreditCard, Receipt, ChevronRight, TrendingUp,
  Eye, Heart, BarChart3, Lock, HelpCircle, MessageCircle, FileText,
  ShieldCheck, Globe, Moon, Sun, Sparkles, Zap, Star, Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import PremiumSheet from "@/components/PremiumSheet";
import { useLanguage, languages } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
      {title}
    </h3>
  );
}

function SettingsItem({
  icon: Icon,
  label,
  desc,
  onClick,
  trailing,
  accent,
  locked,
}: {
  icon: React.ElementType;
  label: string;
  desc?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  accent?: boolean;
  locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          accent
            ? "gradient-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
          {label}
        </p>
        {desc && <p className="text-xs text-muted-foreground truncate">{desc}</p>}
      </div>
      {locked && (
        <Lock size={14} className="text-muted-foreground mr-1" />
      )}
      {trailing || <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
    </button>
  );
}

function InsightCard({
  icon: Icon,
  label,
  value,
  locked,
  onUpgrade,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  locked?: boolean;
  onUpgrade?: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center p-4 rounded-2xl bg-card shadow-card flex-1 min-w-0 overflow-hidden">
      {locked && (
        <div
          className="absolute inset-0 backdrop-blur-sm bg-card/60 flex flex-col items-center justify-center z-10 cursor-pointer"
          onClick={onUpgrade}
        >
          <Lock size={18} className="text-primary mb-1" />
          <span className="text-[10px] font-semibold text-primary">Upgrade</span>
        </div>
      )}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
        <Icon size={16} className="text-primary" />
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

const planBadgeColors: Record<string, string> = {
  Free: "bg-secondary text-muted-foreground",
  Plus: "bg-accent/15 text-accent",
  Gold: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Platinum: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const planIcons: Record<string, React.ElementType> = {
  Free: Zap,
  Plus: Star,
  Gold: Crown,
  Platinum: Sparkles,
};

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage, t, languageInfo } = useLanguage();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSubscriptionTier((data as any).subscription_tier ?? "free");
      });
  }, [user]);

  const currentPlan = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);
  const PlanIcon = planIcons[currentPlan] || Zap;

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t("settings")}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        {/* 💎 Subscription & Payments */}
        <section>
          <SectionHeader title={t("subscriptionAndPayments")} />

          {/* Current plan card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden shadow-elevated mb-3"
          >
            <div className="gradient-primary p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/70 text-xs font-medium mb-1">
                    {t("currentPlan")}
                  </p>
                  <div className="flex items-center gap-2">
                    <PlanIcon size={20} className="text-primary-foreground" />
                    <span className="text-xl font-bold text-primary-foreground">
                      {currentPlan}
                    </span>
                  </div>
                </div>
                {currentPlan === "Free" && (
                  <button
                    onClick={() => setPremiumOpen(true)}
                    className="bg-primary-foreground text-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-transform"
                  >
                    {t("upgrade")}
                  </button>
                )}
              </div>
              {currentPlan === "Free" && (
                <p className="text-primary-foreground/60 text-xs mt-3">
                  {t("unlockDesc")}
                </p>
              )}
            </div>
          </motion.div>

          <div className="bg-card rounded-2xl shadow-card divide-y divide-border/30">
            <SettingsItem
              icon={Crown}
              label={t("manageSubscription")}
              desc={t("manageSubscriptionDesc")}
              accent
              onClick={() => setPremiumOpen(true)}
            />
            <SettingsItem
              icon={CreditCard}
              label={t("paymentMethods")}
              desc={t("paymentMethodsDesc")}
              onClick={() => {}}
            />
            <SettingsItem
              icon={Receipt}
              label={t("billingHistory")}
              desc={t("billingHistoryDesc")}
              onClick={() => navigate("/billing-history")}
            />
          </div>
        </section>

        {/* 📊 Activity & Insights */}
        <section>
          <SectionHeader title={t("activityAndInsights")} />

          <div className="flex gap-3 mb-3">
            <InsightCard
              icon={Eye}
              label={t("profileViews")}
              value={42}
              locked={currentPlan === "Free"}
              onUpgrade={() => setPremiumOpen(true)}
            />
            <InsightCard
              icon={Heart}
              label={t("likesReceived")}
              value={18}
              locked={currentPlan === "Free"}
              onUpgrade={() => setPremiumOpen(true)}
            />
            <InsightCard
              icon={BarChart3}
              label={t("matchRate")}
              value="76%"
            />
          </div>

          {currentPlan === "Free" && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setPremiumOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 hover:bg-primary/15 transition-colors"
            >
              <Lock size={14} className="text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t("upgradeFullInsights")}
              </span>
            </motion.button>
          )}
        </section>

        {/* 🆘 Support & Legal */}
        <section>
          <SectionHeader title={t("supportAndLegal")} />
          <div className="bg-card rounded-2xl shadow-card divide-y divide-border/30">
            <SettingsItem
              icon={HelpCircle}
              label={t("helpCenter")}
              desc={t("helpCenterDesc")}
              onClick={() => navigate("/help-center")}
            />
            <SettingsItem
              icon={MessageCircle}
              label={t("contactSupport")}
              desc={t("contactSupportDesc")}
              onClick={() => navigate("/contact-support")}
            />
            <SettingsItem
              icon={FileText}
              label={t("termsOfService")}
              onClick={() => navigate("/terms-of-service")}
            />
            <SettingsItem
              icon={ShieldCheck}
              label={t("privacyPolicy")}
              onClick={() => navigate("/privacy-policy")}
            />
          </div>
        </section>

        {/* 🌍 App Settings */}
        <section>
          <SectionHeader title={t("appSettings")} />
          <div className="bg-card rounded-2xl shadow-card divide-y divide-border/30">
            <SettingsItem
              icon={Globe}
              label={t("language")}
              desc={languageInfo.nativeLabel}
              trailing={
                <span className="text-xs text-muted-foreground font-medium mr-1">{languageInfo.shortCode}</span>
              }
              onClick={() => setLangPickerOpen(!langPickerOpen)}
            />

            {/* Language picker */}
            <AnimatePresence>
              {langPickerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-2 space-y-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangPickerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                          language === lang.code
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{lang.nativeLabel}</span>
                          <span className="text-xs text-muted-foreground">{lang.label}</span>
                        </div>
                        {language === lang.code && <Check size={16} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <SettingsItem
              icon={darkMode ? Moon : Sun}
              label={t("darkMode")}
              trailing={
                <Switch
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
                />
              }
              onClick={() => toggleDarkMode(!darkMode)}
            />
          </div>
        </section>
      </div>

      <PremiumSheet open={premiumOpen} onOpenChange={setPremiumOpen} />
    </div>
  );
}
