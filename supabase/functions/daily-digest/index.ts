// Supabase Edge Function: daily-digest
// Sends a daily email digest to active users: new matches + new listings in their city.
//
// Schedule via pg_cron (run in Supabase SQL editor):
//   select cron.schedule(
//     'daily-digest',
//     '0 9 * * *',  -- 9 AM UTC every day
//     $$
//       select net.http_post(
//         url := 'https://<project-ref>.supabase.co/functions/v1/daily-digest',
//         headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb,
//         body := '{}'::jsonb
//       )
//     $$
//   );
//
// Setup:
//   1. supabase secrets set RESEND_API_KEY=re_...
//   2. supabase secrets set SITE_URL=https://your-domain.com
//   3. supabase functions deploy daily-digest
//   4. Enable pg_cron in Supabase: Database → Extensions → pg_cron
//   5. Enable pg_net for HTTP calls from pg_cron
//   6. Run the cron.schedule() SQL above in the SQL editor

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:8080";

async function sendDigestEmail(
  email: string,
  name: string,
  city: string,
  newMatchCount: number,
  newListings: Array<{ title: string; price: number | null; id: string }>,
) {
  if (!RESEND_API_KEY || (!newMatchCount && !newListings.length)) return;

  const listingsHtml = newListings
    .slice(0, 3)
    .map(
      (l) => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px">
        <strong style="color:#111827">${l.title}</strong>
        ${l.price ? `<span style="color:#7c3aed;margin-left:8px">₪${l.price.toLocaleString()}/mo</span>` : ""}
        <br/>
        <a href="${SITE_URL}/apartment/${l.id}" style="color:#7c3aed;font-size:13px">View listing →</a>
      </div>
    `,
    )
    .join("");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RoomMatch <no-reply@roomatch.app>",
      to: [email],
      subject: `Your daily RoomMatch digest — ${newMatchCount > 0 ? `${newMatchCount} new match${newMatchCount > 1 ? "es" : ""}` : `new listings in ${city}`}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#7c3aed;font-size:22px;margin-bottom:4px">Hi ${name}! 👋</h1>
          <p style="color:#6b7280;font-size:14px;margin-bottom:20px">Here's what's new in ${city} today</p>

          ${newMatchCount > 0 ? `
          <div style="background:#f5f3ff;border-radius:12px;padding:16px;margin-bottom:20px">
            <h2 style="color:#7c3aed;font-size:16px;margin:0 0 4px">
              🎉 ${newMatchCount} new roommate match${newMatchCount > 1 ? "es" : ""}!
            </h2>
            <p style="color:#374151;font-size:14px;margin:0">
              People who match your lifestyle are waiting to connect.
            </p>
            <a href="${SITE_URL}/roommates"
               style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;
                      border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px;font-size:14px">
              See matches →
            </a>
          </div>` : ""}

          ${newListings.length > 0 ? `
          <h2 style="color:#111827;font-size:16px;margin-bottom:12px">
            🏠 New listings in ${city}
          </h2>
          ${listingsHtml}
          <a href="${SITE_URL}"
             style="display:inline-block;color:#7c3aed;font-size:14px;margin-top:4px">
            Browse all listings →
          </a>` : ""}

          <p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #f3f4f6;padding-top:16px">
            You're receiving this because you have a RoomMatch account.
            <a href="${SITE_URL}/settings" style="color:#7c3aed">Unsubscribe from digests</a>
          </p>
        </div>
      `,
    }),
  });
}

Deno.serve(async () => {
  // Get all users who completed onboarding, with their city
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, city")
    .eq("onboarding_complete", true);

  if (!profiles?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let sent = 0;

  for (const profile of profiles) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
      if (!authUser?.user?.email) continue;

      // Count new mutual matches in the last 24h
      const { count: newMatches } = await supabase
        .from("liked_profiles")
        .select("id", { count: "exact", head: true })
        .eq("liked_id", profile.user_id)
        .gte("created_at", yesterday);

      // Mutual check: also exists in reverse
      const mutualMatchCount = newMatches ?? 0;

      // New listings in user's city
      const { data: newListings } = await supabase
        .from("apartments")
        .select("id, title, price")
        .ilike("city", `%${profile.city ?? ""}%`)
        .gte("created_at", yesterday)
        .limit(3);

      if (!mutualMatchCount && !newListings?.length) continue;

      await sendDigestEmail(
        authUser.user.email,
        profile.first_name ?? "there",
        profile.city ?? "your city",
        mutualMatchCount,
        newListings ?? [],
      );
      sent++;
    } catch {
      // Individual failure shouldn't stop the batch
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
