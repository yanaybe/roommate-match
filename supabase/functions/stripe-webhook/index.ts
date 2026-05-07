// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events to sync subscription state to the profiles table.
//
// Setup:
//   1. supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//   2. supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...  (from Stripe dashboard → Webhooks)
//   3. supabase functions deploy stripe-webhook
//   4. In Stripe dashboard, add webhook endpoint:
//      URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//      Events: checkout.session.completed, customer.subscription.deleted, customer.subscription.updated

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const PRICE_TO_TIER: Record<string, string> = {
  [Deno.env.get("STRIPE_GOLD_PRICE_ID") ?? ""]: "gold",
  [Deno.env.get("STRIPE_PLATINUM_PRICE_ID") ?? ""]: "platinum",
};

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature ?? "",
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (!userId) return new Response("Missing userId", { status: 400 });

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const priceId = subscription.items.data[0]?.price.id ?? "";
    const tier = PRICE_TO_TIER[priceId] ?? "gold";

    await supabase.from("profiles").update({
      subscription_tier: tier,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
    } as any).eq("user_id", userId);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (userId) {
      await supabase.from("profiles").update({ subscription_tier: "free" } as any).eq("user_id", userId);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (userId) {
      const priceId = sub.items.data[0]?.price.id ?? "";
      const tier = sub.status === "active" ? (PRICE_TO_TIER[priceId] ?? "free") : "free";
      await supabase.from("profiles").update({ subscription_tier: tier } as any).eq("user_id", userId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
