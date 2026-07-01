import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Only accept service role calls
  const authHeader = req.headers.get("authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
  const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@roomatch.co";

  // If VAPID keys not configured, skip silently
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[send-push] VAPID keys not configured — skipping push");
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: "vapid_not_configured" }), { status: 200 });
  }

  let body: { user_id: string; title: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  if (!body.user_id || !body.title) {
    return new Response(JSON.stringify({ error: "Missing user_id or title" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
  );

  // Fetch all push subscriptions for this user
  // Table columns: id, user_id, endpoint, p256dh, auth, created_at (all flat — no keys jsonb)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs, error: subsError } = await (supabase as any)
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", body.user_id);

  if (subsError) {
    console.error("[send-push] Failed to fetch subscriptions:", subsError);
    return new Response(JSON.stringify({ error: subsError.message }), { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
  }

  // Import web-push
  const webpush = await import("npm:web-push");
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({ title: body.title, body: body.body ?? "" });
  let sent = 0;
  const staleIds: string[] = [];

  for (const sub of subs) {
    // Flat columns: endpoint, p256dh, auth (see useAuth.tsx migration comment)
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSub, payload);
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        // Subscription expired — mark for cleanup
        staleIds.push(sub.id);
      } else {
        console.error("[send-push] Failed to send to subscription:", err);
      }
    }
  }

  // Clean up expired subscriptions
  if (staleIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("push_subscriptions").delete().in("id", staleIds);
  }

  return new Response(JSON.stringify({ ok: true, sent, stale_removed: staleIds.length }), { status: 200 });
});
