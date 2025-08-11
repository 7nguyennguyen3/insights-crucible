// src/lib/billing.ts

export const TIER_LIMITS = {
  charter: {
    audio_seconds_per_credit: 1200, // 20 minutes
    chars_per_credit: 125000,
  },
  free: {
    // Default plan
    audio_seconds_per_credit: 600, // 10 minutes
    chars_per_credit: 100000,
  },
  starter: {
    audio_seconds_per_credit: 900, // 15 minutes
    chars_per_credit: 125000,
  },
  pro: {
    audio_seconds_per_credit: 1200, // 20 minutes
    chars_per_credit: 150000,
  },
};

// + STEP 1: Define all your add-on costs in one place.
// The keys MUST match the 'id' of the features from your EnginePage.
export const ADD_ON_COSTS = {
  run_contextual_briefing: 0.5, // 5-Angle Perspective
  run_x_thread_generation: 1, // X/Twitter Thread
  run_blog_post_generation: 1, // Blog Post
};

// Define a type for the keys of ADD_ON_COSTS for better type safety.
type AddOnKey = keyof typeof ADD_ON_COSTS;

/**
 * Calculates the total analysis cost based on usage, plan, and selected add-ons.
 * @param inputs An object containing either audio duration or character count.
 * @param userPlan The user's current plan (e.g., 'free', 'pro').
 * @param featureConfig An object showing which add-ons are enabled.
 * @returns The calculated total cost in analysis credits.
 */

export function calculateCost(
  inputs: {
    duration_seconds?: number;
    character_count?: number;
  },
  userPlan: string,
  // + STEP 2: Accept the featureConfig object.
  featureConfig: { [key in AddOnKey]?: boolean } = {}
): number {
  const limits =
    TIER_LIMITS[userPlan as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

  let usage = 0;
  let limit_per_credit = 0;

  if (typeof inputs.duration_seconds === "number") {
    usage = inputs.duration_seconds;
    limit_per_credit = limits.audio_seconds_per_credit;
  } else if (typeof inputs.character_count === "number") {
    usage = inputs.character_count;
    limit_per_credit = limits.chars_per_credit;
  }

  if (usage === 0) {
    return 0; // No cost for empty jobs.
  }

  // + STEP 3: Calculate the base cost using the 50% rule.
  let baseCost = 0;
  if (usage < limit_per_credit * 0.5) {
    baseCost = 0.5;
  } else {
    baseCost = Math.ceil(usage / limit_per_credit);
  }

  // + STEP 4: Calculate the total add-on cost scalably.
  let addOnCost = 0;
  // This loop iterates through your ADD_ON_COSTS object.
  // If a feature is enabled in the config, its cost is added.
  for (const key of Object.keys(ADD_ON_COSTS)) {
    const featureKey = key as AddOnKey;
    if (featureConfig[featureKey]) {
      addOnCost += ADD_ON_COSTS[featureKey];
    }
  }

  // + STEP 5: Return the sum of the base analysis and all selected add-ons.
  return baseCost + addOnCost;
}
