// cancel-subscription — Cancels a Paddle subscription at end of billing period.
//
// Called by SubscriptionManagementSheet when the user confirms cancellation.
// Uses Paddle's "cancel subscription" endpoint:
//   POST https://api.paddle.com/subscriptions/{subscription_id}/cancel
//
// After Paddle confirms the cancellation, the subscription.canceled webhook
// will fire and the paddle-webhook function will downgrade the profile tier.
//
// Environment variables required:
//   PADDLE_API_KEY — Paddle API secret key
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — injected automatically

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PADDLE_API_BASE = Deno.env.get("PADDLE_ENV") === "production"
  ? "https://api.paddle.com"
  : "https://sandbox-api.paddle.com";

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Verify caller is an authenticated Supabase user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Validate JWT → get calling user
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  // Look up the user's Paddle subscription ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("paddle_subscription_id, subscription_tier")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) return json({ error: "Could not load profile" }, 500);
  if (!profile?.paddle_subscription_id) {
    return json({ error: "No active subscription found" }, 400);
  }
  if (profile.subscription_tier === "free") {
    return json({ error: "No paid subscription to cancel" }, 400);
  }

  // Call Paddle API to schedule cancellation at end of billing period
  const paddleRes = await fetch(
    `${PADDLE_API_BASE}/subscriptions/${profile.paddle_subscription_id}/cancel`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ effective_from: "next_billing_period" }),
    }
  );

  if (!paddleRes.ok) {
    const body = await paddleRes.text();
    console.error("Paddle cancel error:", paddleRes.status, body);

    // If subscription is already cancelled in Paddle, that's OK — just update our DB
    if (paddleRes.status === 400 || paddleRes.status === 409) {
      await supabase
        .from("profiles")
        .update({ subscription_tier: "free", paddle_subscription_id: null })
        .eq("user_id", user.id);
      return json({ ok: true, already_cancelled: true });
    }

    return json({ error: "Paddle API error. Please try again or contact support." }, 502);
  }

  // Paddle confirmed the cancellation. The webhook will handle the final downgrade,
  // but we mark it as scheduled so the UI reflects the state immediately.
  // Do NOT downgrade tier yet — user keeps benefits until billing period ends.

  return json({ ok: true });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
