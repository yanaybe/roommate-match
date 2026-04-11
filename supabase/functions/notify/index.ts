// RoomMatch Email Notification Edge Function
// Handles: new match notifications, new message notifications
//
// SETUP:
//   1. Get a free API key from https://resend.com
//   2. Run: supabase secrets set RESEND_API_KEY=re_xxxx FROM_EMAIL=noreply@yourdomain.com
//   3. Deploy: supabase functions deploy notify
//   4. Run the migration 20260409000001_notify_webhooks.sql to wire up DB triggers

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "RoomMatch <noreply@roomatch.app>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
  }
}

async function getProfileEmail(supabase: any, userId: string): Promise<{ email: string; name: string } | null> {
  // Get email from auth.users (requires service role)
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

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify the request comes from Supabase (basic auth)
  const authHeader = req.headers.get("Authorization");
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload: WebhookPayload = await req.json();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // --- New message notification ---
    if (payload.table === "messages" && payload.type === "INSERT") {
      const msg = payload.record;

      // Get all participants in this conversation except the sender
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", msg.conversation_id)
        .neq("user_id", msg.sender_id);

      if (!participants?.length) {
        return new Response("OK", { status: 200 });
      }

      // Get sender name
      const sender = await getProfileEmail(supabase, msg.sender_id);
      const senderName = sender?.name ?? "Someone";

      for (const { user_id } of participants) {
        const recipient = await getProfileEmail(supabase, user_id);
        if (!recipient) continue;

        await sendEmail(
          recipient.email,
          `${senderName} sent you a message on RoomMatch`,
          `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #7c3aed;">New Message on RoomMatch 💬</h2>
            <p>Hi ${recipient.name},</p>
            <p><strong>${senderName}</strong> sent you a new message:</p>
            <blockquote style="background: #f3f4f6; border-left: 4px solid #7c3aed; margin: 16px 0; padding: 12px 16px; border-radius: 4px;">
              <p style="margin: 0; color: #374151;">${msg.content.substring(0, 200)}${msg.content.length > 200 ? "..." : ""}</p>
            </blockquote>
            <a href="https://roomatch.app/chats" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
              Reply Now
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
              You received this because you have a conversation on RoomMatch.
            </p>
          </div>
          `
        );
      }
    }

    // --- New match notification ---
    // A match happens when a new liked_profiles record is inserted AND
    // a reciprocal like already exists
    if (payload.table === "liked_profiles" && payload.type === "INSERT") {
      const { user_id, liked_user_id } = payload.record;

      // Check if the other person already liked back
      const { data: reciprocal } = await supabase
        .from("liked_profiles")
        .select("id")
        .eq("user_id", liked_user_id)
        .eq("liked_user_id", user_id)
        .maybeSingle();

      if (!reciprocal) {
        return new Response("OK", { status: 200 }); // Not a match yet
      }

      // It's a match! Notify both users
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
    console.error("Notification error:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});

function matchEmailHtml(recipientName: string, matchName: string): string {
  return `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
    <h2 style="color: #7c3aed;">It's a Match!</h2>
    <p>Hi ${recipientName},</p>
    <p>You and <strong>${matchName}</strong> liked each other on RoomMatch!</p>
    <p style="color: #6b7280;">Start a conversation and find out if you'd make great roommates.</p>
    <a href="https://roomatch.app/chats" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 16px;">
      Say Hello 👋
    </a>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
      RoomMatch — Find your perfect roommate
    </p>
  </div>
  `;
}
