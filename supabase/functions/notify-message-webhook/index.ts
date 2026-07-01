import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const payload = await req.json();
  // Supabase DB webhook format: { type, table, schema, record, old_record }
  const message = payload.record;
  if (!message?.conversation_id || !message?.sender_id || !message?.content) {
    return new Response("Missing fields", { status: 400 });
  }

  // Get sender name
  const { data: sender } = await supabase
    .from("profiles")
    .select("name")
    .eq("user_id", message.sender_id)
    .maybeSingle();

  // Get all conversation participants except sender
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", message.conversation_id)
    .neq("user_id", message.sender_id);

  if (!participants?.length) {
    return new Response(JSON.stringify({ ok: true, notified: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const senderName = sender?.name ?? "Someone";
  const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify`;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  await Promise.allSettled(
    participants.map(({ user_id }) =>
      fetch(notifyUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
          type: "message",
          title: `${senderName} sent you a message`,
          body: message.content.slice(0, 100),
          actor_id: message.sender_id,
          reference_id: message.conversation_id,
        }),
      })
    )
  );

  return new Response(JSON.stringify({ ok: true, notified: participants.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
