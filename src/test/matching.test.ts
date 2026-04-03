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
  religious_level: "Not religious",
  alcohol: "Socially",
  pets: false,
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
      smoking: true,
      cleanliness: 1,
      sleep_schedule: "Early bird",
      lifestyle_vibe: "Party lover",
      social_level: 5,
      noise_level: 5,
    };
    const score = calculateUserMatch(base, other);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("penalises a smoking mismatch heavily", () => {
    const smoker: ProfileData = { ...base, smoking: true };
    const score = calculateUserMatch(base, smoker);
    // smoking has weight 15 with 0.1 score on mismatch — expect meaningful drop
    expect(score).toBeLessThan(90);
  });

  it("gives full score on smoking match (both smokers)", () => {
    const a: ProfileData = { ...base, smoking: true };
    const b: ProfileData = { ...base, smoking: true };
    expect(calculateUserMatch(a, b)).toBe(100);
  });

  it("reduces score on cleanliness gap", () => {
    const messy: ProfileData = { ...base, cleanliness: 1 };
    const spotless: ProfileData = { ...base, cleanliness: 5 };
    const score = calculateUserMatch(messy, spotless);
    expect(score).toBeLessThan(90);
  });

  it("scores higher when age is within each other's preferred range", () => {
    const a: ProfileData = { ...base, age: 25, preferred_age_min: 20, preferred_age_max: 30 };
    const b: ProfileData = { ...base, age: 27, preferred_age_min: 22, preferred_age_max: 32 };
    const inRange = calculateUserMatch(a, b);

    const outOfRange: ProfileData = { ...b, age: 50, preferred_age_min: 45, preferred_age_max: 55 };
    const notInRange = calculateUserMatch(a, outOfRange);

    expect(inRange).toBeGreaterThan(notInRange);
  });

  it("is symmetric", () => {
    const other: ProfileData = { ...base, cleanliness: 1, smoking: true, social_level: 5 };
    expect(calculateUserMatch(base, other)).toBe(calculateUserMatch(other, base));
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
    // Perfect budget match but incompatible roommate
    const incompatible: ProfileData = {
      ...base,
      smoking: true,
      cleanliness: 1,
      sleep_schedule: "Early bird",
      social_level: 5,
      noise_level: 5,
    };
    const withIncompatible = calculateRoomMatch(base, 3500, [incompatible]);
    const withNoRoommates = calculateRoomMatch(base, 3500, []);
    // Having an incompatible roommate should lower the score significantly
    expect(withIncompatible).toBeLessThan(withNoRoommates);
  });

  it("returns higher score with compatible roommate than incompatible", () => {
    const compatible: ProfileData = { ...base };
    const incompatible: ProfileData = { ...base, smoking: true, cleanliness: 1 };
    const compatScore = calculateRoomMatch(base, 3500, [compatible]);
    const incompatScore = calculateRoomMatch(base, 3500, [incompatible]);
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
    const smoker: ProfileData = { ...base, smoking: true };
    const nonSmoker: ProfileData = { ...base, smoking: false };
    expect(calculateSquadMatch(smoker, squad, [])).toBeLessThan(
      calculateSquadMatch(nonSmoker, squad, [])
    );
  });

  it("penalises pet owner when squad is not pet-friendly", () => {
    const petOwner: ProfileData = { ...base, pets: true };
    const noPets: ProfileData = { ...base, pets: false };
    expect(calculateSquadMatch(petOwner, squad, [])).toBeLessThan(
      calculateSquadMatch(noPets, squad, [])
    );
  });

  it("gives a city bonus when the user already has a preference penalty", () => {
    // The city bonus is only meaningful when prefScore < 1 (i.e. there's already a penalty).
    // Use a pet owner in a non-pet-friendly squad (-0.2 penalty) to expose the bonus.
    const telAvivPetOwner: ProfileData = { ...base, city: "Tel Aviv", pets: true };
    const haifahPetOwner: ProfileData = { ...base, city: "Haifa", pets: true };
    expect(calculateSquadMatch(telAvivPetOwner, squad, [])).toBeGreaterThan(
      calculateSquadMatch(haifahPetOwner, squad, [])
    );
  });

  it("weighs member compatibility at 60%", () => {
    const compatible: ProfileData = { ...base };
    const incompatible: ProfileData = {
      ...base,
      smoking: true,
      cleanliness: 1,
      sleep_schedule: "Early bird",
      social_level: 5,
    };
    const withCompatible = calculateSquadMatch(base, squad, [compatible]);
    const withIncompatible = calculateSquadMatch(base, squad, [incompatible]);
    expect(withCompatible).toBeGreaterThan(withIncompatible);
  });

  it("clamps score between 0 and 100 for worst-case profile", () => {
    const worst: ProfileData = {
      ...base,
      budget: 10000,
      smoking: true,
      pets: true,
      cleanliness: 0,
      city: "Eilat",
    };
    const score = calculateSquadMatch(worst, squad, []);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
