import { useState } from "react";
import { Flag, ChevronRight, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { REPORT_REASONS, type ReportReason } from "@/hooks/useBlockReport";

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetName: string;
  onSubmit: (reason: ReportReason, details: string) => Promise<boolean>;
}

export default function ReportSheet({
  open,
  onOpenChange,
  targetName,
  onSubmit,
}: ReportSheetProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    const ok = await onSubmit(selectedReason, details);
    setSubmitting(false);
    if (ok) {
      setSelectedReason(null);
      setDetails("");
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="text-base font-extrabold flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" />
            Report {targetName}
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Select a reason for your report. We review all reports within 24 hours.
          </p>

          <div className="bg-card rounded-2xl divide-y divide-border/40">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedReason(r.value)}
                className="w-full flex items-center justify-between px-4 py-3.5 first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm text-foreground">{r.label}</span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedReason === r.value
                      ? "border-destructive bg-destructive"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {selectedReason === r.value && (
                    <div className="w-2 h-2 rounded-full bg-destructive-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedReason && (
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)..."
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
            />
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-destructive text-destructive-foreground flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            Submit Report
          </button>

          <div className="pb-2" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
