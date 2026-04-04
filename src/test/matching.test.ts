import { describe, it, expect } from "vitest";
import { calculateUserMatch, calculateRoomMatch, calculateSquadMatch } from "@/lib/matching";
import type { ProfileData } from "@/lib/matching";

const base: ProfileData = {
  name: "Alice",
  age: 25,
  city: "Tel Aviv",
  occupation: "Engineer",
  budget: 3500,
  desired_room_type: "Private",
  sleep_schedule: "Night owl",
  cleanliness: 3,
  cooking_habits: "Sometimes",
  shared_space_org: "Moderate",
  smoking: false,
  smoking_preference: "Non-smoker, okay with smokers",
  religious_level: "Not religious",
  alcohol: "Socially",
  pets: false,
  pet_preference: "No pets, but okay with them",
  fitness: "Sometimes",
  wfh: false,
  guests: "Occasionally",
  social_level: 3,
  noise_level: 3,
  partying: "Occasionally",
  lifestyle_vibe: "Balanced",
  preferred_age_min: 20,
  preferred_age_max: 35,
  gender_preference: "No preference",
  lifestyle_similarity: "Somewhat similar",
  cleanliness_expectations: 3,
  activity_hours: "Flexible",
  bio: "",
};

// ─── calculateUserMatch ───────────────────────────────────────────────────────

