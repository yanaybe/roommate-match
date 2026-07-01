import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// DB migrations required (run in Supabase SQL editor before deploying):
//   alter table profiles add column if not exists last_seen timestamptz;
//   create index if not exists profiles_last_seen_idx on profiles(last_seen);
//
//   create table if not exists push_subscriptions (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users(id) on delete cascade,
//     endpoint text not null,
//     p256dh text not null,
//     auth text not null,
//     created_at timestamptz default now(),
//     unique(user_id, endpoint)
//   );
//
// Env var required in .env.local:
//   VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
//   Generate with: npx web-push generate-vapid-keys

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

async function registerPushSubscription(userId: string) {
  if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("push_subscriptions" as any).upsert({
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    }, { onConflict: "user_id,endpoint" });
  } catch (err) {
    console.warn("[RooMatch] Push notification setup failed:", err);
    if (import.meta.env.DEV) {
      console.warn("Ensure VITE_VAPID_PUBLIC_KEY is set in .env");
    }
  }
}

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
  // Guard: onAuthStateChange is the single source of truth. getSession() only
  // seeds state before the first event fires to avoid a flash of wrong state.
  const settled = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Mark as settled so the getSession() fallback below doesn't overwrite
        // with a stale snapshot after the real auth event has already fired.
        settled.current = true;
        setSession(session);
        setLoading(false);
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          supabase.from("profiles").update({ updated_at: new Date().toISOString() }).eq("user_id", session.user.id);
          if (event === "SIGNED_IN") {
            // Request push permission on first login of each session
            registerPushSubscription(session.user.id);
          }
        }
      }
    );

    // getSession() seeds initial state before the first onAuthStateChange event
    // fires (avoids a flash of loading=true on page refresh when the user is
    // already signed in). If onAuthStateChange fired first, settled.current is
    // true and we skip this to avoid overwriting with a stale snapshot.
    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!settled.current) {
        setSession(initial);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear local state immediately so protected routes redirect before the
    // Supabase round-trip completes, preventing stale UI.
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
