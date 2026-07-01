import { useNavigate } from "react-router-dom";
import { Edit } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FullProfile } from "@/hooks/useProfile";

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-card rounded-2xl shadow-card p-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  const display = value != null && value !== "" ? value : undefined;
  return (
    <div className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-sm font-medium ${display == null ? "text-muted-foreground/50 italic" : "text-foreground"}`}>
        {display ?? "Not specified"}
      </span>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: FullProfile;
  t: (key: string) => string;
}

export default function PreferencesSheet({ open, onOpenChange, profile, t }: Props) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-lg font-extrabold text-foreground">{t("preferences")}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(85vh-70px)] px-5 py-4">
          <ProfileSection title={t("basicInfo")}>
            <InfoRow label={t("budget")} value={profile.budget != null ? `₪${profile.budget.toLocaleString()}/mo` : null} />
            <InfoRow label={t("roomType")} value={profile.desired_room_type} />
          </ProfileSection>

          <ProfileSection title={t("livingHabits")}>
            <InfoRow label={t("sleepSchedule")} value={profile.sleep_schedule} />
            <InfoRow label={t("cleanliness")} value={`${profile.cleanliness}/5`} />
            <InfoRow label={t("cooking")} value={profile.cooking_habits} />
            <InfoRow label={t("sharedSpace")} value={profile.shared_space_org} />
          </ProfileSection>

          <ProfileSection title={t("lifestyle")}>
            <InfoRow label={t("smoking")} value={profile.smoking ? t("yes") : t("no")} />
            <InfoRow label={t("religiousLevel")} value={profile.religious_level} />
            <InfoRow label={t("alcohol")} value={profile.alcohol} />
            <InfoRow label={t("pets")} value={profile.pets ? t("yes") : t("no")} />
            <InfoRow label={t("fitness")} value={profile.fitness} />
            <InfoRow label={t("workFromHome")} value={profile.wfh ? t("yes") : t("no")} />
            <InfoRow label={t("guests")} value={profile.guests} />
          </ProfileSection>

          <ProfileSection title={t("personality")}>
            <InfoRow label={t("socialLevel")} value={`${profile.social_level}/5`} />
            <InfoRow label={t("noiseLevel")} value={`${profile.noise_level}/5`} />
            <InfoRow label={t("partying")} value={profile.partying} />
            <InfoRow label={t("vibe")} value={profile.lifestyle_vibe} />
          </ProfileSection>

          <ProfileSection title={t("roommatePreferences")}>
            <InfoRow label={t("ageRange")} value={`${profile.preferred_age_min} - ${profile.preferred_age_max}`} />
            <InfoRow label={t("gender")} value={profile.gender_preference} />
            <InfoRow label={t("lifestyleSimilarity")} value={profile.lifestyle_similarity} />
            <InfoRow label={t("cleanlinessExpected")} value={`${profile.cleanliness_expectations}/5`} />
            <InfoRow label={t("activityHours")} value={profile.activity_hours} />
          </ProfileSection>

          <div className="pb-4">
            <button
              onClick={() => { onOpenChange(false); navigate("/onboarding?edit=true"); }}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" /> {t("editPreferences")}
            </button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
