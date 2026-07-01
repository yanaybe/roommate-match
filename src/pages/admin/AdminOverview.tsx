import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatCard {
  label: string;
  value: number | string;
}

interface WeekBucket {
  week: string;
  count: number;
}

// Module-level cache: shared across renders, survives component re-mounts
interface AnalyticsCache {
  stats: StatCard[];
  userGrowth: WeekBucket[];
  listingGrowth: WeekBucket[];
  timestamp: number;
}
let analyticsCache: AnalyticsCache | null = null;
const ANALYTICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function StatCardSkeleton() {
  return <div className="bg-card border border-border rounded-2xl p-5 animate-pulse h-24" />;
}

function StatCardItem({ label, value }: StatCard) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

function getISOWeekLabel(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `${monday.getMonth() + 1}/${monday.getDate()}`;
}

function groupByWeek(dates: string[]): WeekBucket[] {
  const map = new Map<string, number>();
  dates.forEach((d) => {
    const label = getISOWeekLabel(new Date(d));
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([week, count]) => ({ week, count }));
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [userGrowth, setUserGrowth] = useState<WeekBucket[]>([]);
  const [listingGrowth, setListingGrowth] = useState<WeekBucket[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Serve cached data if still fresh (< 5 minutes old)
      if (analyticsCache && Date.now() - analyticsCache.timestamp < ANALYTICS_CACHE_TTL) {
        setStats(analyticsCache.stats);
        setUserGrowth(analyticsCache.userGrowth);
        setListingGrowth(analyticsCache.listingGrowth);
        setLoading(false);
        return;
      }
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const eightWeeksAgo = new Date(Date.now() - 56 * 86400000).toISOString();

      const [
        { count: totalUsers },
        { count: newToday },
        { count: newWeek },
        { count: onboarded },
        { count: totalListings },
        { count: premiumUsers },
        { count: pendingReports },
        { count: activeConvos },
        { data: recentProfiles },
        { data: recentListings },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_complete", true),
        supabase.from("apartments").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).neq("subscription_tier", "free"),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("created_at").gte("created_at", eightWeeksAgo),
        supabase.from("apartments").select("created_at").gte("created_at", eightWeeksAgo),
      ]);

      const newStats: StatCard[] = [
        { label: "Total Users", value: totalUsers ?? 0 },
        { label: "New Today", value: newToday ?? 0 },
        { label: "New This Week", value: newWeek ?? 0 },
        { label: "Onboarded", value: onboarded ?? 0 },
        { label: "Total Listings", value: totalListings ?? 0 },
        { label: "Premium Users", value: premiumUsers ?? 0 },
        { label: "Pending Reports", value: pendingReports ?? 0 },
        { label: "Active Convos", value: activeConvos ?? 0 },
      ];
      const newUserGrowth = recentProfiles
        ? groupByWeek(recentProfiles.map((p) => p.created_at))
        : [];
      const newListingGrowth = recentListings
        ? groupByWeek(recentListings.map((a) => a.created_at))
        : [];

      // Populate in-memory cache so subsequent renders within TTL skip the fetch
      analyticsCache = {
        stats: newStats,
        userGrowth: newUserGrowth,
        listingGrowth: newListingGrowth,
        timestamp: Date.now(),
      };

      setStats(newStats);
      setUserGrowth(newUserGrowth);
      setListingGrowth(newListingGrowth);
      setLoading(false);
    };

    load().catch((err) => {
      toast.error(err instanceof Error ? err.message : String(err));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((s) => <StatCardItem key={s.label} {...s} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">User Growth (last 8 weeks)</h2>
          {loading ? (
            <div className="animate-pulse bg-muted rounded-xl h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#userGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">New Listings (last 8 weeks)</h2>
          {loading ? (
            <div className="animate-pulse bg-muted rounded-xl h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={listingGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
