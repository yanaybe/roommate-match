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
  religious_level: string;
  alcohol: string;
  pets: boolean;
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

/**
 * Calculate match percentage between two user profiles (0-100)
 */
export function calculateUserMatch(a: ProfileData, b: ProfileData): number {
  const scores: { weight: number; score: number }[] = [];

  // Sleep schedule (important) 
  scores.push({ weight: 12, score: exactMatch(a.sleep_schedule, b.sleep_schedule) });

  // Cleanliness (very important)
  scores.push({ weight: 15, score: numericSimilarity(a.cleanliness, b.cleanliness, 4) });

  // Social level
  scores.push({ weight: 10, score: numericSimilarity(a.social_level, b.social_level, 4) });

  // Noise level
  scores.push({ weight: 10, score: numericSimilarity(a.noise_level, b.noise_level, 4) });

  // Smoking (deal-breaker weight)
  scores.push({ weight: 15, score: a.smoking === b.smoking ? 1 : 0.1 });

  // Pets 
  scores.push({ weight: 8, score: a.pets === b.pets ? 1 : 0.5 });

  // WFH compatibility
  scores.push({ weight: 5, score: a.wfh === b.wfh ? 1 : 0.7 });

  // Budget similarity
  scores.push({ weight: 8, score: numericSimilarity(a.budget, b.budget, 5000) });

  // Cooking habits
  scores.push({ weight: 3, score: ordinalMatch(a.cooking_habits, b.cooking_habits, frequencyScale) });

  // Shared space org
  scores.push({ weight: 5, score: ordinalMatch(a.shared_space_org, b.shared_space_org, orgScale) });

  // Religious level
  scores.push({ weight: 4, score: ordinalMatch(a.religious_level, b.religious_level, religiousScale) });

  // Alcohol
  scores.push({ weight: 3, score: ordinalMatch(a.alcohol, b.alcohol, alcoholScale) });

  // Partying
  scores.push({ weight: 5, score: ordinalMatch(a.partying, b.partying, frequencyScale) });

  // Guests
  scores.push({ weight: 3, score: ordinalMatch(a.guests, b.guests, frequencyScale) });

  // Lifestyle vibe
  scores.push({ weight: 7, score: exactMatch(a.lifestyle_vibe, b.lifestyle_vibe) });

  // Age preference check (bonus/penalty)
  if (a.age && b.age) {
    const aInRange = b.age >= a.preferred_age_min && b.age <= a.preferred_age_max;
    const bInRange = a.age >= b.preferred_age_min && a.age <= b.preferred_age_max;
    scores.push({ weight: 5, score: (aInRange ? 0.5 : 0) + (bInRange ? 0.5 : 0) });
  }

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = scores.reduce((sum, s) => sum + s.weight * s.score, 0);

  return Math.round((weightedSum / totalWeight) * 100);
}

/**
 * Calculate match between a user and an apartment (room + roommates)
 */
export function calculateRoomMatch(
  userProfile: ProfileData,
  roomPrice: number,
  roommateProfiles: ProfileData[]
): number {
  // Room compatibility (budget match)
  const budgetDiff = Math.abs(userProfile.budget - roomPrice);
  const budgetScore = Math.max(0, 1 - budgetDiff / 3000);

  if (roommateProfiles.length === 0) {
    return Math.round(budgetScore * 100);
  }

  // Average roommate compatibility
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

  // 2. Preference alignment (20%) — deal-breakers
  let prefScore = 1;
  if (squad.no_smoking && userProfile.smoking) prefScore -= 0.4;
  if (!squad.pet_friendly && userProfile.pets) prefScore -= 0.2;
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
  let memberScore = 0.75; // default when no members to compare
  if (memberProfiles.length > 0) {
    const scores = memberProfiles.map((m) => calculateUserMatch(userProfile, m));
    memberScore = scores.reduce((a, b) => a + b, 0) / scores.length / 100;
  }

  const finalScore = budgetScore * 20 + prefScore * 20 + memberScore * 60;
  return Math.round(finalScore);
}
