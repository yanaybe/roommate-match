import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Users, MapPin, Shield, Sparkles, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/hooks/useLanguage";
import { analytics } from "@/lib/analytics";
const cities = ["Tel Aviv", "Jerusalem", "Haifa", "Beer Sheva", "Netanya", "Herzliya", "Ramat Gan", "Petah Tikva"];
const steps = [0, 1, 2, 3];

export default function CreateSquad() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [targetSize, setTargetSize] = useState(3);
  const [budgetMin, setBudgetMin] = useState(2000);
  const [budgetMax, setBudgetMax] = useState(5000);
  const [locations, setLocations] = useState<string[]>([]);
  const [noSmoking, setNoSmoking] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [minCleanliness, setMinCleanliness] = useState(3);

  const toggleLocation = (city: string) => {
    setLocations((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) { toast.error(t("pleaseSignIn")); navigate("/auth"); return; }
    setSaving(true);

    const { data: squad, error } = await supabase
      .from("squads")
      .insert({
        creator_id: user.id,
        name: name.trim(),
        target_size: targetSize,
        budget_min: budgetMin,
        budget_max: budgetMax,
        preferred_locations: locations,
        status: "draft",
        no_smoking: noSmoking,
        pet_friendly: petFriendly,
        min_cleanliness: minCleanliness,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create squad");
      setSaving(false);
      return;
    }

    // Add creator as first member
    await supabase.from("squad_members").insert({
      squad_id: squad.id,
      user_id: user.id,
      status: "joined",
      role: "leader",
    });

    analytics.squadCreate();
    toast.success("Squad created! Start finding roommates 🚀");
    navigate(`/squad/${squad.id}`);
  };

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Sticky header + progress */}
      <div className="shrink-0 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-2 flex items-center gap-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/create")} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-foreground">{t("createSquad")}</h1>
            <p className="text-muted-foreground text-xs">{t("step")} {step + 1} / {steps.length}</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? "gradient-primary" : "bg-secondary"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="max-w-lg mx-auto px-4 py-5">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="info" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="space-y-6">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("nameYourSquad")}</h2>
                  <p className="text-muted-foreground text-sm">{t("squadNameDesc")}</p>
                </div>

                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., TLV Dream Team 🏠"
                  className="text-center text-lg h-14 rounded-2xl border-2 focus:border-primary"
                  maxLength={40}
                />

                <div>
                  <label className="text-sm font-semibold text-foreground mb-3 block">{t("howManyRoommates")}</label>
                  <div className="flex gap-3 justify-center">
                    {[2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setTargetSize(n)}
                        className={`w-14 h-14 rounded-2xl font-bold text-lg transition-all ${
                          targetSize === n
                            ? "gradient-primary text-primary-foreground shadow-elevated scale-110"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-muted-foreground text-xs mt-2">{t("includingYou")}</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="budget" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("budgetRange")}</h2>
                  <p className="text-muted-foreground text-sm">{t("perPersonBudget")}</p>
                </div>

                <div className="bg-card rounded-2xl shadow-card p-6">
                  <div className="flex justify-between mb-4">
                    <span className="text-muted-foreground text-sm">{t("min")}</span>
                    <span className="font-bold text-foreground">₪{budgetMin.toLocaleString()}</span>
                  </div>
                  <Slider
                    value={[budgetMin]}
                    onValueChange={(v) => setBudgetMin(Math.min(v[0], budgetMax - 500))}
                    min={500}
                    max={10000}
                    step={250}
                    className="mb-6"
                  />

                  <div className="flex justify-between mb-4">
                    <span className="text-muted-foreground text-sm">{t("max")}</span>
                    <span className="font-bold text-foreground">₪{budgetMax.toLocaleString()}</span>
                  </div>
                  <Slider
                    value={[budgetMax]}
                    onValueChange={(v) => setBudgetMax(Math.max(v[0], budgetMin + 500))}
                    min={500}
                    max={10000}
                    step={250}
                  />

                  <div className="mt-4 p-3 bg-secondary rounded-xl text-center">
                    <span className="text-sm text-muted-foreground">{t("totalGroupBudget")} </span>
                    <span className="font-bold text-foreground">₪{(budgetMin * targetSize).toLocaleString()} – ₪{(budgetMax * targetSize).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="location" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("preferredLocations")}</h2>
                  <p className="text-muted-foreground text-sm">{t("whereWantToLive")}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => toggleLocation(city)}
                      className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-medium transition-all ${
                        locations.includes(city)
                          ? "gradient-primary text-primary-foreground shadow-card"
                          : "bg-card text-card-foreground shadow-card hover:shadow-elevated"
                      }`}
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      {city}
                    </button>
                  ))}
                </div>

                {locations.length === 0 && (
                  <p className="text-center text-muted-foreground text-xs">{t("skipAllLocations")}</p>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="filters" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("mustHaveFilters")}</h2>
                  <p className="text-muted-foreground text-sm">{t("setDealbreakers")}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setNoSmoking(!noSmoking)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      noSmoking ? "gradient-primary text-primary-foreground" : "bg-card text-card-foreground shadow-card"
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-sm">{t("nonSmokersOnly")}</h3>
                      <p className={`text-xs ${noSmoking ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t("noSmokingApt")}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${noSmoking ? "border-primary-foreground bg-primary-foreground/20" : "border-border"}`}>
                      {noSmoking && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setPetFriendly(!petFriendly)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      petFriendly ? "gradient-primary text-primary-foreground" : "bg-card text-card-foreground shadow-card"
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-sm">{t("petFriendlyFilter")}</h3>
                      <p className={`text-xs ${petFriendly ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t("petsWelcomeApt")}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${petFriendly ? "border-primary-foreground bg-primary-foreground/20" : "border-border"}`}>
                      {petFriendly && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                    </div>
                  </button>
                </div>

                <div className="bg-card rounded-2xl shadow-card p-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">{t("minimumCleanliness")}</span>
                    <span className="text-sm font-bold text-primary">{minCleanliness}/5</span>
                  </div>
                  <Slider
                    value={[minCleanliness]}
                    onValueChange={(v) => setMinCleanliness(v[0])}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{t("relaxed")}</span>
                    <span className="text-xs text-muted-foreground">{t("spotless")}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>

      {/* Sticky footer navigation */}
      <div className="shrink-0 bg-background/95 backdrop-blur-sm border-t border-border pb-16 desk:pb-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 gradient-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {t("continueBtn")} <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || !canProceed()}
              className="flex-1 gradient-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? t("creating") : t("createSquadBtn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
