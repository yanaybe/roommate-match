import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Terminal } from "lucide-react";

interface SupportMessage {
  id: string;
  user_id: string;
  category: string | null;
  message: string;
  created_at: string;
  user_name?: string;
}

interface ReportLog {
  id: string;
  status: string;
  reason: string;
  created_at: string;
  target_id: string;
  reporter_id: string;
  target_name?: string;
}

const SQL_SNIPPET = `CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins only" ON admin_audit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );`;

type TabType = "support" | "moderation";

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState<TabType>("support");
  const [tickets, setTickets] = useState<SupportMessage[]>([]);
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [{ data: msgs, error: msgErr }, { data: reps, error: repErr }] = await Promise.all([
        supabase
          .from("support_messages")
          .select("id,user_id,category,message,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("reports")
          .select("id,status,reason,created_at,target_id,reporter_id")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (msgErr) toast.error(msgErr.message);
      if (repErr) toast.error(repErr.message);

      // Enrich support messages with user names
      const userIds = [...new Set((msgs ?? []).map((m) => m.user_id))];
      const nameMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id,name")
          .in("user_id", userIds);
        (profiles ?? []).forEach((p) => nameMap.set(p.user_id, p.name));
      }

      setTickets(
        (msgs ?? []).map((m) => ({ ...m, user_name: nameMap.get(m.user_id) ?? "Unknown" }))
      );

      // Enrich reports with target names
      const targetIds = [...new Set((reps ?? []).map((r) => r.target_id))];
      const targetMap = new Map<string, string>();
      if (targetIds.length > 0) {
        const { data: tProfiles } = await supabase
          .from("profiles")
          .select("user_id,name")
          .in("user_id", targetIds);
        (tProfiles ?? []).forEach((p) => targetMap.set(p.user_id, p.name));
      }

      setReports(
        (reps ?? []).map((r) => ({ ...r, target_name: targetMap.get(r.target_id) ?? "Unknown" }))
      );

      setLoading(false);
    };

    load().catch((err) => {
      toast.error(err instanceof Error ? err.message : String(err));
      setLoading(false);
    });
  }, []);

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Support tickets and moderation history</p>
      </div>

      {/* Audit log banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Terminal className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Enable full audit logging
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 mb-3">
              Run this SQL in your Supabase SQL Editor to enable persistent admin action logging.
            </p>
            <div className="relative">
              <pre className="bg-background border border-border rounded-xl p-3 text-[11px] text-foreground overflow-x-auto leading-relaxed">
                {SQL_SNIPPET}
              </pre>
              <button
                onClick={copySQL}
                className="absolute top-2 right-2 text-[10px] font-bold bg-secondary hover:bg-secondary/80 text-muted-foreground px-2 py-1 rounded-lg transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary rounded-xl p-1 w-fit">
        {(["support", "moderation"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              activeTab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {t === "support" ? "Support Tickets" : "Moderation History"}
          </button>
        ))}
      </div>

      {/* Support tickets */}
      {activeTab === "support" && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted rounded-2xl h-20" />
            ))
          ) : tickets.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm bg-card border border-border rounded-2xl">
              No support tickets
            </div>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{t.user_name}</span>
                    {t.category && (
                      <span className="ml-2 text-[10px] font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                        {t.category}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{t.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Moderation history */}
      {activeTab === "moderation" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="space-y-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted h-14" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No moderation records
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3">Target</th>
                    <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3">Reason</th>
                    <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-left text-xs font-bold text-muted-foreground px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">
                        {r.target_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                        {r.reason.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : r.status === "banned"
                              ? "bg-red-100 text-red-700"
                              : r.status === "warned"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
