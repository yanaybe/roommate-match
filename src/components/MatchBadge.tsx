import { getMatchColor } from "@/data/mockData";

interface MatchBadgeProps {
  percent: number;
  size?: "sm" | "md" | "lg";
}

export default function MatchBadge({ percent, size = "md" }: MatchBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5 font-bold",
  };

  return (
    <span className={`${getMatchColor(percent)} ${sizeClasses[size]} rounded-full font-semibold inline-flex items-center gap-1`}>
      {percent}%
    </span>
  );
}
