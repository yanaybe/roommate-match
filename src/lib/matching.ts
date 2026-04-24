// Matching algorithm based on user profiles

export interface ProfileData {
  name: string;
  age: number | null;
  city: string;
  occupation: string;
  budget: number;
  desired_room_type: string;
  sleep_schedule: string;
  cleanliness: number;
  cooking_habits: string;
  shared_space_org: string;
  smoking: boolean;
  smoking_preference: string; // "I smoke" | "Non-smoker, okay with smokers" | "Non-smoker, prefer no smoking"
  religious_level: string;
  alcohol: string;
  pets: boolean;
  pet_preference: string; // "I have pets" | "No pets, but okay with them" | "Prefer no pets"
  fitness: string;
  wfh: boolean;
  guests: string;
  social_level: number;
  noise_level: number;
  partying: string;
  lifestyle_vibe: string;
  preferred_age_min: number;
  preferred_age_max: number;
  gender_preference: string;
  lifestyle_similarity: string;
  cleanliness_expectations: number;
  activity_hours: string;
  bio: string;
}

function numericSimilarity(a: number, b: number, max: number): number {
  return 1 - Math.abs(a - b) / max;
}

function exactMatch(a: string, b: string): number {
  return a === b ? 1 : 0;
}

function ordinalMatch(a: string, b: string, scale: string[]): number {
  const ai = scale.indexOf(a);
  const bi = scale.indexOf(b);
  if (ai === -1 || bi === -1) return 0.5;
  return 1 - Math.abs(ai - bi) / (scale.length - 1);
}

const frequencyScale = ["Never", "Rarely", "Sometimes", "Occasionally", "Often", "Frequently", "Daily"];
const religiousScale = ["Not religious", "Somewhat", "Traditional", "Very religious"];
const alcoholScale = ["Never", "Socially", "Often"];
const orgScale = ["Relaxed", "Moderate", "Very organized"];
const sleepScale = ["Early bird", "Flexible", "Night owl"];

/**
 * Calculate match percentage between two user profiles (0-100).
 *
 * Architecture: penalty-first.
 *   finalScore = max(5, baseCompatibility - dealBreakerPenalties)
 *
 * Deal-breakers are computed first and can tank the score regardless of how
 * well everything else aligns. Base compatibility covers lifestyle factors.
 */
