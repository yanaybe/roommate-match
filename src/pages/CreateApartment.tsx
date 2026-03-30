import { motion } from "framer-motion";
import { Users, Home, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

export default function CreateApartment() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const modes = [
    { icon: Search, title: t("findARoom"), desc: t("findARoomDesc"), color: "gradient-primary", path: "/" },
    { icon: Users, title: t("findRoommatesCreate"), desc: t("findRoommatesCreateDesc"), color: "bg-accent", path: "/post-apartment" },
    { icon: Home, title: t("startFresh"), desc: t("startFreshDesc"), color: "bg-foreground", path: "/create-squad" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">{t("create")}</h1>
          <p className="text-muted-foreground mb-8">{t("whatLookingFor")}</p>
        </motion.div>

        <div className="space-y-4">
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => mode.path && navigate(mode.path)}
                className="w-full flex items-center gap-4 p-5 bg-card rounded-2xl shadow-card hover:shadow-elevated transition-shadow text-left"
              >
                <div className={`${mode.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-card-foreground">{mode.title}</h3>
                  <p className="text-muted-foreground text-sm">{mode.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
