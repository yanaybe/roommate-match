import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Check, X, Ban, Mail, RefreshCw } from "lucide-react";

interface Report {
  id: string;
  created_at: string;
  reporter_id: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  target_type: string;
  reported_name?: string;
  reported_city?: string;
  reporter_name?: string;
}

const REASON_LABELS: Record<string, string> = {
  fake_profile: "Fake profile",
  harassment: "Harassment",
  inappropriate_content: "Inappropriate content",
  spam: "Spam",
  scam: "Scam / fraud",
  other: "Other",
};

const REASON_COLORS: Record<string, string> = {
  fake_profile: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  harassment: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  inappropriate_content: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  spam: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  scam: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  other: "bg-secondary text-muted-foreground",
};

type FilterType = "pending" | "all";

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [actioning, setActioning] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");

    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      (data ?? []).map(async (r) => {
        const [rep, repd] = await Promise.all([
          supabase.from("profiles").select("name").eq("user_id", r.reporter_id).maybeSingle(),
          supabase.from("profiles").select("name,city").eq("user_id", r.target_id).maybeSingle(),
        ]);
        return {
          ...r,
          reporter_name: rep.data?.name ?? "Unknown",
          reported_name: repd.data?.name ?? "Unknown",
          reported_city: repd.data?.city ?? "",
        };
      })
    );

    setReports(enriched as Report[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const action = async (
    reportId: string,
    reportedUserId: string,
    act: "dismiss" | "warn" | "ban"
  ) => {
    setActioning(reportId);
    try {
      if (act === "ban") {
        if (!window.confirm("Ban this user? They will lose access to the app.")) {
          setActioning(null);
          return;
        }
        await supabase.from("profiles").update({ is_banned: true }).eq("user_id", reportedUserId);
      }
      const newStatus =
        act === "dismiss" ? "dismissed" : act === "warn" ? "warned" : "banned";
      await supabase.from("reports").update({ status: newStatus }).eq("id", reportId);
      toast.success(
        act === "dismiss" ? "Report dismissed" : act === "warn" ? "User warned" : "User banned"
      );
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setActioning(null);
    }
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const totalCount = reports.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">User moderation queue</p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-3">
        <div>
          <span className="text-2xl font-extrabold text-foreground">{pendingCount}</span>
          <span className="text-xs text-muted-foreground ml-1.5">pending</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <div>
          <span className="text-2xl font-extrabold text-foreground">{totalCount}</span>
          <span className="text-xs text-muted-foreground ml-1.5">showing</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-secondary rounded-xl p-0.5">
            {(["pending", "all"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  filter === f
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={loadReports}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Report cards */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 animate-pulse h-32 border border-border" />
          ))
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl">
            <Check className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-lg font-bold text-foreground">All clear</h2>
            <p className="text-sm text-muted-foreground mt-1">
              No {filter === "pending" ? "pending" : ""} reports
            </p>
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="bg-card rounded-2xl p-4 border border-border/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <span className="text-sm font-bold text-foreground">
                      {r.reported_name}
                      {r.reported_city ? ` · ${r.reported_city}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reported by {r.reporter_name} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    r.status === "pending"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : r.status === "banned"
                      ? "bg-red-100 text-red-700"
                      : r.status === "warned"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="bg-secondary rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
                <span
                  className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                    REASON_COLORS[r.reason] ?? REASON_COLORS.other
                  }`}
                >
                  {REASON_LABELS[r.reason] ?? r.reason}
                </span>
                {r.details && (
                  <p className="text-xs text-muted-foreground">"{r.details}"</p>
                )}
              </div>

              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => action(r.id, r.target_id, "dismiss")}
                    disabled={actioning === r.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Dismiss
                  </button>
                  <button
                    onClick={() => action(r.id, r.target_id, "warn")}
                    disabled={actioning === r.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" /> Warn
                  </button>
                  <button
                    onClick={() => action(r.id, r.target_id, "ban")}
                    disabled={actioning === r.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" /> Ban
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
