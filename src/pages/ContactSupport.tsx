import { ArrowLeft, Phone, Mail, MessageCircle, Instagram, Facebook, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const contactMethods = [
  {
    icon: Phone,
    label: "Phone",
    value: "+972 54-540-4192",
    href: "tel:+972545404192",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: Mail,
    label: "Email",
    value: "support@roomatch.app",
    href: "mailto:support@roomatch.app",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@_roomatch_",
    href: "https://instagram.com/_roomatch_",
    color: "from-pink-500 to-purple-600",
  },
  {
    icon: Facebook,
    label: "Facebook",
    value: "_roomatch_",
    href: "https://facebook.com/_roomatch_",
    color: "from-blue-600 to-indigo-600",
  },
];

export default function ContactSupport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Contact Support</h1>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 pt-2"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">We're here to help</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Have a question, feedback, or need assistance? Reach out to us through any of the channels below.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="space-y-3">
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

        {/* Response time note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground">
            We typically respond within 24 hours 💬
          </p>
        </motion.div>
      </div>
    </div>
  );
}