export function calculateUserMatch(a: ProfileData, b: ProfileData): number {
  // ─── Layer 1: Deal-breaker penalties ──────────────────────────────────────

  let penalties = 0;

  // Smoking: penalty only when someone smokes AND the other explicitly minds.
  // "Non-smoker, okay with smokers" → no conflict even if partner smokes.
  const aSmokes = a.smoking_preference === "I smoke";
  const bSmokes = b.smoking_preference === "I smoke";
  const aMindsSmoking = a.smoking_preference === "Non-smoker, prefer no smoking";
  const bMindsSmoking = b.smoking_preference === "Non-smoker, prefer no smoking";
  if ((aSmokes && bMindsSmoking) || (bSmokes && aMindsSmoking)) {
    penalties += 35;
  }

  // Pets: same logic — only penalise when pets are present AND partner minds.
  const aHasPets = a.pet_preference === "I have pets";
  const bHasPets = b.pet_preference === "I have pets";
  const aMindsPets = a.pet_preference === "Prefer no pets";
  const bMindsPets = b.pet_preference === "Prefer no pets";
  if ((aHasPets && bMindsPets) || (bHasPets && aMindsPets)) {
    penalties += 20;
  }

  // Religious compatibility: asymmetric — the more religious person's comfort
  // drives the penalty. A Very religious person has a much harder time with
  // a 3-step gap than a Not religious person does.
  const aRelIdx = religiousScale.indexOf(a.religious_level);
  const bRelIdx = religiousScale.indexOf(b.religious_level);
  if (aRelIdx !== -1 && bRelIdx !== -1) {
    const gap = Math.abs(aRelIdx - bRelIdx);
    if (gap > 0) {
      const moreReligiousIdx = Math.max(aRelIdx, bRelIdx);
      const basePenalty = gap === 1 ? 8 : gap === 2 ? 20 : 35;
      // amplifier: 0.5 (least religious) → 1.0 (very religious)
      const amplifier = 0.5 + 0.5 * (moreReligiousIdx / (religiousScale.length - 1));
      penalties += Math.round(basePenalty * amplifier);
    }
  }

  // Cleanliness: asymmetric — what matters is how much a person's actual
  // cleanliness falls short of the partner's expectations, in both directions.
  const cleanConflict =
    Math.max(0, a.cleanliness_expectations - b.cleanliness) +
    Math.max(0, b.cleanliness_expectations - a.cleanliness);
  if (cleanConflict >= 5) penalties += 22;
  else if (cleanConflict >= 3) penalties += 14;
  else if (cleanConflict >= 2) penalties += 8;
  else if (cleanConflict >= 1) penalties += 3;

  // Sleep schedule: Early bird vs Night owl is a concrete daily conflict.
  const aSleepIdx = sleepScale.indexOf(a.sleep_schedule);
  const bSleepIdx = sleepScale.indexOf(b.sleep_schedule);
  if (aSleepIdx !== -1 && bSleepIdx !== -1) {
    const sleepGap = Math.abs(aSleepIdx - bSleepIdx);
    if (sleepGap === 2) penalties += 18; // Early bird ↔ Night owl
    else if (sleepGap === 1) penalties += 5;
  }

  // Budget: extreme gap means they won't realistically target the same flat.
  if (a.budget > 0 && b.budget > 0) {
    const avg = (a.budget + b.budget) / 2;
    const ratio = Math.abs(a.budget - b.budget) / avg;
    if (ratio > 0.6) penalties += 12;
    else if (ratio > 0.4) penalties += 7;
    else if (ratio > 0.25) penalties += 3;
  }

  // ─── Layer 2: Base compatibility score ────────────────────────────────────
  // Smoking and religion are excluded here — they're handled as deal-breakers.

  const scores: { weight: number; score: number }[] = [];

  // Social level (15%)
  scores.push({ weight: 15, score: numericSimilarity(a.social_level, b.social_level, 4) });

  // Noise level (13%)
  scores.push({ weight: 13, score: numericSimilarity(a.noise_level, b.noise_level, 4) });

  // Lifestyle vibe (10%)
  scores.push({ weight: 10, score: exactMatch(a.lifestyle_vibe, b.lifestyle_vibe) });

  // Guests frequency (8%)
  scores.push({ weight: 8, score: ordinalMatch(a.guests, b.guests, frequencyScale) });

  // Partying (8%)
  scores.push({ weight: 8, score: ordinalMatch(a.partying, b.partying, frequencyScale) });

  // WFH (7%) — both WFH means shared kitchen/space during the day, relevant
  scores.push({ weight: 7, score: a.wfh === b.wfh ? 1 : 0.6 });

  // Cooking habits (6%)
  scores.push({ weight: 6, score: ordinalMatch(a.cooking_habits, b.cooking_habits, frequencyScale) });

  // Activity hours (5%) — both Flexible = perfect, one Flexible = good, mismatch = low
  const aFlex = a.activity_hours === "Flexible";
  const bFlex = b.activity_hours === "Flexible";
  const actScore =
    aFlex && bFlex ? 1 :
    aFlex || bFlex ? 0.8 :
    a.activity_hours === b.activity_hours ? 1 : 0.3;
  scores.push({ weight: 5, score: actScore });

  // Shared space org (4%)
  scores.push({ weight: 4, score: ordinalMatch(a.shared_space_org, b.shared_space_org, orgScale) });

  // Alcohol (4%)
  scores.push({ weight: 4, score: ordinalMatch(a.alcohol, b.alcohol, alcoholScale) });

  // Age range mutual fit (3%)
  if (a.age && b.age) {
    const aInRange = b.age >= a.preferred_age_min && b.age <= a.preferred_age_max;
    const bInRange = a.age >= b.preferred_age_min && a.age <= b.preferred_age_max;
    scores.push({ weight: 3, score: (aInRange ? 0.5 : 0) + (bInRange ? 0.5 : 0) });
  }

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = scores.reduce((sum, s) => sum + s.weight * s.score, 0);
  const baseScore = (weightedSum / totalWeight) * 100;

  return Math.max(5, Math.round(baseScore - penalties));
}

export interface MatchFactor {
  label: string;
  emoji: string;
  score: number; // 0–100
  detail: string; // e.g. "You're both early birds"
  isConflict: boolean;
}

/**
 * Returns the top driving factors behind a match score so the UI can
 * explain *why* two users are (or aren't) compatible.
 */
