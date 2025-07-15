// app/api/check-analysis/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { calculateCost, TIER_LIMITS } from "@/lib/billing"; // 1. Import from billing.ts

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (no changes here)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 2. Get user's data from Firestore (no changes here)
    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const userData = userDoc.data()!;
    const userPlan = userData.plan || "free";
    const userCredits = userData.analyses_remaining || 0;

    // 3. Calculate the required credits using the helper function
    const { durations, character_count } = await request.json();
    let calculatedCost = 0;

    if (Array.isArray(durations)) {
      // For a batch of audio files, sum the cost of each one
      calculatedCost = durations.reduce((total: number, duration: number) => {
        return total + calculateCost({ duration_seconds: duration }, userPlan);
      }, 0);
    } else if (typeof character_count === "number") {
      // For a single text analysis
      calculatedCost = calculateCost({ character_count }, userPlan);
    } else {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 4. Check if user has enough credits (no changes here)
    if (userCredits < calculatedCost) {
      return NextResponse.json(
        {
          error: "Insufficient Credits",
          detail: `This job requires ${calculatedCost} analysis credits, but you only have ${userCredits}.`,
        },
        { status: 402 }
      );
    }

    // 5. If they have enough, return the calculated cost for confirmation
    const limits =
      TIER_LIMITS[userPlan as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

    const responsePayload = {
      message: "Credit check successful.",
      calculatedCost: calculatedCost,
      usage: 0,
      limitPerCredit: 0,
      unit: "",
    };

    if (Array.isArray(durations)) {
      responsePayload.usage = durations.reduce((a, b) => a + b, 0);
      responsePayload.limitPerCredit = limits.audio_seconds_per_credit;
      responsePayload.unit = "audio";
    } else if (typeof character_count === "number") {
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