describe("calculateUserMatch", () => {
  it("returns 100 for identical profiles", () => {
    expect(calculateUserMatch(base, base)).toBe(100);
  });

  it("returns a number between 0 and 100", () => {
    const other: ProfileData = {
      ...base,
      smoking_preference: "I smoke",
      pet_preference: "I have pets",
      cleanliness: 1,
      sleep_schedule: "Early bird",
      lifestyle_vibe: "Party lover",
      social_level: 5,
      noise_level: 5,
      religious_level: "Very religious",
    };
    const score = calculateUserMatch(base, other);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  // ─── Smoking deal-breaker ────────────────────────────────────────────────

  it("applies heavy penalty when one smokes and the other minds", () => {
    const smoker: ProfileData = { ...base, smoking_preference: "I smoke" };
    const mindsSmoking: ProfileData = { ...base, smoking_preference: "Non-smoker, prefer no smoking" };
    const score = calculateUserMatch(mindsSmoking, smoker);
    expect(score).toBeLessThan(70); // -35 penalty applied
  });

  it("does NOT penalise when smoker meets someone who is okay with smoking", () => {
    const smoker: ProfileData = { ...base, smoking_preference: "I smoke" };
    const okayWithIt: ProfileData = { ...base, smoking_preference: "Non-smoker, okay with smokers" };
    const penalisedScore = calculateUserMatch({ ...base, smoking_preference: "Non-smoker, prefer no smoking" }, smoker);
    const unpunishedScore = calculateUserMatch(okayWithIt, smoker);
    expect(unpunishedScore).toBeGreaterThan(penalisedScore);
  });

  it("returns 100 when both smoke (no other differences)", () => {
    const a: ProfileData = { ...base, smoking_preference: "I smoke" };
    const b: ProfileData = { ...base, smoking_preference: "I smoke" };
    expect(calculateUserMatch(a, b)).toBe(100);
  });

  // ─── Pets deal-breaker ───────────────────────────────────────────────────

  it("applies penalty when one has pets and the other prefers no pets", () => {
    const hasPets: ProfileData = { ...base, pet_preference: "I have pets" };
    const mindsPets: ProfileData = { ...base, pet_preference: "Prefer no pets" };
    const score = calculateUserMatch(hasPets, mindsPets);
    expect(score).toBeLessThan(85); // -20 penalty applied
  });

  it("does NOT penalise when pet owner meets someone okay with pets", () => {
    const hasPets: ProfileData = { ...base, pet_preference: "I have pets" };
    const okayWithPets: ProfileData = { ...base, pet_preference: "No pets, but okay with them" };
    expect(calculateUserMatch(hasPets, okayWithPets)).toBe(100);
  });

  // ─── Religious deal-breaker ──────────────────────────────────────────────

  it("applies maximum religious penalty for extreme gap (Not religious vs Very religious)", () => {
    const veryReligious: ProfileData = { ...base, religious_level: "Very religious" };
    const notReligious: ProfileData = { ...base, religious_level: "Not religious" };
    const score = calculateUserMatch(veryReligious, notReligious);
    expect(score).toBeLessThan(70); // -35 penalty at full amplifier
  });

  it("applies a smaller religious penalty for a 1-step gap", () => {
    const somewhat: ProfileData = { ...base, religious_level: "Somewhat" };
    const notReligious: ProfileData = { ...base, religious_level: "Not religious" };
    const smallGap = calculateUserMatch(somewhat, notReligious);

    const veryReligious: ProfileData = { ...base, religious_level: "Very religious" };
    const largeGap = calculateUserMatch(veryReligious, notReligious);

    expect(smallGap).toBeGreaterThan(largeGap);
  });

  it("no religious penalty when both have the same level", () => {
    const a: ProfileData = { ...base, religious_level: "Traditional" };
    const b: ProfileData = { ...base, religious_level: "Traditional" };
    expect(calculateUserMatch(a, b)).toBe(100);
  });

  // ─── Cleanliness asymmetric penalty ─────────────────────────────────────

  it("penalises when cleanliness expectation exceeds partner's actual cleanliness", () => {
    const cleanFreak: ProfileData = { ...base, cleanliness_expectations: 5 };
    const messy: ProfileData = { ...base, cleanliness: 1 };
    const conflictScore = calculateUserMatch(cleanFreak, messy);
    expect(conflictScore).toBeLessThan(100);
  });

  it("penalises more when the gap is larger", () => {
    const bigGap = calculateUserMatch(
      { ...base, cleanliness_expectations: 5 },
      { ...base, cleanliness: 1 }
    );
    const smallGap = calculateUserMatch(
      { ...base, cleanliness_expectations: 4 },
      { ...base, cleanliness: 3 }
    );
    expect(smallGap).toBeGreaterThan(bigGap);
  });

  // ─── Sleep schedule penalty ──────────────────────────────────────────────

  it("penalises Early bird vs Night owl heavily", () => {
    const earlyBird: ProfileData = { ...base, sleep_schedule: "Early bird" };
    const nightOwl: ProfileData = { ...base, sleep_schedule: "Night owl" };
    const score = calculateUserMatch(earlyBird, nightOwl);
    expect(score).toBeLessThan(85); // -18 penalty
  });

  it("penalises Early bird vs Night owl more than Early bird vs Flexible", () => {
    const earlyBird: ProfileData = { ...base, sleep_schedule: "Early bird" };
    const nightOwl: ProfileData = { ...base, sleep_schedule: "Night owl" };
    const flexible: ProfileData = { ...base, sleep_schedule: "Flexible" };
    expect(calculateUserMatch(earlyBird, flexible)).toBeGreaterThan(
      calculateUserMatch(earlyBird, nightOwl)
    );
  });

  // ─── Multiple deal-breakers stack ────────────────────────────────────────

  it("stacks penalties for multiple deal-breakers (smoking + religious)", () => {
    const smokerReligious: ProfileData = {
      ...base,
      smoking_preference: "I smoke",
      religious_level: "Very religious",
    };
    const nonSmokerNotReligious: ProfileData = {
      ...base,
      smoking_preference: "Non-smoker, prefer no smoking",
      religious_level: "Not religious",
    };
    const singlePenalty = calculateUserMatch(
      { ...base, smoking_preference: "Non-smoker, prefer no smoking" },
      { ...base, smoking_preference: "I smoke" }
    );
    const doublePenalty = calculateUserMatch(nonSmokerNotReligious, smokerReligious);
    expect(doublePenalty).toBeLessThan(singlePenalty);
  });

  // ─── Symmetry ────────────────────────────────────────────────────────────

  it("is symmetric", () => {
    const other: ProfileData = {
      ...base,
      smoking_preference: "I smoke",
      pet_preference: "I have pets",
      cleanliness: 1,
      sleep_schedule: "Early bird",
      social_level: 5,
    };
    expect(calculateUserMatch(base, other)).toBe(calculateUserMatch(other, base));
  });

  // ─── Floor ───────────────────────────────────────────────────────────────

  it("never returns below 5", () => {
    const worst: ProfileData = {
      ...base,
      smoking_preference: "I smoke",
      pet_preference: "I have pets",
      religious_level: "Very religious",
      sleep_schedule: "Early bird",
      cleanliness: 1,
      cleanliness_expectations: 5,
      budget: 10000,
      social_level: 5,
      noise_level: 5,
    };
    const victim: ProfileData = {
      ...base,
      smoking_preference: "Non-smoker, prefer no smoking",
      pet_preference: "Prefer no pets",
      religious_level: "Not religious",
      sleep_schedule: "Night owl",
      cleanliness: 5,
      cleanliness_expectations: 5,
      budget: 2000,
    };
    expect(calculateUserMatch(worst, victim)).toBeGreaterThanOrEqual(5);
  });

  // ─── Age preference ──────────────────────────────────────────────────────

  it("scores higher when age is within each other's preferred range", () => {
    const a: ProfileData = { ...base, age: 25, preferred_age_min: 20, preferred_age_max: 30 };
    const b: ProfileData = { ...base, age: 27, preferred_age_min: 22, preferred_age_max: 32 };
    const inRange = calculateUserMatch(a, b);

    const outOfRange: ProfileData = { ...b, age: 50, preferred_age_min: 45, preferred_age_max: 55 };
    const notInRange = calculateUserMatch(a, outOfRange);

    expect(inRange).toBeGreaterThan(notInRange);
  });
});

// ─── calculateRoomMatch ───────────────────────────────────────────────────────

describe("calculateRoomMatch", () => {
  it("returns a value between 0 and 100", () => {
    const score = calculateRoomMatch(base, 3500, []);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns 100 when budget matches exactly and no roommates", () => {
    expect(calculateRoomMatch(base, 3500, [])).toBe(100);
  });

  it("returns lower score when price is far from budget", () => {
    const closeScore = calculateRoomMatch(base, 3600, []);
    const farScore = calculateRoomMatch(base, 7000, []);
    expect(closeScore).toBeGreaterThan(farScore);
  });

  it("weighs roommate compatibility at 70%", () => {
    const incompatible: ProfileData = {
      ...base,
      smoking_preference: "I smoke",
      sleep_schedule: "Early bird",
      social_level: 5,
      noise_level: 5,
    };
    const withIncompatible = calculateRoomMatch(
      { ...base, smoking_preference: "Non-smoker, prefer no smoking", sleep_schedule: "Night owl" },
      3500,
      [incompatible]
    );
    const withNoRoommates = calculateRoomMatch(base, 3500, []);
    expect(withIncompatible).toBeLessThan(withNoRoommates);
  });

  it("returns higher score with compatible roommate than incompatible", () => {
    const compatible: ProfileData = { ...base };
    const incompatible: ProfileData = {
      ...base,
      smoking_preference: "I smoke",
      cleanliness: 1,
    };
    const seeker: ProfileData = {
      ...base,
      smoking_preference: "Non-smoker, prefer no smoking",
      cleanliness_expectations: 5,
    };
    const compatScore = calculateRoomMatch(seeker, 3500, [compatible]);
    const incompatScore = calculateRoomMatch(seeker, 3500, [incompatible]);
    expect(compatScore).toBeGreaterThan(incompatScore);
  });
});

// ─── calculateSquadMatch ─────────────────────────────────────────────────────

const squad = {
  budget_min: 3000,
  budget_max: 4000,
  no_smoking: true,
  pet_friendly: false,
  min_cleanliness: 2,
  preferred_locations: ["Tel Aviv"],
};

describe("calculateSquadMatch", () => {
  it("returns a value between 0 and 100", () => {
    const score = calculateSquadMatch(base, squad, []);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("scores higher when user budget is within squad range", () => {
    const inBudget: ProfileData = { ...base, budget: 3500 };
    const outOfBudget: ProfileData = { ...base, budget: 8000 };
    expect(calculateSquadMatch(inBudget, squad, [])).toBeGreaterThan(
      calculateSquadMatch(outOfBudget, squad, [])
    );
  });

  it("penalises a smoker in a no-smoking squad", () => {
    const smoker: ProfileData = { ...base, smoking_preference: "I smoke" };
    const nonSmoker: ProfileData = { ...base, smoking_preference: "Non-smoker, okay with smokers" };
    expect(calculateSquadMatch(smoker, squad, [])).toBeLessThan(
      calculateSquadMatch(nonSmoker, squad, [])
    );
  });

  it("penalises pet owner when squad is not pet-friendly", () => {
    const petOwner: ProfileData = { ...base, pet_preference: "I have pets" };
    const noPets: ProfileData = { ...base, pet_preference: "No pets, but okay with them" };
    expect(calculateSquadMatch(petOwner, squad, [])).toBeLessThan(
      calculateSquadMatch(noPets, squad, [])
    );
  });

  it("gives a city bonus when the user already has a preference penalty", () => {
    const telAvivPetOwner: ProfileData = { ...base, city: "Tel Aviv", pet_preference: "I have pets" };
    const haifahPetOwner: ProfileData = { ...base, city: "Haifa", pet_preference: "I have pets" };
    expect(calculateSquadMatch(telAvivPetOwner, squad, [])).toBeGreaterThan(
      calculateSquadMatch(haifahPetOwner, squad, [])
    );
  });

  it("weighs member compatibility at 60%", () => {
    const compatible: ProfileData = { ...base };
    const incompatible: ProfileData = {
      ...base,
      smoking_preference: "I smoke",
      cleanliness: 1,
      sleep_schedule: "Early bird",
      social_level: 5,
    };
    const seeker: ProfileData = {
      ...base,
      smoking_preference: "Non-smoker, prefer no smoking",
      sleep_schedule: "Night owl",
    };
    const withCompatible = calculateSquadMatch(seeker, squad, [compatible]);
    const withIncompatible = calculateSquadMatch(seeker, squad, [incompatible]);
    expect(withCompatible).toBeGreaterThan(withIncompatible);
  });

  it("clamps score between 0 and 100 for worst-case profile", () => {
    const worst: ProfileData = {
      ...base,
      budget: 10000,
      smoking_preference: "I smoke",
      pet_preference: "I have pets",
      cleanliness: 0,
      city: "Eilat",
    };
    const score = calculateSquadMatch(worst, squad, []);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
