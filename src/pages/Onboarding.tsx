import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const STEPS = ["Basic Info", "Living Habits", "Lifestyle", "Personality", "Roommate Preferences"];

const sleepOptions = ["Early bird", "Night owl", "Flexible"];
const roomTypeOptions = ["Private", "Shared OK", "Either"];
const cookingOptions = ["Daily", "Sometimes", "Rarely", "Never"];
const sharedSpaceOptions = ["Very organized", "Moderate", "Relaxed"];
const religiousOptions = ["Very religious", "Traditional", "Somewhat", "Not religious"];
const alcoholOptions = ["Never", "Socially", "Often"];
const fitnessOptions = ["Daily", "Often", "Sometimes", "Rarely"];
const guestsOptions = ["Frequently", "Occasionally", "Rarely", "Never"];
const partyingOptions = ["Frequently", "Occasionally", "Rarely", "Never"];
const vibeOptions = ["Chill & quiet", "Balanced", "Social & active", "Party lover"];
const genderPrefOptions = ["No preference", "Male", "Female", "Mixed"];
const similarityOptions = ["Very similar", "Somewhat similar", "No preference"];
const activityOptions = ["Morning (6-12)", "Afternoon (12-18)", "Evening (18-24)", "Night (24-6)", "Flexible"];

interface FormData {
  name: string;
  age: string;
  city: string;
  occupation: string;
  budget: string;
  desired_room_type: string;
  sleep_schedule: string;
  cleanliness: number;
  cooking_habits: string;
  shared_space_org: string;
  smoking: boolean;
  religious_level: string;
  alcohol: string;
  pets: boolean;
  fitness: string;
  wfh: boolean;
  guests: string;
  social_level: number;
  noise_level: number;
  partying: string;
  lifestyle_vibe: string;
  preferred_age_min: string;
  preferred_age_max: string;
  gender_preference: string;
  lifestyle_similarity: string;
  cleanliness_expectations: number;
  activity_hours: string;
  bio: string;
}

const initial: FormData = {
  name: "", age: "", city: "", occupation: "", budget: "", desired_room_type: "Private",
  sleep_schedule: "Flexible", cleanliness: 3, cooking_habits: "Sometimes", shared_space_org: "Moderate",
  smoking: false, religious_level: "Not religious", alcohol: "Socially", pets: false,
  fitness: "Sometimes", wfh: false, guests: "Occasionally",
  social_level: 3, noise_level: 3, partying: "Occasionally", lifestyle_vibe: "Balanced",
  preferred_age_min: "18", preferred_age_max: "40", gender_preference: "No preference",
  lifestyle_similarity: "Somewhat similar", cleanliness_expectations: 3, activity_hours: "Flexible",
  bio: "",
};

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        selected ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function SliderField({ label, value, onChange, min = 1, max = 5, labels }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; labels?: string[];
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground block mb-2">{label}</label>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        {labels ? labels.map((l, i) => <span key={i}>{l}</span>) : Array.from({ length: max - min + 1 }, (_, i) => <span key={i}>{min + i}</span>)}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        value ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {value && <Check className="w-4 h-4" />}
      {label}
    </button>
  );
}

