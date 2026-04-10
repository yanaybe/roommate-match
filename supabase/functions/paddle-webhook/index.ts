// Paddle Billing Webhook Handler
//
// SETUP:
//   1. In Paddle Dashboard → Notifications → New Notification:
//      URL: https://<project-ref>.supabase.co/functions/v1/paddle-webhook
//      Events: subscription.activated, subscription.updated, subscription.canceled, subscription.paused
//   2. Copy the webhook secret key from Paddle dashboard
//   3. Run: supabase secrets set PADDLE_WEBHOOK_SECRET=<secret>
//   4. Deploy: supabase functions deploy paddle-webhook

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PADDLE_WEBHOOK_SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Map Paddle price IDs to subscription tiers
// Set these env vars: PADDLE_PRICE_PLUS, PADDLE_PRICE_GOLD, PADDLE_PRICE_PLATINUM
const PRICE_TO_TIER: Record<string, string> = {};

function getPriceToTier() {
  return {
    [Deno.env.get("PADDLE_PRICE_PLUS") ?? ""]: "plus",
    [Deno.env.get("PADDLE_PRICE_GOLD") ?? ""]: "gold",
    [Deno.env.get("PADDLE_PRICE_PLATINUM") ?? ""]: "platinum",
  };
}

// Verify Paddle webhook signature (HMAC-SHA256)
async function verifySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  // Paddle sends: ts=<timestamp>;h1=<hash>
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const signed = `${ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === h1;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("paddle-signature") ?? "";

  if (PADDLE_WEBHOOK_SECRET) {
    const valid = await verifySignature(rawBody, signatureHeader, PADDLE_WEBHOOK_SECRET);
    if (!valid) {
      console.error("Invalid Paddle webhook signature");
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const priceToTier = getPriceToTier();

  const eventType: string = event.event_type ?? event.notification_type ?? "";
  const data = event.data ?? {};

  console.log("Paddle event:", eventType, JSON.stringify(data).slice(0, 200));

  // Extract fields common to subscription events
  const customerId: string = data.customer_id ?? "";
  const subscriptionId: string = data.id ?? "";
  const status: string = data.status ?? "";
  const priceId: string = data.items?.[0]?.price?.id ?? "";
  const scheduledChange = data.scheduled_change;

  // Determine tier from price ID
  const tier = priceToTier[priceId] ?? null;

  // Helper: find profile by paddle_customer_id or fall back to custom_data.user_id
  async function findProfile() {
    const userId: string = data.custom_data?.user_id ?? "";

    if (customerId) {
      const { data: byCustomer } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("paddle_customer_id", customerId)
        .maybeSingle();
      if (byCustomer) return byCustomer.user_id as string;
    }

    if (userId) return userId;
    return null;
  }

  switch (eventType) {
    case "subscription.activated":
    case "subscription.updated": {
      if (!tier) {
        console.warn("Unknown price ID:", priceId);
        break;
      }
      const profileId = await findProfile();
      if (!profileId) {
        console.error("No profile found for customer:", customerId);
        break;
      }

      // If there's a scheduled cancellation, keep current tier until it expires
      const expiresAt = scheduledChange?.action === "cancel"
        ? scheduledChange.effective_at
        : null;

      await supabase
        .from("profiles")
        .update({
          subscription_tier: tier,
          paddle_customer_id: customerId,
          paddle_subscription_id: subscriptionId,
          ...(expiresAt ? { subscription_expires_at: expiresAt } : {}),
        })
        .eq("user_id", profileId);

      console.log(`Set ${profileId} to ${tier}`);
      break;
    }

    case "subscription.canceled":
    case "subscription.paused": {
      const profileId = await findProfile();
      if (!profileId) break;

      await supabase
        .from("profiles")
        .update({
          subscription_tier: "free",
          paddle_subscription_id: null,
          subscription_expires_at: null,
        })
        .eq("user_id", profileId);

      console.log(`Downgraded ${profileId} to free`);
      break;
    }

    default:
      console.log("Unhandled event type:", eventType);
  }

  return new Response("OK", { status: 200 });
});
