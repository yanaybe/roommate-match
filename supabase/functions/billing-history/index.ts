import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PADDLE_API_URL = Deno.env.get("PADDLE_ENV") === "production"
  ? "https://api.paddle.com"
  : "https://sandbox-api.paddle.com";

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch the user's Paddle customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("paddle_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.paddle_customer_id) {
    return new Response(JSON.stringify({ transactions: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!PADDLE_API_KEY) {
    console.error("PADDLE_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Billing service unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch transactions from Paddle API
  const paddleRes = await fetch(
    `${PADDLE_API_URL}/transactions?customer_id=${profile.paddle_customer_id}&per_page=50&order_by=created_at[DESC]`,
    {
      headers: {
        Authorization: `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!paddleRes.ok) {
    console.error("Paddle API error:", paddleRes.status, await paddleRes.text());
    return new Response(JSON.stringify({ error: "Could not fetch billing history" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const paddleData = await paddleRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTransactions: any[] = paddleData.data ?? [];

  // Sanitize and normalize Paddle transaction format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions = rawTransactions.map((tx: any) => ({
    id: tx.id,
    date: tx.billed_at ?? tx.created_at,
    description: tx.details?.line_items?.[0]?.product?.name ?? "Roomatch Purchase",
    amount: `₪${((tx.details?.totals?.grand_total ?? 0) / 100).toFixed(2)}`,
    status: tx.status === "completed" ? "completed"
          : tx.status === "billed"    ? "completed"
          : tx.status === "canceled"  ? "failed"
          : tx.status === "refunded"  ? "refunded"
          : "pending",
    type: tx.custom_data?.boost_days
          ? "boost"
          : tx.details?.line_items?.[0]?.product?.type === "standard"
          ? "subscription"
          : "extra",
  }));

  return new Response(JSON.stringify({ transactions }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
