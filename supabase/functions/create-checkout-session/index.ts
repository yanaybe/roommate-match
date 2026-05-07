// Supabase Edge Function: create-checkout-session
// Creates a Stripe Checkout session for Gold or Platinum subscription.
//
// Setup:
//   1. supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//   2. supabase secrets set SITE_URL=https://your-domain.com
//   3. Create products in Stripe dashboard and paste price IDs below
//   4. supabase functions deploy create-checkout-session
//
// Frontend usage:
//   const { data } = await supabase.functions.invoke("create-checkout-session", {
//     body: { priceId: "price_xxx", userId: user.id }
//   });
//   window.location.href = data.url;

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const PRICE_IDS: Record<string, string> = {
  gold: Deno.env.get("STRIPE_GOLD_PRICE_ID") ?? "",
  platinum: Deno.env.get("STRIPE_PLATINUM_PRICE_ID") ?? "",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { priceId, userId, tier } = await req.json();
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId ?? PRICE_IDS[tier], quantity: 1 }],
      success_url: `${siteUrl}/profile?checkout=success`,
      cancel_url: `${siteUrl}/profile?checkout=cancelled`,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
