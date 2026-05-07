import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// TODO [PRIORITY: HIGH] [AREA: BACKEND]
// Problem: There is no push notification or email notification system. Users who leave the app
//          have no trigger to return. No match alerts, no message notifications, no listing alerts.
//          This is the single biggest gap between a product and a business — without re-engagement,
//          week-2 retention will be near zero.
// Fix: Implement two notification layers:
//      LAYER 1 — Web Push (immediate, free):
//        1. Register a service worker in public/sw.js
//        2. Request notification permission on first login: Notification.requestPermission()
//        3. Store the push subscription in Supabase: table push_subscriptions(user_id, endpoint, keys)
//        4. Trigger push from Supabase Edge Functions on: new match, new message, new listing match
//      LAYER 2 — Email (daily digest, via Resend):
//        1. Daily cron Edge Function: "You have X new matches today in {city}"
//        2. Weekly digest: top 3 new apartments matching their saved search
//        Use Resend (resend.com) — free tier covers 100 emails/day, enough for early stage.
// Expected Result: Users receive timely alerts that bring them back — target 40%+ week-2 retention.

// TODO [PRIORITY: HIGH] [AREA: RETENTION]
// Problem: No daily discovery nudges exist. Users who leave after day 1 have no external
//          trigger to return. Without a "3 new roommates match you 80%+" email, the app is
//          forgotten within 48 hours. Day-2 visit triggers are the single biggest driver of
//          week-2 retention in consumer apps.
// Fix: Supabase Edge Function triggered by pg_cron daily at 10:00am user local time:
//      1. For each user with onboarding_complete = true and last_seen > 24h ago:
//         Query top 3 new profiles in their city with match ≥ 70% since their last_seen timestamp
//      2. If results exist: send email via Resend — subject: "3 new roommates match you in {city}"
//         Body: first name, match %, city, and CTA button "See your matches →" linking to /roommates
//      3. Write last_nudge_sent_at to profiles to prevent duplicate sends on the same day
//      Include a one-click unsubscribe link using a signed token; honor it immediately.
// Expected Result: 30–40% improvement in D7 retention among users who receive the daily digest.

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          // TODO [PRIORITY: HIGH] [AREA: BACKEND]
          // Problem: This line updates last_seen on the profiles table, but the last_seen column
          //          does NOT exist in the DB schema by default. Without the migration, this update
          //          silently fails (Supabase ignores unknown columns in some client versions, or throws).
          //          The "Active today" badge on SwipeCard will never show for any user.
          // Fix: Run this migration in the Supabase SQL editor BEFORE deploying this code:
          //      alter table profiles add column if not exists last_seen timestamptz;
          //      create index if not exists profiles_last_seen_idx on profiles(last_seen);
          //      Also add last_seen to the profiles RLS policies if they restrict columns explicitly.
          // Expected Result: last_seen is persisted correctly and the "Active today" badge works in production.
          supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
