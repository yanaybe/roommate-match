import { Mail, Camera } from "lucide-react";

export interface VerificationStatus {
  emailVerified: boolean;
  hasPhotos: boolean;
}

interface Props {
  status: VerificationStatus;
  size?: "sm" | "md";
}

const BADGES = [
  { key: "emailVerified" as const, icon: Mail,   label: "Email",  color: "badge-info-text",     bg: "badge-info-bg"     },
  { key: "hasPhotos"     as const, icon: Camera, label: "Photos", color: "badge-verified-text",  bg: "badge-verified-bg" },
];

export default function VerificationBadges({ status, size = "md" }: Props) {
  const active = BADGES.filter((b) => status[b.key]);
  if (active.length === 0) return null;

  if (size === "sm") {
    return (
      <div className="flex items-center gap-1">
        {active.map((b) => (
          <div key={b.key} className={`w-5 h-5 rounded-full ${b.bg} flex items-center justify-center`} title={`${b.label} verified`}>
            <b.icon className={`w-2.5 h-2.5 ${b.color}`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {active.map((b) => (
        <div key={b.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${b.bg}`}>
          <b.icon className={`w-3 h-3 ${b.color}`} />
          <span className={`text-[11px] font-semibold ${b.color}`}>{b.label} Verified</span>
        </div>
      ))}
      {BADGES.filter((b) => !status[b.key]).map((b) => (
        <div key={b.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
          <b.icon className="w-3 h-3 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
