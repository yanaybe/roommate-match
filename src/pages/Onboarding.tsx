import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Cigarette, PawPrint, Home } from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/useLanguage";
import { analytics } from "@/lib/analytics";
import { sanitizeText, isSafeImageUrl } from "@/lib/security";

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
const smokingPrefOptions = ["I smoke", "Non-smoker, okay with smokers", "Non-smoker, prefer no smoking"];
const petPrefOptions = ["I have pets", "No pets, but okay with them", "Prefer no pets"];

interface FormData {
  name: string;
  age: string;
  city: string;
  neighborhood: string;
  occupation: string;
  budget: string;
  move_in_date: string;
  desired_room_type: string;
  sleep_schedule: string;
  cleanliness: number;
  cooking_habits: string;
  shared_space_org: string;
  smoking: boolean;
  smoking_preference: string;
  religious_level: string;
  alcohol: string;
  pets: boolean;
  pet_preference: string;
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
  photos: string[];
}

const initial: FormData = {
  name: "", age: "", city: "", neighborhood: "", occupation: "", budget: "", move_in_date: "", desired_room_type: "Private",
  sleep_schedule: "Flexible", cleanliness: 3, cooking_habits: "Sometimes", shared_space_org: "Moderate",
  smoking: false, smoking_preference: "Non-smoker, okay with smokers",
  religious_level: "Not religious", alcohol: "Socially",
  pets: false, pet_preference: "No pets, but okay with them",
  fitness: "Sometimes", wfh: false, guests: "Occasionally",
  social_level: 3, noise_level: 3, partying: "Occasionally", lifestyle_vibe: "Balanced",
  preferred_age_min: "18", preferred_age_max: "40", gender_preference: "No preference",
  lifestyle_similarity: "Somewhat similar", cleanliness_expectations: 3, activity_hours: "Flexible",
  bio: "", photos: [],
};

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        selected ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
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
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(v) => onChange(v[0])}
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        {labels ? labels.map((l, i) => <span key={i}>{l}</span>) : Array.from({ length: max - min + 1 }, (_, i) => <span key={i}>{min + i}</span>)}
      </div>
    </div>
  );
}

