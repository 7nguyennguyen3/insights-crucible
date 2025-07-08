// app/api/check-analysis/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// DEFINE YOUR TIER LIMITS HERE
// This makes it easy to add 'pro', 'business' tiers later.
const TIER_LIMITS = {
  free: {
    // Default plan
    audio_seconds_per_credit: 3600, // 1 hour
    chars_per_credit: 50000,
  },
  pro: {
    audio_seconds_per_credit: 7200, // 2 hours
    chars_per_credit: 100000,
  },
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 2. Get user's data from Firestore
    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const userData = userDoc.data();
    const userPlan = userData?.plan || "free"; // Default to 'free' if no plan is set
    const userCredits = userData?.analyses_remaining || 0;

    // 3. Determine user's limits based on their plan
    const limits =
      TIER_LIMITS[userPlan as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

    // 4. Calculate the required credits
    const { durations, character_count } = await request.json();
    let calculatedCost = 0;

    if (Array.isArray(durations)) {
      // If we receive an array of durations, calculate cost for each file
      for (const duration of durations) {
        const fileCost = Math.ceil(duration / limits.audio_seconds_per_credit);
        // Each file costs a minimum of 1 credit
        calculatedCost += Math.max(1, fileCost);
      }
    } else if (typeof character_count === "number") {
      // The logic for text-based analysis remains the same
      calculatedCost = Math.ceil(character_count / limits.chars_per_credit);
    } else {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // Ensure cost is at least 1 credit
    calculatedCost = Math.max(1, calculatedCost);

    // 5. Check if user has enough credits
    if (userCredits < calculatedCost) {
      return NextResponse.json(
        {
          error: "Insufficient Credits",
          detail: `This job requires ${calculatedCost} analysis credits, but you only have ${userCredits}.`,
        },
        { status: 402 } // Payment Required
      );
    }

    // 6. If they have enough, return the calculated cost for confirmation
    // New, more detailed response payload
    let responsePayload = {
      message: "Credit check successful.",
      calculatedCost: calculatedCost,
      // Add the context needed for the UI explanation
      usage: 0,
      limitPerCredit: 0,
      unit: "",
    };

    if (Array.isArray(durations)) {
      // If we processed an array of audio files
      responsePayload.usage = durations.reduce((a, b) => a + b, 0); // Sum the durations for the usage report
      responsePayload.limitPerCredit = limits.audio_seconds_per_credit;
      responsePayload.unit = "audio";
    } else if (typeof character_count === "number") {
      // If we processed a text transcript
      responsePayload.usage = character_count;
      responsePayload.limitPerCredit = limits.chars_per_credit;
      responsePayload.unit = "text";
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Credit check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