export default function Onboarding() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && profile) {
      setForm({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        city: profile.city || "",
        occupation: profile.occupation || "",
        budget: profile.budget?.toString() || "",
        desired_room_type: profile.desired_room_type || "Private",
        sleep_schedule: profile.sleep_schedule || "Flexible",
        cleanliness: profile.cleanliness ?? 3,
        cooking_habits: profile.cooking_habits || "Sometimes",
        shared_space_org: profile.shared_space_org || "Moderate",
        smoking: profile.smoking ?? false,
        religious_level: profile.religious_level || "Not religious",
        alcohol: profile.alcohol || "Socially",
        pets: profile.pets ?? false,
        fitness: profile.fitness || "Sometimes",
        wfh: profile.wfh ?? false,
        guests: profile.guests || "Occasionally",
        social_level: profile.social_level ?? 3,
        noise_level: profile.noise_level ?? 3,
        partying: profile.partying || "Occasionally",
        lifestyle_vibe: profile.lifestyle_vibe || "Balanced",
        preferred_age_min: profile.preferred_age_min?.toString() || "18",
        preferred_age_max: profile.preferred_age_max?.toString() || "40",
        gender_preference: profile.gender_preference || "No preference",
        lifestyle_similarity: profile.lifestyle_similarity || "Somewhat similar",
        cleanliness_expectations: profile.cleanliness_expectations ?? 3,
        activity_hours: profile.activity_hours || "Flexible",
        bio: profile.bio || "",
      });
    }
  }, [isEdit, profile]);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const canProceed = () => {
    if (step === 0) return form.name.trim() && form.age && form.city.trim() && form.occupation.trim() && form.budget;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      age: parseInt(form.age) || null,
      city: form.city.trim(),
      occupation: form.occupation.trim(),
      budget: parseInt(form.budget) || 0,
      desired_room_type: form.desired_room_type,
      sleep_schedule: form.sleep_schedule,
      cleanliness: form.cleanliness,
      cooking_habits: form.cooking_habits,
      shared_space_org: form.shared_space_org,
      smoking: form.smoking,
      religious_level: form.religious_level,
      alcohol: form.alcohol,
      pets: form.pets,
      fitness: form.fitness,
      wfh: form.wfh,
      guests: form.guests,
      social_level: form.social_level,
      noise_level: form.noise_level,
      partying: form.partying,
      lifestyle_vibe: form.lifestyle_vibe,
      preferred_age_min: parseInt(form.preferred_age_min) || 18,
      preferred_age_max: parseInt(form.preferred_age_max) || 40,
      gender_preference: form.gender_preference,
      lifestyle_similarity: form.lifestyle_similarity,
      cleanliness_expectations: form.cleanliness_expectations,
      activity_hours: form.activity_hours,
      bio: form.bio.trim(),
      onboarding_complete: true,
    };

    let error;
    if (isEdit) {
      const res = await supabase.from("profiles").update(payload).eq("user_id", user.id);
      error = res.error;
    } else {
      const res = await supabase.from("profiles").insert(payload);
      error = res.error;
    }
    setSaving(false);
    if (error) {
      toast.error("Failed to save profile: " + error.message);
    } else {
      toast.success(isEdit ? "Preferences updated! ✨" : "Profile created! Welcome to Roomatch 🎉");
      navigate(isEdit ? "/profile" : "/", { replace: true });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Name</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Age</label>
                <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="25" className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">City</label>
                <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Tel Aviv" className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Work / Studies</label>
              <input value={form.occupation} onChange={(e) => update("occupation", e.target.value)} placeholder="Software Engineer" className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Monthly rent budget (₪)</label>
              <input type="number" value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="3500" className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Desired room type</label>
              <div className="flex flex-wrap gap-2">
                {roomTypeOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.desired_room_type === o} onClick={() => update("desired_room_type", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Bio</label>
              <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell others about yourself..." rows={3} maxLength={200} className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Sleep schedule</label>
              <div className="flex flex-wrap gap-2">
                {sleepOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.sleep_schedule === o} onClick={() => update("sleep_schedule", o)} />
                ))}
              </div>
            </div>
            <SliderField label="Cleanliness level" value={form.cleanliness} onChange={(v) => update("cleanliness", v)} labels={["Messy", "", "Average", "", "Spotless"]} />
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Cooking habits</label>
              <div className="flex flex-wrap gap-2">
                {cookingOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.cooking_habits === o} onClick={() => update("cooking_habits", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Shared space organization</label>
              <div className="flex flex-wrap gap-2">
                {sharedSpaceOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.shared_space_org === o} onClick={() => update("shared_space_org", o)} />
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Toggle label="🚬 Smoking" value={form.smoking} onChange={(v) => update("smoking", v)} />
              <Toggle label="🐾 Pets" value={form.pets} onChange={(v) => update("pets", v)} />
              <Toggle label="🏠 Work from home" value={form.wfh} onChange={(v) => update("wfh", v)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Religious level</label>
              <div className="flex flex-wrap gap-2">
                {religiousOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.religious_level === o} onClick={() => update("religious_level", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Alcohol</label>
              <div className="flex flex-wrap gap-2">
                {alcoholOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.alcohol === o} onClick={() => update("alcohol", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Fitness</label>
              <div className="flex flex-wrap gap-2">
                {fitnessOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.fitness === o} onClick={() => update("fitness", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Guests</label>
              <div className="flex flex-wrap gap-2">
                {guestsOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.guests === o} onClick={() => update("guests", o)} />
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <SliderField label="Social vs Private" value={form.social_level} onChange={(v) => update("social_level", v)} labels={["Very private", "", "Balanced", "", "Very social"]} />
            <SliderField label="Noise level" value={form.noise_level} onChange={(v) => update("noise_level", v)} labels={["Silent", "", "Moderate", "", "Loud"]} />
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Partying / Events</label>
              <div className="flex flex-wrap gap-2">
                {partyingOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.partying === o} onClick={() => update("partying", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">General lifestyle vibe</label>
              <div className="flex flex-wrap gap-2">
                {vibeOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.lifestyle_vibe === o} onClick={() => update("lifestyle_vibe", o)} />
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Min age</label>
                <input type="number" value={form.preferred_age_min} onChange={(e) => update("preferred_age_min", e.target.value)} className="w-full bg-secondary text-secondary-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Max age</label>
                <input type="number" value={form.preferred_age_max} onChange={(e) => update("preferred_age_max", e.target.value)} className="w-full bg-secondary text-secondary-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Gender preference</label>
              <div className="flex flex-wrap gap-2">
                {genderPrefOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.gender_preference === o} onClick={() => update("gender_preference", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Lifestyle similarity</label>
              <div className="flex flex-wrap gap-2">
                {similarityOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.lifestyle_similarity === o} onClick={() => update("lifestyle_similarity", o)} />
                ))}
              </div>
            </div>
            <SliderField label="Cleanliness expectations" value={form.cleanliness_expectations} onChange={(v) => update("cleanliness_expectations", v)} labels={["Relaxed", "", "Moderate", "", "Strict"]} />
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Preferred activity hours</label>
              <div className="flex flex-wrap gap-2">
                {activityOptions.map((o) => (
                  <OptionButton key={o} label={o} selected={form.activity_hours === o} onClick={() => update("activity_hours", o)} />
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-12 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">
            Set up your <span className="text-primary">profile</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "gradient-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-5 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < STEPS.length - 1) setStep(step + 1);
              else handleSubmit();
            }}
            disabled={!canProceed() || saving}
            className="flex-1 flex items-center justify-center gap-1 py-3 gradient-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-40"
          >
            {step < STEPS.length - 1 ? (
              <>Next <ArrowRight className="w-4 h-4" /></>
            ) : saving ? "Saving..." : (
              <>Complete <Check className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
