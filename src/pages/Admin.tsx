import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Check, X, Ban, Mail, ChevronLeft, Shield, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Report {
  id: string;
  created_at: string;
  reporter_id: string;
  // target_id is the reported user's id (when target_type = 'user')
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
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

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const admin = data?.is_admin === true;
        setIsAdmin(admin);
        if (!admin) navigate("/");
      });
  }, [user, navigate]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("reports")
      .select("*")
      .eq("target_type", "user")
      .order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");
    const { data, error } = await q;
    if (error) { toast.error("Failed to load reports"); setLoading(false); return; }

    const enriched = await Promise.all((data ?? []).map(async (r) => {
      const [rep, repd] = await Promise.all([
        supabase.from("profiles").select("name").eq("user_id", r.reporter_id).maybeSingle(),
        supabase.from("profiles").select("name, city").eq("user_id", r.target_id).maybeSingle(),
      ]);
      return {
        ...r,
        reporter_name: rep.data?.name ?? "Unknown",
        reported_name: repd.data?.name ?? "Unknown",
        reported_city: repd.data?.city ?? "",
      };
    }));
    setReports(enriched as Report[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { if (isAdmin) loadReports(); }, [isAdmin, loadReports]);

  const action = async (reportId: string, reportedUserId: string, act: "dismiss" | "warn" | "ban") => {
    setActioning(reportId);
    try {
      if (act === "ban") {
        await supabase.from("profiles").update({ is_banned: true }).eq("user_id", reportedUserId);
      }
      const newStatus = act === "dismiss" ? "dismissed" : act === "warn" ? "warned" : "banned";
      await supabase.from("reports").update({ status: newStatus }).eq("id", reportId);
      toast.success(act === "dismiss" ? "Report dismissed" : act === "warn" ? "User warned" : "User banned");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      toast.error("Action failed");
    } finally {
      setActioning(null);
    }
  };

  if (isAdmin !== true) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Moderation
              </h1>
              <p className="text-xs text-muted-foreground">{pendingCount} pending review</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-secondary rounded-xl p-0.5">
              {(["pending", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                    filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={loadReports} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 animate-pulse h-32" />
          ))
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Check className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-lg font-bold text-foreground">All clear</h2>
            <p className="text-sm text-muted-foreground mt-1">No {filter === "pending" ? "pending" : ""} reports</p>
          </div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              {/* Header row */}
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
                    Reported by {r.reporter_name} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  r.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  r.status === "banned" ? "bg-red-100 text-red-700" :
                  r.status === "warned" ? "bg-blue-100 text-blue-700" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {r.status}
                </span>
              </div>

              {/* Reason + details */}
              <div className="bg-secondary rounded-xl px-3 py-2 mb-3">
                <p className="text-xs font-semibold text-foreground">{REASON_LABELS[r.reason] ?? r.reason}</p>
                {r.details && <p className="text-xs text-muted-foreground mt-0.5">"{r.details}"</p>}
              </div>

              {/* Actions */}
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
                    <Mail className="w-3.5 h-3.5" /> Warn user
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