export function calculateUserMatchBreakdown(a: ProfileData, b: ProfileData): MatchFactor[] {
  const factors: MatchFactor[] = [];
  const aName = a.name ?? "You";
  const bName = b.name ?? "Them";

  // ── Deal-breakers ──────────────────────────────────────────────────────────
  const aSmokes = a.smoking_preference === "I smoke";
  const bSmokes = b.smoking_preference === "I smoke";
  const aMindsSmoking = a.smoking_preference === "Non-smoker, prefer no smoking";
  const bMindsSmoking = b.smoking_preference === "Non-smoker, prefer no smoking";
  const smokingConflict = (aSmokes && bMindsSmoking) || (bSmokes && aMindsSmoking);
  factors.push({
    label: "Smoking",
    emoji: smokingConflict ? "🚬" : "🚭",
    score: smokingConflict ? 0 : 100,
    detail: smokingConflict
      ? `${aSmokes ? aName : bName} smokes but ${bMindsSmoking ? bName : aName} prefers no smoking`
      : "Compatible smoking preferences",
    isConflict: smokingConflict,
  });

  const aHasPets = a.pet_preference === "I have pets";
  const bHasPets = b.pet_preference === "I have pets";
  const aMindsPets = a.pet_preference === "Prefer no pets";
  const bMindsPets = b.pet_preference === "Prefer no pets";
  const petConflict = (aHasPets && bMindsPets) || (bHasPets && aMindsPets);
  factors.push({
    label: "Pets",
    emoji: "🐾",
    score: petConflict ? 10 : 100,
    detail: petConflict
      ? `${aHasPets ? aName : bName} has pets but ${bMindsPets ? bName : aName} prefers none`
      : "Compatible pet preferences",
    isConflict: petConflict,
  });

  // Sleep schedule
  const sleepGap = Math.abs(sleepScale.indexOf(a.sleep_schedule) - sleepScale.indexOf(b.sleep_schedule));
  const sleepScore = sleepGap === 0 ? 100 : sleepGap === 1 ? 65 : 20;
  factors.push({
    label: "Sleep Schedule",
    emoji: "🌙",
    score: sleepScore,
    detail: a.sleep_schedule === b.sleep_schedule
      ? `You're both ${a.sleep_schedule.toLowerCase()}s`
      : `${a.sleep_schedule} vs ${b.sleep_schedule}`,
    isConflict: sleepGap === 2,
  });

  // Cleanliness
  const cleanConflict =
    Math.max(0, a.cleanliness_expectations - b.cleanliness) +
    Math.max(0, b.cleanliness_expectations - a.cleanliness);
  const cleanScore = cleanConflict >= 5 ? 10 : cleanConflict >= 3 ? 35 : cleanConflict >= 2 ? 60 : cleanConflict >= 1 ? 80 : 100;
  factors.push({
    label: "Cleanliness",
    emoji: "✨",
    score: cleanScore,
    detail: cleanConflict === 0
      ? "Cleanliness levels align"
      : `Cleanliness mismatch — ${aName} ${a.cleanliness}/5, ${bName} ${b.cleanliness}/5`,
    isConflict: cleanConflict >= 3,
  });

  // Social level
  const socialSim = numericSimilarity(a.social_level, b.social_level, 4);
  factors.push({
    label: "Social Life",
    emoji: "🎉",
    score: Math.round(socialSim * 100),
    detail: Math.abs(a.social_level - b.social_level) <= 1
      ? "Similar social energy"
      : `${aName} (${a.social_level}/5) vs ${bName} (${b.social_level}/5)`,
    isConflict: Math.abs(a.social_level - b.social_level) >= 3,
  });

  // Noise level
  const noiseSim = numericSimilarity(a.noise_level, b.noise_level, 4);
  factors.push({
    label: "Noise Level",
    emoji: "🔊",
    score: Math.round(noiseSim * 100),
    detail: Math.abs(a.noise_level - b.noise_level) <= 1
      ? "Similar noise tolerance"
      : `${aName} prefers ${a.noise_level}/5, ${bName} ${b.noise_level}/5`,
    isConflict: Math.abs(a.noise_level - b.noise_level) >= 3,
  });

  // Lifestyle vibe
  const vibeMatch = a.lifestyle_vibe === b.lifestyle_vibe;
  factors.push({
    label: "Lifestyle Vibe",
    emoji: "🌟",
    score: vibeMatch ? 100 : 45,
    detail: vibeMatch
      ? `You're both "${a.lifestyle_vibe}"`
      : `${aName}: "${a.lifestyle_vibe}" · ${bName}: "${b.lifestyle_vibe}"`,
    isConflict: false,
  });

  // Budget
  let budgetScore = 100;
  let budgetDetail = "Budgets align well";
  if (a.budget > 0 && b.budget > 0) {
    const avg = (a.budget + b.budget) / 2;
    const ratio = Math.abs(a.budget - b.budget) / avg;
    if (ratio > 0.6) { budgetScore = 25; budgetDetail = `Large budget gap — ₪${a.budget.toLocaleString()} vs ₪${b.budget.toLocaleString()}`; }
    else if (ratio > 0.4) { budgetScore = 50; budgetDetail = `Budget gap — ₪${a.budget.toLocaleString()} vs ₪${b.budget.toLocaleString()}`; }
    else if (ratio > 0.25) { budgetScore = 75; budgetDetail = `Slight budget difference`; }
    else { budgetDetail = `₪${a.budget.toLocaleString()} · ₪${b.budget.toLocaleString()}`; }
  }
  factors.push({
    label: "Budget",
    emoji: "💰",
    score: budgetScore,
    detail: budgetDetail,
    isConflict: budgetScore < 40,
  });

  // Sort: conflicts first, then by score ascending so worst issues surface
  return factors.sort((x, y) => {
    if (x.isConflict !== y.isConflict) return x.isConflict ? -1 : 1;
    return x.score - y.score;
  });
}

