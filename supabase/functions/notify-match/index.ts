// Supabase Edge Function: notify-match
// Sends an email (via Resend) + web push notification when two users mutually like each other.
//
// Triggered by a Supabase Database Webhook on the liked_profiles table:
//   Table: liked_profiles   Event: INSERT
//   URL: https://<project-ref>.supabase.co/functions/v1/notify-match
//
// Setup:
//   1. supabase secrets set RESEND_API_KEY=re_...
//   2. supabase secrets set VAPID_PRIVATE_KEY=...  (generate: npx web-push generate-vapid-keys)
//   3. supabase secrets set VAPID_PUBLIC_KEY=...
//   4. supabase secrets set SITE_URL=https://your-domain.com
//   5. supabase functions deploy notify-match
//   6. In Supabase dashboard → Database → Webhooks, create a webhook on liked_profiles INSERT
//
// DB migration required (run in Supabase SQL editor):
//   create table if not exists push_subscriptions (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users(id) on delete cascade,
//     endpoint text not null,
//     p256dh text not null,
//     auth text not null,
//     created_at timestamptz default now(),
//     unique(user_id, endpoint)
//   );

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:8080";

async function sendEmail(to: string, name: string, matchName: string) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RoomMatch <roomatchltd@gmail.com>",
      to: [to],
      subject: `You matched with ${matchName} on RoomMatch!`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#7c3aed;font-size:24px;margin-bottom:8px">It's a match! 🎉</h1>
          <p style="color:#374151;font-size:16px">
            Hi ${name}, you and <strong>${matchName}</strong> have both liked each other's profiles.
          </p>
          <p style="color:#374151;font-size:16px">Start a conversation now — the sooner you connect, the better!</p>
          <a href="${SITE_URL}/chats"
             style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;
                    border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">
            Open Chat →
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            You're receiving this because you have an account at RoomMatch.
            <a href="${SITE_URL}/settings" style="color:#7c3aed">Manage notifications</a>
          </p>
        </div>
      `,
    }),
  });
}

async function sendPushNotification(userId: string, title: string, body: string) {
  // Retrieve push subscriptions for the user
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data: subs } = await supabase
    .from("push_subscriptions" as any)
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  // We use the web-push library via a minimal fetch-based VAPID approach.
  // For full VAPID signing in Deno, import the web-push library:
  //   import webpush from "https://esm.sh/web-push@3.6.7?target=deno";
  // That's omitted here to avoid a large dependency at deploy time.
  // The pattern below shows the intent; swap in web-push for production.
  const payload = JSON.stringify({ title, body, url: `${SITE_URL}/chats` });
  for (const sub of subs) {
    try {
      await fetch(sub.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
    } catch {
      // Endpoint may have expired — remove it
      await supabase
        .from("push_subscriptions" as any)
        .delete()
        .eq("endpoint", sub.endpoint);
    }
  }
}

Deno.serve(async (req) => {
  const payload = await req.json();
  // Supabase DB webhook sends { type, table, record, old_record, schema }
  const newLike = payload.record as { liker_id: string; liked_id: string };
  if (!newLike?.liker_id || !newLike?.liked_id) {
    return new Response("Missing fields", { status: 400 });
  }

  // Check if the reverse like exists (mutual match)
  const { data: reverseLike } = await supabase
    .from("liked_profiles")
    .select("id")
    .eq("liker_id", newLike.liked_id)
    .eq("liked_id", newLike.liker_id)
    .maybeSingle();

  if (!reverseLike) {
    // Not a mutual match yet — nothing to do
    return new Response(JSON.stringify({ matched: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch both users' profiles + auth emails
  const [{ data: likerProfile }, { data: likedProfile }] = await Promise.all([
    supabase.from("profiles").select("first_name, user_id").eq("user_id", newLike.liker_id).maybeSingle(),
    supabase.from("profiles").select("first_name, user_id").eq("user_id", newLike.liked_id).maybeSingle(),
  ]);

  const [{ data: { user: likerUser } }, { data: { user: likedUser } }] = await Promise.all([
    supabase.auth.admin.getUserById(newLike.liker_id),
    supabase.auth.admin.getUserById(newLike.liked_id),
  ]);

  const likerName = likerProfile?.first_name ?? "Someone";
  const likedName = likedProfile?.first_name ?? "Someone";

  // Send notifications to both parties in parallel
  await Promise.allSettled([
    // Notify the person who just liked (liker) about the match
    likerUser?.email && sendEmail(likerUser.email, likerName, likedName),
    sendPushNotification(newLike.liker_id, "It's a match! 🎉", `You matched with ${likedName}`),

    // Notify the person who was liked first
    likedUser?.email && sendEmail(likedUser.email, likedName, likerName),
    sendPushNotification(newLike.liked_id, "It's a match! 🎉", `You matched with ${likerName}`),
  ]);

  return new Response(JSON.stringify({ matched: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
