// RoomMatch Email Notification Edge Function
// Triggered by DB webhooks on: messages INSERT, liked_profiles INSERT
//
// Secrets required (set in Lovable Cloud → Secrets):
//   RESEND_API_KEY   — from resend.com
//   FROM_EMAIL       — e.g. "RoomMatch <noreply@yourdomain.com>"
//   WEBHOOK_SECRET   — must match the Authorization header sent by DB webhook

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "RoomMatch <noreply@roomatch.app>";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}

async function getProfileEmail(
  supabase: any,
  userId: string
): Promise<{ email: string; name: string } | null> {
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("user_id", userId)
    .maybeSingle();
  return { email, name: profile?.name ?? "there" };
}

function matchEmailHtml(recipientName: string, matchName: string): string {
  return `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">🎉</div>
    <h2 style="color:#7c3aed;">It's a Match!</h2>
    <p>Hi ${recipientName},</p>
    <p>You and <strong>${matchName}</strong> liked each other on RoomMatch!</p>
    <p style="color:#6b7280;">Start a conversation and find out if you'd make great roommates.</p>
    <a href="https://roomatch.app/chats"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:16px;">
      Say Hello 👋
    </a>
    <p style="color:#9ca3af;font-size:12px;margin-top:32px;">RoomMatch — Find your perfect roommate</p>
  </div>`;
}

function messageEmailHtml(recipientName: string, senderName: string, preview: string): string {
  return `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
    <h2 style="color:#7c3aed;">New Message on RoomMatch 💬</h2>
    <p>Hi ${recipientName},</p>
    <p><strong>${senderName}</strong> sent you a message:</p>
    <blockquote style="background:#f3f4f6;border-left:4px solid #7c3aed;margin:16px 0;padding:12px 16px;border-radius:4px;">
      <p style="margin:0;color:#374151;">${preview}</p>
    </blockquote>
    <a href="https://roomatch.app/chats"
       style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
      Reply Now
    </a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">You received this because you have a conversation on RoomMatch.</p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Verify webhook secret
  const authHeader = req.headers.get("Authorization") ?? "";
  if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    console.error("Invalid webhook secret");
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── New message → email recipient ──────────────────────────────────────
    if (payload.table === "messages" && payload.type === "INSERT") {
      const msg = payload.record;

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", msg.conversation_id)
        .neq("user_id", msg.sender_id);

      if (!participants?.length) return new Response("OK", { status: 200 });

      const sender = await getProfileEmail(supabase, msg.sender_id);
      const senderName = sender?.name ?? "Someone";

      for (const { user_id } of participants) {
        const recipient = await getProfileEmail(supabase, user_id);
        if (!recipient) continue;
        const preview = msg.content.substring(0, 200) + (msg.content.length > 200 ? "…" : "");
        await sendEmail(
          recipient.email,
          `${senderName} sent you a message on RoomMatch`,
          messageEmailHtml(recipient.name, senderName, preview)
        );
      }
    }

    // ── New like → check for mutual match → email both ─────────────────────
    if (payload.table === "liked_profiles" && payload.type === "INSERT") {
      const { user_id, liked_user_id } = payload.record;

      const { data: reciprocal } = await supabase
        .from("liked_profiles")
        .select("id")
        .eq("user_id", liked_user_id)
        .eq("liked_user_id", user_id)
        .maybeSingle();

      if (!reciprocal) return new Response("OK", { status: 200 });

      const [user1, user2] = await Promise.all([
        getProfileEmail(supabase, user_id),
        getProfileEmail(supabase, liked_user_id),
      ]);

      if (user1 && user2) {
        await Promise.all([
          sendEmail(
            user1.email,
            `You matched with ${user2.name} on RoomMatch! 🎉`,
            matchEmailHtml(user1.name, user2.name)
          ),
          sendEmail(
            user2.email,
            `You matched with ${user1.name} on RoomMatch! 🎉`,
            matchEmailHtml(user2.name, user1.name)
          ),
        ]);
      }
    }
  } catch (err) {
    console.error("send-email error:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
