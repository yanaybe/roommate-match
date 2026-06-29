import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Range = "7d" | "30d" | "90d";

interface DayBucket { day: string; count: number }
interface CityBucket { city: string; count: number }
interface TierBucket { tier: string; count: number }

const TIER_PIE_COLORS: Record<string, string> = {
  free: "#94a3b8",
  plus: "#22c55e",
  gold: "#f59e0b",
  platinum: "#8b5cf6",
};

function groupByDay(dates: string[]): DayBucket[] {
  const map = new Map<string, number>();
  dates.forEach((d) => {
    const day = d.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day: day.slice(5), count }));
}

function groupByCity(cities: string[]): CityBucket[] {
  const map = new Map<string, number>();
  cities.forEach((c) => {
    const key = c?.trim() || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([city, count]) => ({ city, count }));
}

function ChartSkeleton() {
  return <div className="animate-pulse bg-muted rounded-xl h-56" />;
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [profileDates, setProfileDates] = useState<string[]>([]);
  const [listingDates, setListingDates] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [tierCounts, setTierCounts] = useState<TierBucket[]>([]);

  const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date(Date.now() - rangeDays * 86400000).toISOString();

      const [
        { data: profiles },
        { data: listings },
        { data: allProfiles },
      ] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", since),
        supabase.from("apartments").select("created_at").gte("created_at", since),
        supabase.from("profiles").select("city,subscription_tier"),
      ]);

      setProfileDates((profiles ?? []).map((p) => p.created_at));
      setListingDates((listings ?? []).map((a) => a.created_at));
      setAllCities((allProfiles ?? []).map((p) => p.city));

      // Tier breakdown
      const tierMap = new Map<string, number>();
      (allProfiles ?? []).forEach((p) => {
        const t = p.subscription_tier ?? "free";
        tierMap.set(t, (tierMap.get(t) ?? 0) + 1);
      });
      setTierCounts(
        Array.from(tierMap.entries()).map(([tier, count]) => ({ tier, count }))
      );

      setLoading(false);
    };

    load().catch((err) => {
      toast.error(err instanceof Error ? err.message : String(err));
      setLoading(false);
    });
  }, [rangeDays]);

  const signupData = useMemo(() => groupByDay(profileDates), [profileDates]);
  const listingData = useMemo(() => groupByDay(listingDates), [listingDates]);
  const cityData = useMemo(() => groupByCity(allCities), [allCities]);

  const RANGES: Range[] = ["7d", "30d", "90d"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Growth and distribution metrics</p>
        </div>
        <div className="flex bg-secondary rounded-xl p-0.5 shrink-0">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Signups */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Daily Signups</h2>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={signupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Signups" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily Listings */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Daily New Listings</h2>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={listingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Listings" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* City Distribution */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Top Cities (all time)</h2>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subscription Tiers */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Subscription Tiers (all time)</h2>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tierCounts}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ tier, percent }) =>
                    `${tier} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {tierCounts.map((entry) => (
                    <Cell
                      key={entry.tier}
                      fill={TIER_PIE_COLORS[entry.tier] ?? "#8b5cf6"}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
