// app/api/check-analysis/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { TIER_LIMITS, ADD_ON_COSTS } from "@/lib/billing";

type AddOnKey = keyof typeof ADD_ON_COSTS;

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

    // 3. Destructure the full request body
    const { durations, character_count, config } = await request.json();

    const limits =
      TIER_LIMITS[userPlan as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

    let totalCost = 0;
    let totalBaseCost = 0;
    let totalAddOnCost = 0;
    let totalUsage = 0;
    let unit = "";
    let limit_per_credit = 0;

    // ✅ MODIFIED: Capture individual file costs for better breakdown
    const fileBaseCostsBreakdown: {
      fileName?: string;
      duration: number;
      cost: number;
    }[] = [];
    const addOnsBreakdown: {
      name: string;
      cost: number;
      perFileCost?: number;
    }[] = []; // Add perFileCost for clarity

    if (Array.isArray(durations) && durations.length > 0) {
      unit = "audio";
      limit_per_credit = limits.audio_seconds_per_credit;
      const numberOfFiles = durations.length;

      // Calculate total base cost by iterating through each file's duration
      for (const duration of durations) {
        totalUsage += duration;
        let fileBaseCost = 0;
        if (duration > 0 && duration < limit_per_credit * 0.5) {
          fileBaseCost = 0.5; // Apply 50% rule per file
        } else {
          fileBaseCost = Math.ceil(duration / limit_per_credit);
        }
        totalBaseCost += fileBaseCost;
        fileBaseCostsBreakdown.push({ duration: duration, cost: fileBaseCost }); // Store individual file costs
      }

      // Calculate total add-on cost by multiplying by the number of files
      if (config) {
        for (const key of Object.keys(ADD_ON_COSTS)) {
          const featureKey = key as AddOnKey;
          if (config[featureKey]) {
            const singleCost = ADD_ON_COSTS[featureKey];
            const totalFeatureCost = singleCost * numberOfFiles;
            totalAddOnCost += totalFeatureCost;

            const readableName = featureKey
              .replace(/run_|_generation/g, " ")
              .replace(/_/g, " ")
              .replace("x thread", "X/Twitter Thread")
              .trim()
              .replace(/\b\w/g, (l) => l.toUpperCase());

            // The breakdown shows the total cost for this add-on across all files
            addOnsBreakdown.push({
              name: readableName,
              cost: totalFeatureCost,
              perFileCost: singleCost, // Store per-file add-on cost
            });
          }
        }
      }
      totalCost = totalBaseCost + totalAddOnCost;
    } else if (typeof character_count === "number") {
      // This logic for single text files remains the same
      unit = "text";
      limit_per_credit = limits.chars_per_credit;
      totalUsage = character_count;

      if (totalUsage > 0 && totalUsage < limit_per_credit * 0.5) {
        totalBaseCost = 0.5;
      } else {
        totalBaseCost = Math.ceil(totalUsage / limit_per_credit);
      }
      fileBaseCostsBreakdown.push({
        duration: totalUsage,
        cost: totalBaseCost,
      }); // For single text, treat it as one item

      if (config) {
        for (const key of Object.keys(ADD_ON_COSTS)) {
          const featureKey = key as AddOnKey;
          if (config[featureKey]) {
            const cost = ADD_ON_COSTS[featureKey];
            totalAddOnCost += cost;
            const readableName = featureKey
              .replace(/run_|_generation/g, " ")
              .replace(/_/g, " ")
              .replace("x thread", "X/Twitter Thread")
              .trim()
              .replace(/\b\w/g, (l) => l.toUpperCase());
            addOnsBreakdown.push({
              name: readableName,
              cost: cost,
              perFileCost: cost,
            });
          }
        }
      }
      totalCost = totalBaseCost + totalAddOnCost;
    } else {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 4. Check if user has enough credits
    if (userCredits < totalCost) {
      return NextResponse.json(
        {
          error: "Insufficient Credits",
          detail: `This job requires ${totalCost} analysis credits, but you only have ${userCredits}.`,
        },
        { status: 402 }
      );
    }

    // 5. If they have enough, return the new, detailed payload
    const responsePayload = {
      totalCost: totalCost,
      breakdown: {
        totalBaseCost: totalBaseCost, // Rename for clarity on frontend
        fileBaseCosts: fileBaseCostsBreakdown, // ✅ NEW: individual file base costs
        addOns: addOnsBreakdown,
        totalAddOnCost: totalAddOnCost, // ✅ NEW: total add-on cost
      },
      usage: totalUsage,
      limitPerCredit: limit_per_credit,
      unit: unit,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Credit check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
