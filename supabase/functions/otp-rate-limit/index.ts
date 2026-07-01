import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // This function is called by the browser client with the anon key.
  // It uses the service role internally so it can write to auth_rate_limits
  // (which has RLS enabled with no policies, blocking anon/authenticated roles).
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: { identifier: string; action: string; failed: boolean };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  if (!body.identifier || !body.action) {
    return new Response(JSON.stringify({ error: "Missing identifier or action" }), { status: 400 });
  }

  // Sanitize identifier
  const identifier = body.identifier.trim().toLowerCase();
  const action = body.action;

  // Use service role for DB writes (auth_rate_limits has no RLS policies)
  const supabase = createClient(supabaseUrl, serviceKey);

  // Check current state
  const { data: existing } = await supabase
    .from("auth_rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .eq("action", action)
    .maybeSingle();

  // If locked and lockout hasn't expired, reject immediately
  if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
    return new Response(
      JSON.stringify({
        allowed: false,
        attempts: existing.attempts,
        locked_until: existing.locked_until,
      }),
      { status: 200 },
    );
  }

  if (body.failed === false) {
    // Success — reset the rate limit record
    await supabase
      .from("auth_rate_limits")
      .delete()
      .eq("identifier", identifier)
      .eq("action", action);

    return new Response(
      JSON.stringify({ allowed: true, attempts: 0, locked_until: null }),
      { status: 200 },
    );
  }

  // Failed attempt — increment counter, lock if threshold reached
  const newAttempts = (existing?.attempts ?? 0) + 1;
  const shouldLock = newAttempts >= MAX_ATTEMPTS;
  const lockedUntil = shouldLock
    ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
    : null;

  await supabase.from("auth_rate_limits").upsert(
    {
      identifier,
      action,
      attempts: newAttempts,
      locked_until: lockedUntil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "identifier,action" },
  );

  return new Response(
    JSON.stringify({
      allowed: !shouldLock,
      attempts: newAttempts,
      locked_until: lockedUntil,
    }),
    { status: 200 },
  );
});