/**
 * Calculate match between a user and an apartment (room + roommates)
 */
export function calculateRoomMatch(
  userProfile: ProfileData,
  roomPrice: number,
  roommateProfiles: ProfileData[]
): number {
  const budgetDiff = Math.abs(userProfile.budget - roomPrice);
  const budgetScore = Math.max(0, 1 - budgetDiff / 3000);

  if (roommateProfiles.length === 0) {
    return Math.round(budgetScore * 100);
  }

  const roommateScores = roommateProfiles.map((rm) => calculateUserMatch(userProfile, rm));
  const avgRoommateMatch = roommateScores.reduce((a, b) => a + b, 0) / roommateScores.length;

  // 30% room/budget, 70% roommate compatibility
  const finalScore = budgetScore * 30 + (avgRoommateMatch / 100) * 70;

  return Math.round(finalScore);
}

/**
 * Calculate compatibility between a user and a squad.
 * Considers: lifestyle match with existing members (60%), budget fit (20%), preference alignment (20%).
 */
export function calculateSquadMatch(
  userProfile: ProfileData,
  squad: { budget_min: number; budget_max: number; no_smoking: boolean; pet_friendly: boolean; min_cleanliness: number; preferred_locations: string[] },
  memberProfiles: ProfileData[]
): number {
  // 1. Budget fit (20%)
  const inBudget = userProfile.budget >= squad.budget_min && userProfile.budget <= squad.budget_max;
  const budgetScore = inBudget ? 1 : Math.max(0, 1 - Math.min(
    Math.abs(userProfile.budget - squad.budget_min),
    Math.abs(userProfile.budget - squad.budget_max)
  ) / 2000);

  // 2. Preference alignment (20%) — squad hard rules
  let prefScore = 1;
  if (squad.no_smoking && userProfile.smoking_preference === "I smoke") prefScore -= 0.4;
  if (!squad.pet_friendly && userProfile.pet_preference === "I have pets") prefScore -= 0.2;
  if (userProfile.cleanliness < squad.min_cleanliness) {
    prefScore -= 0.3 * (squad.min_cleanliness - userProfile.cleanliness) / 4;
  }
  if (squad.preferred_locations.length > 0) {
    const cityMatch = squad.preferred_locations.some(
      (loc) => loc.toLowerCase() === userProfile.city.toLowerCase()
    );
    if (cityMatch) prefScore = Math.min(1, prefScore + 0.1);
  }
  prefScore = Math.max(0, prefScore);

  // 3. Member compatibility (60%)
  let memberScore = 0.75;
  if (memberProfiles.length > 0) {
    const scores = memberProfiles.map((m) => calculateUserMatch(userProfile, m));
    memberScore = scores.reduce((a, b) => a + b, 0) / scores.length / 100;
  }

  const finalScore = budgetScore * 20 + prefScore * 20 + memberScore * 60;
  return Math.round(finalScore);
}
