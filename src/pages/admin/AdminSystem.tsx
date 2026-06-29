import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Check {
  label: string;
  status: "loading" | "ok" | "error";
  detail?: string;
}

interface QuickStat {
  label: string;
  count: number | null;
}

function StatusIcon({ status }: { status: Check["status"] }) {
  if (status === "loading") return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  return <XCircle className="w-4 h-4 text-destructive" />;
}

export default function AdminSystem() {
  const [checks, setChecks] = useState<Check[]>([
    { label: "Database connection", status: "loading" },
    { label: "Auth service", status: "loading" },
    { label: "Storage bucket", status: "loading" },
  ]);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([
    { label: "Total profiles", count: null },
    { label: "Total apartments", count: null },
    { label: "Total reports", count: null },
    { label: "Support messages", count: null },
  ]);

  const setCheck = (index: number, update: Partial<Check>) => {
    setChecks((prev) => prev.map((c, i) => (i === index ? { ...c, ...update } : c)));
  };

  useEffect(() => {
    // DB check
    supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .then(({ error }) => {
        setCheck(0, { status: error ? "error" : "ok", detail: error?.message });
      });

    // Auth check
    supabase.auth
      .getSession()
      .then(({ error }) => {
        setCheck(1, { status: error ? "error" : "ok", detail: error?.message });
      });

    // Storage check
    supabase.storage
      .getBucket("profile-photos")
      .then(({ error }) => {
        setCheck(2, { status: error ? "error" : "ok", detail: error?.message });
      });

    // Quick stats
    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("apartments").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }),
      supabase.from("support_messages").select("*", { count: "exact", head: true }),
    ]).then(([p, a, r, s]) => {
      setQuickStats([
        { label: "Total profiles", count: p.count ?? 0 },
        { label: "Total apartments", count: a.count ?? 0 },
        { label: "Total reports", count: r.count ?? 0 },
        { label: "Support messages", count: s.count ?? 0 },
      ]);
    });
  }, []);

  const envInfo = [
    { label: "Mode", value: import.meta.env.MODE },
    {
      label: "Supabase URL",
      value: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.slice(0, 40) ?? "—",
    },
    {
      label: "Paddle env",
      value: (import.meta.env.VITE_PADDLE_ENV as string | undefined) ?? "sandbox",
    },
    {
      label: "Last deployed approx.",
      value: new Date().toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">System</h1>
        <p className="text-sm text-muted-foreground mt-1">Health checks and environment info</p>
      </div>

      {/* Health checks */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        <div className="px-5 py-3 bg-secondary/40 rounded-t-2xl">
          <h2 className="text-xs font-bold uppercase text-muted-foreground">Health Checks</h2>
        </div>
        {checks.map((c) => (
          <div key={c.label} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold text-foreground">{c.label}</p>
              {c.detail && (
                <p className="text-xs text-destructive mt-0.5">{c.detail}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {c.status === "loading" ? "Checking…" : c.status === "ok" ? "Connected" : "Error"}
              </span>
              <StatusIcon status={c.status} />
            </div>
          </div>
        ))}
      </div>

      {/* Environment info */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        <div className="px-5 py-3 bg-secondary/40 rounded-t-2xl">
          <h2 className="text-xs font-bold uppercase text-muted-foreground">Environment</h2>
        </div>
        {envInfo.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold text-foreground font-mono truncate max-w-[60%] text-right">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        <div className="px-5 py-3 bg-secondary/40 rounded-t-2xl">
          <h2 className="text-xs font-bold uppercase text-muted-foreground">Quick Stats</h2>
        </div>
        {quickStats.map(({ label, count }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
              {count === null ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <span className="text-sm font-bold text-foreground">{count.toLocaleString()}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