type Errors = Partial<Record<keyof FormData | "preferred_age_max" | "preferred_age_min", string>>;

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-destructive text-xs mt-1 font-medium">{msg}</p>;
}

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const { profile, refetch } = useProfile();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const [step, setStep] = useState(0);
  const [substep, setSubstep] = useState(0);
  const [form, setForm] = useState<FormData>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  // Tracks whether user explicitly confirmed proceeding without photos in the dialog.
  // Using a ref so handleSubmit sees the updated value synchronously.
  const photoConfirmedRef = useRef(false);

  const STEPS = [t("stepBasicInfo"), t("stepLivingHabits"), t("stepLifestyle"), t("stepPersonality"), t("stepPreferences"), t("stepPhotos")];

  // Map English option values → translated display text
  const optMap: Record<string, string> = {
    "Early bird": t("optEarlyBird"), "Night owl": t("optNightOwl"), "Flexible": t("optFlexible"),
    "Private": t("optPrivate"), "Shared OK": t("optSharedOk"), "Either": t("optEither"),
    "Daily": t("optDaily"), "Sometimes": t("optSometimes"), "Rarely": t("optRarely"), "Never": t("optNever"),
    "Very organized": t("optVeryOrganized"), "Moderate": t("optModerate"), "Relaxed": t("relaxed"),
    "Very religious": t("optVeryReligious"), "Traditional": t("optTraditional"),
    "Somewhat": t("optSomewhat"), "Not religious": t("optNotReligious"),
    "Socially": t("optSocially"), "Often": t("optOften"),
    "Frequently": t("optFrequently"), "Occasionally": t("optOccasionally"),
    "Chill & quiet": t("optChillQuiet"), "Balanced": t("optBalanced"),
    "Social & active": t("optSocialActive"), "Party lover": t("optPartyLover"),
    "No preference": t("optNoPreference"), "Male": t("optMale"), "Female": t("optFemale"), "Mixed": t("optMixed"),
    "Very similar": t("optVerySimilar"), "Somewhat similar": t("optSomewhatSimilar"),
    "Morning (6-12)": t("optMorning"), "Afternoon (12-18)": t("optAfternoon"),
    "Evening (18-24)": t("optEvening"), "Night (24-6)": t("optNight"),
    "I smoke": t("optISmoke"), "Non-smoker, okay with smokers": t("optNonSmokerOk"),
    "Non-smoker, prefer no smoking": t("optNonSmokerPreferNo"),
    "I have pets": t("optHasPets"), "No pets, but okay with them": t("optNoPetsOk"),
    "Prefer no pets": t("optPreferNoPets"),
  };
  const to = (val: string) => optMap[val] ?? val;

  // Quick move-in chips instead of the native month picker (which rendered
  // raw "----" chrome and produced YYYY-MM values a `date` column rejects).
  const monthStart = (offset: number) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  };
  const moveInOptions = [
    { key: "asap", label: t("moveInAsap"), value: monthStart(0) },
    { key: "next", label: t("moveInNextMonth"), value: monthStart(1) },
    { key: "later", label: t("moveInFewMonths"), value: monthStart(2) },
  ];

  // Guard: redirect unverified users to verify-email, unauthenticated to auth
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!user.email_confirmed_at) {
      toast(t("pleaseVerifyEmailFirst"), {
        description: t("verifyEmailBeforeProfile"),
      });
      navigate("/verify-email", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  // Guard: users who already completed onboarding shouldn't land here except
  // in explicit edit mode (?edit=true) — send them home instead.
  useEffect(() => {
    if (!isEdit && profile?.onboarding_complete) {
      navigate("/", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.onboarding_complete, isEdit]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        city: profile.city || "",
        neighborhood: profile.neighborhood || "",
        occupation: profile.occupation || "",
        budget: profile.budget?.toString() || "",
        move_in_date: profile.move_in_date || "",
        desired_room_type: profile.desired_room_type || "Private",
        sleep_schedule: profile.sleep_schedule || "Flexible",
        cleanliness: profile.cleanliness ?? 3,
        cooking_habits: profile.cooking_habits || "Sometimes",
        shared_space_org: profile.shared_space_org || "Moderate",
        smoking: profile.smoking ?? false,
        smoking_preference: profile.smoking_preference || "Non-smoker, okay with smokers",
        religious_level: profile.religious_level || "Not religious",
        alcohol: profile.alcohol || "Socially",
        pets: profile.pets ?? false,
        pet_preference: profile.pet_preference || "No pets, but okay with them",
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
        photos: profile.photos || [],
      });
    }
  }, [profile]);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep = (): Errors => {
    const e: Errors = {};
    if (step === 0) {
      const name = form.name.trim();
      if (!name) {
        e.name = t("nameRequired");
      } else if (name.length < 2) {
        e.name = t("nameMin2");
      } else if (name.length > 50) {
        e.name = t("nameMax50");
      } else if (!/^[\p{L}\s''-]+$/u.test(name)) {
        e.name = t("nameLettersOnly");
      }

      const age = Number(form.age);
      if (!form.age.trim()) {
        e.age = t("ageRequired");
      } else if (!Number.isInteger(age) || age < 18 || age > 100) {
        e.age = t("ageBetween18and100");
      }

      const city = form.city.trim();
      if (!city) {
        e.city = t("cityRequired");
      } else if (city.length < 2) {
        e.city = t("validCityName");
      } else if (/\d/.test(city)) {
        e.city = t("cityNoNumbers");
      }

      const occ = form.occupation.trim();
      if (!occ) {
        e.occupation = t("occupationRequired");
      } else if (occ.length < 2) {
        e.occupation = t("atLeast2Chars");
      }

      const budget = Number(form.budget);
      if (form.budget.trim() && (isNaN(budget) || budget < 500)) {
        e.budget = t("budgetMin500");
      } else if (form.budget.trim() && budget > 100000) {
        e.budget = t("budgetMax100k");
      }
    }

    if (step === 1) {
      if (!form.sleep_schedule) e.sleep_schedule = "Please select a sleep schedule";
      if (!form.cleanliness) e.cleanliness = "Please set your cleanliness level";
      if (!form.cooking_habits) e.cooking_habits = "Please select your cooking habits";
    }

    if (step === 2) {
      if (!form.smoking_preference) e.smoking_preference = "Please select a smoking preference";
      if (!form.pet_preference) e.pet_preference = "Please select a pet preference";
    }

    if (step === 3) {
      if (form.social_level == null) e.social_level = "Please set your social level";
      if (form.noise_level == null) e.noise_level = "Please set your noise level";
    }

    if (step === 4) {
      const minAge = Number(form.preferred_age_min);
      const maxAge = Number(form.preferred_age_max);
      if (!Number.isInteger(minAge) || minAge < 18 || minAge > 100) {
        e.preferred_age_min = t("ageBetween18and100");
      }
      if (!Number.isInteger(maxAge) || maxAge < 18 || maxAge > 100) {
        e.preferred_age_max = t("ageBetween18and100");
      }
      if (!e.preferred_age_min && !e.preferred_age_max && minAge >= maxAge) {
        e.preferred_age_max = t("maxAgeGreaterThanMin");
      }
    }

    return e;
  };

  const canProceed = () => {
    if (step === 0) return !!(form.name.trim() && form.age && form.city.trim() && form.occupation.trim() && form.budget);
    // Photos are optional — the no-photos confirmation dialog handles the nudge.
    return true;
  };

  // Save partial progress so users can resume after leaving mid-flow
  const saveProgress = async (currentForm: FormData) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      // NOT NULL columns use undefined (= leave untouched on upsert) when empty
      name: sanitizeText(currentForm.name) || undefined,
      age: parseInt(currentForm.age) || null,
      city: sanitizeText(currentForm.city) || undefined,
      neighborhood: sanitizeText(currentForm.neighborhood) || undefined,
      occupation: sanitizeText(currentForm.occupation) || undefined,
      budget: currentForm.budget?.trim() ? parseInt(currentForm.budget) : undefined,
      move_in_date: currentForm.move_in_date || null,
      desired_room_type: currentForm.desired_room_type,
      sleep_schedule: currentForm.sleep_schedule,
      cleanliness: currentForm.cleanliness,
      cooking_habits: currentForm.cooking_habits,
      shared_space_org: currentForm.shared_space_org,
      smoking: currentForm.smoking_preference === "I smoke",
      religious_level: currentForm.religious_level,
      alcohol: currentForm.alcohol,
      pets: currentForm.pet_preference === "I have pets",
      fitness: currentForm.fitness,
      wfh: currentForm.wfh,
      guests: currentForm.guests,
      social_level: currentForm.social_level,
      noise_level: currentForm.noise_level,
      partying: currentForm.partying,
      lifestyle_vibe: currentForm.lifestyle_vibe,
      preferred_age_min: parseInt(currentForm.preferred_age_min) || 18,
      preferred_age_max: parseInt(currentForm.preferred_age_max) || 40,
      gender_preference: currentForm.gender_preference,
      lifestyle_similarity: currentForm.lifestyle_similarity,
      cleanliness_expectations: currentForm.cleanliness_expectations,
      activity_hours: currentForm.activity_hours,
      bio: currentForm.bio,
      avatar_url: currentForm.photos[0] || null,
      photos: currentForm.photos,
    };
    await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Require at least one photo — show confirmation dialog if none.
    // Only bypassed when the user explicitly confirms in the dialog (photoConfirmedRef).
    if (form.photos.length === 0 && !photoConfirmedRef.current) {
      setPhotosDialogOpen(true);
      return;
    }
    photoConfirmedRef.current = false; // reset after use

    // Sanitize all free-text inputs (strip control chars, bidi overrides, null bytes)
    const safeName       = sanitizeText(form.name);
    const safeCity       = sanitizeText(form.city);
    const safeOccupation = sanitizeText(form.occupation);
    const safeBio        = sanitizeText(form.bio);

    const ageNum    = parseInt(form.age);
    const budgetNum = form.budget?.trim() ? parseInt(form.budget) : null;
    // Clamp preferred ages to valid range regardless of what was typed
    const minAge = Math.max(18, Math.min(100, parseInt(form.preferred_age_min) || 18));
    const maxAge = Math.max(minAge + 1, Math.min(100, parseInt(form.preferred_age_max) || 40));

    if (safeName.length < 2) {
      toast.error(t("nameMin2"));
      return;
    }
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      toast.error(t("validAge"));
      return;
    }
    if (budgetNum === null || isNaN(budgetNum) || budgetNum < 500) {
      toast.error(t("validBudget"));
      return;
    }

    // Validate avatar URL is safe (https only, no javascript: / data: URIs)
    const avatarUrl = form.photos[0] || null;
    if (avatarUrl && !isSafeImageUrl(avatarUrl)) {
      toast.error(t("invalidPhotoUrl"));
      return;
    }

    setSaving(true);
    const payload = {
      user_id: user.id,
      name: safeName,
      age: ageNum,
      city: safeCity,
      neighborhood: sanitizeText(form.neighborhood),
      occupation: safeOccupation,
      budget: budgetNum!,
      desired_room_type: form.desired_room_type,
      sleep_schedule: form.sleep_schedule,
      cleanliness: form.cleanliness,
      cooking_habits: form.cooking_habits,
      shared_space_org: form.shared_space_org,
      smoking: form.smoking_preference === "I smoke",
      religious_level: form.religious_level,
      alcohol: form.alcohol,
      pets: form.pet_preference === "I have pets",
      fitness: form.fitness,
      wfh: form.wfh,
      guests: form.guests,
      social_level: form.social_level,
      noise_level: form.noise_level,
      partying: form.partying,
      lifestyle_vibe: form.lifestyle_vibe,
      preferred_age_min: minAge,
      preferred_age_max: maxAge,
      gender_preference: form.gender_preference,
      lifestyle_similarity: form.lifestyle_similarity,
      cleanliness_expectations: form.cleanliness_expectations,
      activity_hours: form.activity_hours,
      bio: safeBio,
      move_in_date: form.move_in_date || null,
      onboarding_complete: true,
      avatar_url: avatarUrl,
      photos: form.photos,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Failed to save profile. Please try again.");
    } else {
      toast.success(isEdit ? t("preferencesUpdated") : t("profileCreated"));
      if (!isEdit) {
        analytics.onboardingComplete();
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("city", form.city)
          .eq("onboarding_complete", true)
          .neq("user_id", user.id);
        navigate(`/welcome?city=${encodeURIComponent(form.city)}&count=${count ?? 0}&name=${encodeURIComponent(form.name.trim().split(" ")[0])}`, { replace: true });
      } else {
        await refetch();
        navigate("/profile", { replace: true });
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("nameLbl")}</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder={t("yourNamePlaceholder")}
                maxLength={50}
                className={`w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.name ? "ring-2 ring-destructive" : ""}`}
              />
              <ErrorMsg msg={errors.name} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">{t("ageLbl")}</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="25"
                  min="18"
                  max="100"
                  className={`w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.age ? "ring-2 ring-destructive" : ""}`}
                />
                <ErrorMsg msg={errors.age} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">{t("cityLbl")}</label>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Tel Aviv"
                  maxLength={50}
                  className={`w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.city ? "ring-2 ring-destructive" : ""}`}
                />
                <ErrorMsg msg={errors.city} />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("neighborhoodLbl")} <span className="text-muted-foreground font-normal">({t("optional")})</span></label>
              <input
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                placeholder="e.g. Florentin, Neve Tzedek"
                maxLength={80}
                className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("workStudies")}</label>
              <input
                value={form.occupation}
                onChange={(e) => update("occupation", e.target.value)}
                placeholder="Software Engineer"
                maxLength={80}
                className={`w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.occupation ? "ring-2 ring-destructive" : ""}`}
              />
              <ErrorMsg msg={errors.occupation} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("monthlyBudget")}</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
                placeholder="3500"
                min="500"
                max="100000"
                className={`w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.budget ? "ring-2 ring-destructive" : ""}`}
              />
              <ErrorMsg msg={errors.budget} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">
                {t("moveInLabel")}
              </label>
              <div className="flex flex-wrap gap-2">
                {moveInOptions.map((o) => (
                  <OptionButton
                    key={o.key}
                    label={o.label}
                    selected={form.move_in_date === o.value}
                    onClick={() => update("move_in_date", form.move_in_date === o.value ? "" : o.value)}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("moveInOptional")}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("desiredRoomType")}</label>
              <div className="flex flex-wrap gap-2">
                {roomTypeOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.desired_room_type === o} onClick={() => update("desired_room_type", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("bioLbl")}</label>
              <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder={t("bioPlaceholder")} rows={3} maxLength={200} className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/200</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("sleepScheduleLabel")}</label>
              <div className="flex flex-wrap gap-2">
                {sleepOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.sleep_schedule === o} onClick={() => update("sleep_schedule", o)} />
                ))}
              </div>
              <ErrorMsg msg={errors.sleep_schedule} />
            </div>
            <SliderField label={t("cleanlinessLevel")} value={form.cleanliness} onChange={(v) => update("cleanliness", v)} labels={[t("sliderMessy"), "", t("sliderAverage"), "", t("spotless")]} />
            <ErrorMsg msg={errors.cleanliness as string | undefined} />
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("cookingHabitsLbl")}</label>
              <div className="flex flex-wrap gap-2">
                {cookingOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.cooking_habits === o} onClick={() => update("cooking_habits", o)} />
                ))}
              </div>
              <ErrorMsg msg={errors.cooking_habits as string | undefined} />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("sharedSpaceOrgLbl")}</label>
              <div className="flex flex-wrap gap-2">
                {sharedSpaceOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.shared_space_org === o} onClick={() => update("shared_space_org", o)} />
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return substep === 0 ? (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground -mt-1">{t("dealBreakers")}</p>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1.5"><Cigarette className="w-4 h-4 text-muted-foreground" /> {t("smoking")}</label>
              <div className="flex flex-wrap gap-2">
                {smokingPrefOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.smoking_preference === o} onClick={() => update("smoking_preference", o)} />
                ))}
              </div>
              <ErrorMsg msg={errors.smoking_preference as string | undefined} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1.5"><PawPrint className="w-4 h-4 text-muted-foreground" /> {t("pets")}</label>
              <div className="flex flex-wrap gap-2">
                {petPrefOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.pet_preference === o} onClick={() => update("pet_preference", o)} />
                ))}
              </div>
              <ErrorMsg msg={errors.pet_preference as string | undefined} />
            </div>
            <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
              <label htmlFor="wfh-switch" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Home className="w-4 h-4 text-muted-foreground" /> {t("workFromHome")}
              </label>
              <Switch id="wfh-switch" checked={form.wfh} onCheckedChange={(v) => update("wfh", v)} />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground -mt-1">{t("lifestyleDetails")}</p>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("religiousLevel")}</label>
              <div className="flex flex-wrap gap-2">
                {religiousOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.religious_level === o} onClick={() => update("religious_level", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("alcohol")}</label>
              <div className="flex flex-wrap gap-2">
                {alcoholOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.alcohol === o} onClick={() => update("alcohol", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("fitness")}</label>
              <div className="flex flex-wrap gap-2">
                {fitnessOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.fitness === o} onClick={() => update("fitness", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("guests")}</label>
              <div className="flex flex-wrap gap-2">
                {guestsOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.guests === o} onClick={() => update("guests", o)} />
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <SliderField label={t("socialVsPrivate")} value={form.social_level} onChange={(v) => update("social_level", v)} labels={[t("sliderVeryPrivate"), "", t("sliderBalanced"), "", t("sliderVerySocial")]} />
            <ErrorMsg msg={errors.social_level as string | undefined} />
            <SliderField label={t("noiseLevelLabel")} value={form.noise_level} onChange={(v) => update("noise_level", v)} labels={[t("sliderSilent"), "", t("sliderModerate"), "", t("sliderLoud")]} />
            <ErrorMsg msg={errors.noise_level as string | undefined} />
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("partyingEventsLbl")}</label>
              <div className="flex flex-wrap gap-2">
                {partyingOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.partying === o} onClick={() => update("partying", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("generalVibeLbl")}</label>
              <div className="flex flex-wrap gap-2">
                {vibeOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.lifestyle_vibe === o} onClick={() => update("lifestyle_vibe", o)} />
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
                <label className="text-sm font-semibold text-foreground block mb-1.5">{t("minAge")}</label>
                <input
                  type="number"
                  value={form.preferred_age_min}
                  onChange={(e) => update("preferred_age_min", e.target.value)}
                  min="18" max="100"
                  className={`w-full bg-secondary text-secondary-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.preferred_age_min ? "ring-2 ring-destructive" : ""}`}
                />
                <ErrorMsg msg={errors.preferred_age_min} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">{t("maxAge")}</label>
                <input
                  type="number"
                  value={form.preferred_age_max}
                  onChange={(e) => update("preferred_age_max", e.target.value)}
                  min="18" max="100"
                  className={`w-full bg-secondary text-secondary-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.preferred_age_max ? "ring-2 ring-destructive" : ""}`}
                />
                <ErrorMsg msg={errors.preferred_age_max} />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("genderPref")}</label>
              <div className="flex flex-wrap gap-2">
                {genderPrefOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.gender_preference === o} onClick={() => update("gender_preference", o)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("lifestyleSim")}</label>
              <div className="flex flex-wrap gap-2">
                {similarityOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.lifestyle_similarity === o} onClick={() => update("lifestyle_similarity", o)} />
                ))}
              </div>
            </div>
            <SliderField label={t("cleanlinessExpectations")} value={form.cleanliness_expectations} onChange={(v) => update("cleanliness_expectations", v)} labels={[t("sliderRelaxed"), "", t("sliderModerate"), "", t("sliderStrict")]} />
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">{t("preferredActivityHours")}</label>
              <div className="flex flex-wrap gap-2">
                {activityOptions.map((o) => (
                  <OptionButton key={o} label={to(o)} selected={form.activity_hours === o} onClick={() => update("activity_hours", o)} />
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-foreground">{t("addYourPhotos")}</h2>
              <p className="text-muted-foreground text-sm">{t("showRoommates")}</p>
            </div>
            <PhotoUpload
              photos={form.photos}
              onChange={(photos) => update("photos", photos)}
              maxPhotos={6}
            />
            {form.photos.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
                {t("photosGet4x")}
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Sticky header: title + progress */}
      <div className="shrink-0 max-w-lg mx-auto w-full px-4 pt-10 desk:pt-6 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-foreground leading-tight">
              {t("setupProfile").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-primary">{t("setupProfile").split(" ").slice(-1)[0]}</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              {t("step")} {step + 1} / {STEPS.length} — {STEPS[step]}
              {step === 0 && <span className="ltr:ml-2 rtl:mr-2 text-primary font-medium">· {t("threeMin")}</span>}
            </p>
            {step < STEPS.length - 1 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("nextPrefix")}: {STEPS[step + 1]}
              </p>
            )}
            {(() => {
              // Grows with each completed step so progress always feels earned;
              // photos (step 6) take it to 100 on submit.
              const STEP_QUALITY = [0, 40, 60, 75, 90, 95];
              const pct = STEP_QUALITY[step] ?? 0;
              if (pct === 0) return null;
              return (
                <p className="text-xs text-primary font-bold mt-0.5">
                  {t("matchQualityUnlocked").replace("{pct}", String(pct))}
                </p>
              );
            })()}
          </div>
          {isEdit && (
            <button
              onClick={() => navigate(-1)}
              className="ml-3 p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 mt-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "gradient-primary" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 text-center mt-1">
          {step === 0 ? t("requiredLbl") : t("optionalSkipAnytime")}
        </p>
      </div>

      {/* Scrollable step content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${step}-${substep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed footer: back / next buttons */}
      <div className="shrink-0 bg-background/95 backdrop-blur-sm border-t border-border pb-16 desk:pb-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          {(step > 0 || (step === 2 && substep > 0)) && (
            <button
              onClick={() => {
                if (step === 2 && substep === 1) { setSubstep(0); setErrors({}); }
                else { setStep(step - 1); setSubstep(0); setErrors({}); }
              }}
              className="flex items-center gap-1 px-5 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> {t("back")}
            </button>
          )}
          <button
            onClick={async () => {
              const stepErrors = validateStep();
              if (Object.keys(stepErrors).length > 0) {
                setErrors(stepErrors);
                return;
              }
              setErrors({});
              if (step === 2 && substep === 0) {
                setSubstep(1);
              } else if (step < STEPS.length - 1) {
                saveProgress(form);
                setStep(step + 1);
                setSubstep(0);
              } else {
                handleSubmit();
              }
            }}
            disabled={!canProceed() || saving}
            className="flex-1 flex items-center justify-center gap-1 py-3 gradient-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {t("savingEllipsis")}
              </span>
            ) : step < STEPS.length - 1 ? (
              <>{t("nextBtn")} <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>{t("completeBtn")} <Check className="w-4 h-4" /></>
            )}
          </button>
        </div>
        {step >= 1 && step < STEPS.length - 1 && (
          <button
            onClick={() => handleSubmit()}
            disabled={saving}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {t("skipRemainingFinish")} →
          </button>
        )}
      </div>

      {/* No-photos confirmation dialog */}
      <Dialog open={photosDialogOpen} onOpenChange={setPhotosDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("onboardingNoPhotosTitle")}</DialogTitle>
            <DialogDescription>{t("onboardingNoPhotosDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 sm:flex-row">
            <button
              onClick={() => setPhotosDialogOpen(false)}
              className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                photoConfirmedRef.current = true;
                setPhotosDialogOpen(false);
                handleSubmit();
              }}
              className="flex-1 py-2.5 gradient-primary text-primary-foreground rounded-xl font-semibold text-sm"
            >
              {t("onboardingNoPhotosContinue")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
