// Single source of truth for subscription pricing.
// Consumed by Landing, Pricing, and PremiumSheet — keep numbers ONLY here so
// marketing pages can never drift from the checkout sheet again.

export const FREE_DAILY_LIKES = 10;

export const PLAN_PRICES = {
  plus: { monthly: 19, annual: 129 },
  gold: { monthly: 29, annual: 199 },
  platinum: { monthly: 39, annual: 279 },
} as const;

export type PaidPlanId = keyof typeof PLAN_PRICES;

export const ANNUAL_PRICES: Record<string, number> = {
  plus: PLAN_PRICES.plus.annual,
  gold: PLAN_PRICES.gold.annual,
  platinum: PLAN_PRICES.platinum.annual,
};
