// src/lib/billing.ts

// Fixed limits for all users (no plans)
export const CREDIT_LIMITS = {
  audio_seconds_per_credit: 600, // 10 minutes
  chars_per_credit: 100000,
};

// + STEP 1: Define all your add-on costs in one place.
// The keys MUST match the 'id' of the features from your EnginePage.
export const ADD_ON_COSTS = {};

// Define a type for the keys of ADD_ON_COSTS for better type safety.
type AddOnKey = keyof typeof ADD_ON_COSTS;

/**
 * Calculates the total analysis cost based on usage and selected add-ons.
 * @param inputs An object containing either audio duration or character count.
 * @param featureConfig An object showing which add-ons are enabled.
 * @returns The calculated total cost in analysis credits.
 */

export function calculateCost(
  inputs: {
    duration_seconds?: number;
    character_count?: number;
  },
  // No userPlan parameter needed - same limits for everyone
  featureConfig: { [key in AddOnKey]?: boolean } = {}
): number {
  let usage = 0;
  let limit_per_credit = 0;

  if (typeof inputs.duration_seconds === "number") {
    usage = inputs.duration_seconds;
    limit_per_credit = CREDIT_LIMITS.audio_seconds_per_credit;
  } else if (typeof inputs.character_count === "number") {
    usage = inputs.character_count;
    limit_per_credit = CREDIT_LIMITS.chars_per_credit;
  }

  if (usage === 0) {
    return 0; // No cost for empty jobs.
  }

  // Calculate the base cost using the 50% rule.
  let baseCost = 0;
  if (usage < limit_per_credit * 0.5) {
    baseCost = 0.5;
  } else {
    baseCost = Math.ceil(usage / limit_per_credit);
  }

  // Calculate the total add-on cost scalably.
  let addOnCost = 0;
  // This loop iterates through your ADD_ON_COSTS object.
  // If a feature is enabled in the config, its cost is added.
  for (const key of Object.keys(ADD_ON_COSTS)) {
    const featureKey = key as AddOnKey;
    if (featureConfig[featureKey]) {
      addOnCost += ADD_ON_COSTS[featureKey];
    }
  }

  // Return the sum of the base analysis and all selected add-ons.
  return baseCost + addOnCost;
}
