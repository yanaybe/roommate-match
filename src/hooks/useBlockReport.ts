import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ReportReason =
  | "spam"
  | "fake_profile"
  | "harassment"
  | "inappropriate_content"
  | "scam"
  | "other";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "scam", label: "Scam / fraud" },
  { value: "other", label: "Other" },
];

export function useBlockReport(targetUserId?: string) {
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetUserId) return;
    supabase
      .from("blocked_users")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", targetUserId)
      .maybeSingle()
      .then(({ data }) => setIsBlocked(Boolean(data)));
  }, [user, targetUserId]);

  const blockUser = useCallback(async () => {
    if (!user || !targetUserId) return;
    setLoading(true);
    const { error } = await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: targetUserId,
    });
    setLoading(false);
    if (error && error.code !== "23505") {
      toast.error("Failed to block user.");
      return false;
    }
    setIsBlocked(true);
    toast.success("User blocked. They won't appear in your feed.");
    return true;
  }, [user, targetUserId]);

  const unblockUser = useCallback(async () => {
    if (!user || !targetUserId) return;
    setLoading(true);
    await supabase
      .from("blocked_users")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", targetUserId);
    setLoading(false);
    setIsBlocked(false);
    toast.success("User unblocked.");
  }, [user, targetUserId]);

  const reportUser = useCallback(
    async (reason: ReportReason, details?: string) => {
      if (!user || !targetUserId) return false;
      setLoading(true);
      const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
      const { count: recentReports } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("reporter_id", user.id)
        .gte("created_at", oneDayAgo);
      if ((recentReports ?? 0) >= 10) {
        setLoading(false);
        toast.error("You've submitted too many reports today. Try again tomorrow.");
        return false;
      }
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        target_type: "user",
        target_id: targetUserId,
        reason,
        details: details || null,
      });
      setLoading(false);
      if (error && error.code !== "23505") {
        toast.error("Failed to submit report.");
        return false;
      }
      toast.success("Report submitted. We'll review it shortly.");
      return true;
    },
    [user, targetUserId]
  );

  const reportListing = useCallback(
    async (listingId: string, reason: ReportReason, details?: string) => {
      if (!user) return false;
      setLoading(true);
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        target_type: "listing",
        target_id: listingId,
        reason,
        details: details || null,
      });
      setLoading(false);
      if (error && error.code !== "23505") {
        toast.error("Failed to submit report.");
        return false;
      }
      toast.success("Listing reported. We'll review it shortly.");
      return true;
    },
    [user]
  );

  return { isBlocked, loading, blockUser, unblockUser, reportUser, reportListing };
}

// Fetch all blocked user IDs for the current user (for filtering feeds)
export async function fetchBlockedIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", userId);
  return (data ?? []).map((r: any) => r.blocked_id);
}
