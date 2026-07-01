import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

// notify is a server-to-server function; no browser client should ever call it.
// CORS headers are included only so Supabase CLI tooling (which uses XHR) can reach it.
// Set ALLOWED_ORIGIN via: supabase secrets set ALLOWED_ORIGIN=https://roomatch.co
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN");
const corsHeaders = allowedOrigin
  ? {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    }
  : {};

const BodySchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(["match", "squad_invite", "squad_deleted", "message"]),
  title: z.string().min(1).max(500),
  body: z.string().max(1000).nullable().optional(),
  actor_id: z.string().uuid().nullable().optional(),
  reference_id: z.string().max(255).nullable().optional(),
});

const ipCallLog = new Map<string, number[]>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 5 * 60 * 1000;
  const calls = (ipCallLog.get(ip) ?? []).filter((t) => now - t < window);
  calls.push(now);
  ipCallLog.set(ip, calls);
  if (calls.length > 10) {
    console.warn(`[notify] High call volume from IP ${ip}: ${calls.length} calls in 5 min — possible service key leak`);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  const clientIp = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkIpRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const enc = new TextEncoder();
  const a = enc.encode(authHeader);
  const b = enc.encode(`Bearer ${serviceKey}`);
  const isServiceRole = a.length === b.length && crypto.subtle.timingSafeEqual(a, b);

  if (!isServiceRole) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let parsed;
  try {
    const json = await req.json();
    parsed = BodySchema.safeParse(json);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { user_id, type, title, body, actor_id, reference_id } = parsed.data;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
  );

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id,
      type,
      title,
      body: body ?? null,
      actor_id: actor_id ?? null,
      reference_id: reference_id ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fire-and-forget push notification — don't await so it doesn't block the response
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  fetch(`${supabaseUrl}/functions/v1/send-push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      user_id: user_id,
      title: title,
      body: body ?? undefined,
    }),
  }).catch((err) => console.error("[notify] send-push fire-and-forget failed:", err));

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
