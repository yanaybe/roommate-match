import { useState, useEffect } from "react";
import { ArrowLeft, Phone, Mail, MessageCircle, Instagram, Facebook, ExternalLink, Send, Bug, Lightbulb, Star, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

function useContactMethods() {
  const { t } = useLanguage();
  return [
    { icon: Phone, label: t("contactPhone"), value: "+972 54-540-4192", href: "tel:+972545404192", color: "from-emerald-500 to-green-600" },
    { icon: Mail, label: t("contactEmail"), value: "support@roomatch.app", href: "mailto:support@roomatch.app", color: "from-blue-500 to-cyan-600" },
    { icon: Instagram, label: t("contactInstagram"), value: "@_roomatch_", href: "https://instagram.com/_roomatch_", color: "from-pink-500 to-purple-600" },
    { icon: Facebook, label: t("contactFacebook"), value: "_roomatch_", href: "https://facebook.com/_roomatch_", color: "from-blue-600 to-indigo-600" },
  ];
}

export default function ContactSupport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const contactMethods = useContactMethods();
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSentState] = useState(false);

  const categories = [
    { value: "bug", label: t("bugReport"), icon: Bug, color: "text-red-500 bg-red-500/10" },
    { value: "suggestion", label: t("suggestion"), icon: Lightbulb, color: "text-amber-500 bg-amber-500/10" },
    { value: "review", label: t("review"), icon: Star, color: "text-primary bg-primary/10" },
    { value: "general", label: t("general"), icon: MessageCircle, color: "text-muted-foreground bg-muted" },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error(t("pleaseWriteMessage")); return; }
    if (!user) { toast.error(t("pleaseLogIn")); return; }
    setSending(true);
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const { count: recentSupport } = await supabase
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneDayAgo);
    if ((recentSupport ?? 0) >= 5) {
      setSending(false);
      toast.error(t("tooManySupportMessages") || "You've sent too many messages today. Please try again tomorrow.");
      return;
    }
    const { error } = await supabase.from("support_messages").insert({ user_id: user.id, category, message: message.trim() });
    setSending(false);
    if (error) { toast.error(t("failedToSend")); }
    else { setSentState(true); setMessage(""); setTimeout(() => setSentState(false), 3000); toast.success(t("messageSent")); }
  };

  const getPlaceholder = () => {
    switch (category) {
      case "bug": return t("bugPlaceholder");
      case "suggestion": return t("suggestionPlaceholder");
      case "review": return t("reviewPlaceholder");
      default: return t("generalPlaceholder");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{t("contactSupportTitle")}</h1>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t("wereHereToHelp")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{t("contactHeroDesc")}</p>
        </motion.div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">{t("otherWaysToReach")}</h3>
          {contactMethods.map((method, i) => (
            <motion.a
              key={method.label}
              href={method.href}
              target={method.href.startsWith("http") ? "_blank" : undefined}
              rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center shrink-0 shadow-sm`}>
                <method.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{method.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{method.value}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </motion.a>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">{t("writeToUs")}</h3>

          <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getPlaceholder()}
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{message.length}/1000</span>
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div key="sent" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> {t("sent")}
                  </motion.div>
                ) : (
                  <motion.button key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleSubmit}
                    disabled={sending || !message.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
                    {sending ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? t("sending") : t("send")}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center">
          <p className="text-xs text-muted-foreground">{t("responseTime")}</p>
        </motion.div>
      </div>
    </div>
  );
}
