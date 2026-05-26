/**
 * Paddle Billing Webhook Handler
 *
 * SETUP:
 *   1. Paddle Dashboard → Notifications → New Notification:
 *      URL: https://<project-ref>.supabase.co/functions/v1/paddle-webhook
 *      Events: subscription.activated, subscription.updated, subscription.canceled,
 *              subscription.paused, subscription.past_due, transaction.completed
 *   2. Copy the webhook secret key from Paddle dashboard
 *   3. supabase secrets set PADDLE_WEBHOOK_SECRET=<secret>
 *   4. supabase secrets set PADDLE_PRICE_PLUS=<price_id>
 *      supabase secrets set PADDLE_PRICE_GOLD=<price_id>
 *      supabase secrets set PADDLE_PRICE_PLATINUM=<price_id>
 *      supabase secrets set PADDLE_PRICE_PLUS_ANNUAL=<price_id>
 *      supabase secrets set PADDLE_PRICE_GOLD_ANNUAL=<price_id>
 *      supabase secrets set PADDLE_PRICE_PLATINUM_ANNUAL=<price_id>
 *   5. supabase functions deploy paddle-webhook
 *
 * SECURITY:
 *   - HMAC-SHA256 signature verified on every request.
 *   - Timestamp checked against current time (±5 min replay window).
 *   - Event deduplication via webhook_events table (Paddle retries are idempotent).
 *   - Subscription tier updates are double-guarded by the DB trigger
 *     guard_profile_sensitive_fields (service_role bypasses; authenticated users cannot).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Environment ──────────────────────────────────────────────────────────────

const PADDLE_WEBHOOK_SECRET    = Deno.env.get("PADDLE_WEBHOOK_SECRET");
const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Maximum age of an accepted webhook timestamp (seconds). Prevents replay attacks. */
const MAX_TIMESTAMP_AGE_SECS = 300; // 5 minutes

// ── Price ID → subscription tier mapping ─────────────────────────────────────

function buildPriceToTier(): Record<string, string> {
  const map: Record<string, string> = {};
  const pairs: [string, string][] = [
    [Deno.env.get("PADDLE_PRICE_PLUS")          ?? "", "plus"],
    [Deno.env.get("PADDLE_PRICE_GOLD")          ?? "", "gold"],
    [Deno.env.get("PADDLE_PRICE_PLATINUM")      ?? "", "platinum"],
    [Deno.env.get("PADDLE_PRICE_PLUS_ANNUAL")   ?? "", "plus"],
    [Deno.env.get("PADDLE_PRICE_GOLD_ANNUAL")   ?? "", "gold"],
    [Deno.env.get("PADDLE_PRICE_PLATINUM_ANNUAL") ?? "", "platinum"],
  ];
  for (const [id, tier] of pairs) {
    if (id) map[id] = tier; // skip empty strings
  }
  return map;
}

// ── Signature verification ────────────────────────────────────────────────────

/**
 * Verify Paddle HMAC-SHA256 webhook signature AND timestamp freshness.
 *
 * Paddle sends:  Paddle-Signature: ts=<unix_ts>;h1=<hex_hmac>
 * Signed payload: `<ts>:<rawBody>`
 */
