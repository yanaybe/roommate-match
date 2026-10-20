import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://eu.i.posthog.com";

export function initAnalytics() {
  if (!POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true },
    },
  });
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, traits);
}

export function resetAnalytics() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

// Named event helpers so call-sites don't typo event names
export const analytics = {
  signup: () => track("signup"),
  login: (method = "email") => track("login", { method }),
  onboardingComplete: () => track("onboarding_complete"),
  // Both swipe directions carry the same payload so like-rate can be broken
  // down by match score. IDs only — never names or profile text.
  swipeLike: (targetId: string, matchPercent: number) =>
    track("swipe_like", { target_id: targetId, match_percent: matchPercent }),
  swipeDislike: (targetId: string, matchPercent: number) =>
    track("swipe_dislike", { target_id: targetId, match_percent: matchPercent }),
  match: (matchPercent: number) => track("match", { match_percent: matchPercent }),
  upgradeClick: (source: string, tier?: string) => track("upgrade_click", { source, tier }),
  purchase: (tier: string, amount: number) => track("purchase", { tier, amount }),
  apartmentPost: () => track("apartment_post"),
  apartmentBoost: (days: number) => track("apartment_boost", { days }),
  squadCreate: () => track("squad_create"),
  messageSent: () => track("message_sent"),
  phoneVerified: () => track("phone_verified"),
  dailyLimitHit: (limit: number) => track("daily_like_limit_hit", { limit, tier: "free" }),
};
