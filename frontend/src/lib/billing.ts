// src/lib/billing.ts

export const TIER_LIMITS = {
  charter: {
    audio_seconds_per_credit: 5400, // 1.5 hours (Same as Pro)
    chars_per_credit: 75000, // (Same as Pro)
  },
  free: {
    // Default plan
    audio_seconds_per_credit: 3600, // 1 hour
    chars_per_credit: 50000,
  },
  pro: {
    audio_seconds_per_credit: 5400, // 1.5 hours
    chars_per_credit: 75000,
  },
};

/**
 * Calculates the analysis cost based on usage and user plan.
 * @param inputs An object containing either audio duration or character count.
 * @param userPlan The user's current plan (e.g., 'free', 'pro').
 * @returns The calculated cost in analysis credits (minimum 1).
 */
export function calculateCost(
  inputs: {
    duration_seconds?: number;
    character_count?: number;
  },
  userPlan: string
): number {
  const limits =
    TIER_LIMITS[userPlan as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  let calculatedCost = 0;

  if (typeof inputs.duration_seconds === "number") {
    // Calculate cost for audio based on its duration
    calculatedCost = Math.ceil(
      inputs.duration_seconds / limits.audio_seconds_per_credit
    );
  } else if (typeof inputs.character_count === "number") {
    // Calculate cost for text based on its character count
    calculatedCost = Math.ceil(
      inputs.character_count / limits.chars_per_credit
    );
  }

  // Ensure every job costs at least 1 credit
  return Math.max(1, calculatedCost);
}