async function verifySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<{ valid: boolean; reason?: string }> {
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => {
      const idx = p.indexOf("=");
      return [p.slice(0, idx), p.slice(idx + 1)] as [string, string];
    }),
  );

  const ts  = parts["ts"];
  const h1  = parts["h1"];

  if (!ts || !h1) {
    return { valid: false, reason: "missing ts or h1 in signature header" };
  }

  // Replay-attack protection: reject timestamps outside the allowed window.
  const tsNum = parseInt(ts, 10);
  if (isNaN(tsNum)) {
    return { valid: false, reason: "non-numeric timestamp" };
  }
  const ageSecs = Math.floor(Date.now() / 1000) - tsNum;
  if (ageSecs > MAX_TIMESTAMP_AGE_SECS || ageSecs < -60) {
    return { valid: false, reason: `timestamp out of window (age=${ageSecs}s)` };
  }

  // HMAC-SHA256 verification
  const signed = `${ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signed),
  );
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== h1) {
    return { valid: false, reason: "HMAC mismatch" };
  }

  return { valid: true };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Require webhook secret to be configured — hard-fail so misconfiguration
  // is immediately visible in logs rather than silently accepting all events.
  if (!PADDLE_WEBHOOK_SECRET) {
    console.error("CRITICAL: PADDLE_WEBHOOK_SECRET is not set. All webhooks rejected.");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("paddle-signature") ?? "";

  // Verify signature + timestamp
  const { valid, reason } = await verifySignature(rawBody, signatureHeader, PADDLE_WEBHOOK_SECRET);
  if (!valid) {
    console.error("Rejected Paddle webhook:", reason);
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse body
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Idempotency check ─────────────────────────────────────────────────────
  // Paddle retries on 5xx / timeouts. Prevent double-processing using the
  // webhook_events table. The primary key is the Paddle notification ID.
  const eventId: string = (event.notification_id as string)
    ?? (event.event_id as string)
    ?? "";

  if (eventId) {
    const { error: dedupError } = await supabase
      .from("webhook_events")
      .insert({ id: eventId, event_type: (event.event_type as string) ?? "unknown" });

    if (dedupError) {
      if (dedupError.code === "23505") {
        // Duplicate — already processed this event
        console.log("Duplicate webhook event ignored:", eventId);
        return new Response("OK", { status: 200 });
      }
      // Other DB error — log but continue (don't block legitimate processing)
      console.warn("webhook_events insert warning:", dedupError.message);
    }
  }

  const eventType: string = (event.event_type as string)
    ?? (event.notification_type as string)
    ?? "";
  const data = (event.data as Record<string, unknown>) ?? {};

  console.log("Processing Paddle event:", eventType, "id:", eventId);

  const priceToTier = buildPriceToTier();

  // Common subscription fields
  const customerId: string     = (data.customer_id as string) ?? "";
  const subscriptionId: string = (data.id as string) ?? "";
  const items                  = (data.items as Array<Record<string, unknown>>) ?? [];
  const priceId: string        = (items[0]?.price as Record<string, unknown>)?.id as string ?? "";
  const scheduledChange        = data.scheduled_change as Record<string, unknown> | undefined;
  const customData             = (data.custom_data as Record<string, unknown>) ?? {};

  // Resolve user_id: first by paddle_customer_id lookup, then fallback to custom_data
  async function resolveUserId(): Promise<string | null> {
    if (customerId) {
      const { data: row } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("paddle_customer_id", customerId)
        .maybeSingle();
      if (row) return row.user_id as string;
    }
    const uid = (customData.user_id as string) ?? "";
    return uid || null;
  }

  try {
    switch (eventType) {

      // ── Subscription activated or updated ──────────────────────────────────
      case "subscription.activated":
      case "subscription.updated": {
        const tier = priceToTier[priceId];
        if (!tier) {
          console.warn("subscription event: unknown price ID", priceId);
          break;
        }

        const userId = await resolveUserId();
        if (!userId) {
          console.error("subscription event: could not resolve user", customerId);
          break;
        }

        // Determine subscription expiry from scheduled cancellation if present
        const expiresAt: string | null =
          scheduledChange?.action === "cancel"
            ? (scheduledChange.effective_at as string) ?? null
            : null;

        // Grant weekly boost credit when Gold or Platinum activates
        const weeklyBoost = tier === "gold" ? 1 : tier === "platinum" ? 3 : 0;

        const updatePayload: Record<string, unknown> = {
          subscription_tier:      tier,
          paddle_customer_id:     customerId,
          paddle_subscription_id: subscriptionId,
        };
        if (expiresAt) updatePayload.subscription_expires_at = expiresAt;
        if (weeklyBoost > 0) updatePayload.weekly_boosts_remaining = weeklyBoost;

        const { error } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to update subscription tier:", error.message);
        } else {
          console.log(`User ${userId} upgraded to ${tier}`);
        }
        break;
      }

      // ── Subscription cancelled or paused ─────────────────────────────────
      case "subscription.canceled":
      case "subscription.paused": {
        const userId = await resolveUserId();
        if (!userId) {
          console.error("cancel/pause: could not resolve user", customerId);
          break;
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier:      "free",
            paddle_subscription_id: null,
            subscription_expires_at: null,
            weekly_boosts_remaining: 0,
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to downgrade subscription:", error.message);
        } else {
          console.log(`User ${userId} downgraded to free`);
        }
        break;
      }

      // ── Subscription past due (payment failed) ────────────────────────────
      // Downgrade immediately — don't let users ride out on failed payments.
      case "subscription.past_due": {
        const userId = await resolveUserId();
        if (!userId) {
          console.warn("past_due: could not resolve user", customerId);
          break;
        }

        // Set subscription_expires_at to now + 3-day grace period rather than
        // hard-downgrading immediately, giving the user time to update payment.
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

        const { error } = await supabase
          .from("profiles")
          .update({ subscription_expires_at: gracePeriodEnd.toISOString() })
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to set grace period:", error.message);
        } else {
          console.log(`User ${userId} subscription past_due — grace until ${gracePeriodEnd.toISOString()}`);
        }
        break;
      }

      // ── One-time transaction completed ────────────────────────────────────
      case "transaction.completed": {
        const purchaseType: string = (customData.purchase_type as string) ?? "";
        const apartmentId: string  = (customData.apartment_id as string) ?? "";
        const boostDays: number    = Math.min(
          parseInt((customData.boost_days as string) ?? "0", 10),
          30,
        );

        const userId = await resolveUserId();
        if (!userId) {
          console.error("transaction.completed: could not resolve user", customerId);
          break;
        }

        // ── Profile Highlight ─────────────────────────────────────────────
        if (purchaseType === "profile_highlight") {
          const highlightedUntil = new Date();
          highlightedUntil.setDate(highlightedUntil.getDate() + 7); // 7-day highlight

          const { error } = await supabase
            .from("profiles")
            .update({ highlighted_until: highlightedUntil.toISOString() })
            .eq("user_id", userId);

          if (error) {
            console.error("Failed to set highlighted_until:", error.message);
          } else {
            console.log(`User ${userId} highlighted until ${highlightedUntil.toISOString()}`);
          }
          break;
        }

        // ── Instant Message credit ────────────────────────────────────────
        if (purchaseType === "instant_message") {
          // Use an RPC to atomically increment; avoids race conditions if user
          // buys multiple credits quickly.
          const { error } = await supabase.rpc("increment_instant_message_credits", {
            p_user_id: userId,
            p_amount:  1,
          });

          if (error) {
            console.error("Failed to grant instant_message_credits:", error.message);
          } else {
            console.log(`User ${userId} granted 1 instant_message_credit`);
          }
          break;
        }

        // ── Listing boost ──────────────────────────────────────────────────
        if (apartmentId && boostDays > 0) {
          // Verify the apartment belongs to this user before boosting
          const { data: apt, error: aptErr } = await supabase
            .from("apartments")
            .select("user_id")
            .eq("id", apartmentId)
            .maybeSingle();

          if (aptErr || !apt) {
            console.error("Boost: apartment not found:", apartmentId);
            break;
          }
          if (apt.user_id !== userId) {
            console.error("Boost ownership mismatch:", apartmentId, "≠", userId);
            break;
          }

          const featuredUntil = new Date();
          featuredUntil.setDate(featuredUntil.getDate() + boostDays);

          const { error } = await supabase
            .from("apartments")
            .update({
              is_featured:    true,
              featured_until: featuredUntil.toISOString(),
            })
            .eq("id", apartmentId);

          if (error) {
            console.error("Failed to boost apartment:", error.message);
          } else {
            console.log(`Boosted apartment ${apartmentId} for ${boostDays} days`);
          }
        }

        break;
      }

      default:
        console.log("Unhandled Paddle event type:", eventType);
    }
  } catch (err) {
    console.error("Unhandled error in webhook handler:", err);
    // Return 500 so Paddle retries. Deduplication will prevent double-processing.
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
