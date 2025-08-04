import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { TIER_LIMITS, ADD_ON_COSTS } from "@/lib/billing";
import { getYouTubeVideoId } from "@/app/utils/getYoutubeVideoId";

type AddOnKey = keyof typeof ADD_ON_COSTS;

const PYTHON_API_URL =
  process.env.PYTHON_API_URL || "http://127.0.0.1:8000/api";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

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
    const userData = userDoc.data()!;
    const userPlan = userData.plan || "free";
    const userCredits = userData.analyses_remaining || 0;

    // 3. Destructure the request body, now including youtubeUrl
    const { durations, character_count, config, youtubeUrl } =
      await request.json();

    const limits =
      TIER_LIMITS[userPlan as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

    let totalBaseCost = 0;
    let totalAddOnCost = 0;
    let totalUsage = 0;
    let unit = "";
    let limit_per_credit = 0;
    let transcript_id = null;
    let numberOfItems = 1; // Default to 1 for text/YouTube, will be updated for files

    const fileBaseCostsBreakdown: { duration: number; cost: number }[] = [];
    const addOnsBreakdown: {
      name: string;
      cost: number;
      perFileCost?: number;
    }[] = [];

    // 4. Determine job type and calculate base cost
    if (youtubeUrl) {
      const videoId = getYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL" },
          { status: 400 }
        );
      }

      const pythonResponse = await fetch(
        `${PYTHON_API_URL}/get-transcript-details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": INTERNAL_API_KEY!,
          },
          body: JSON.stringify({ video_id: videoId }),
        }
      );

      if (!pythonResponse.ok) {
        const errorData = await pythonResponse.json();
        throw new Error(
          errorData.detail || "Python service failed to fetch transcript."
        );
      }

      const pythonData = await pythonResponse.json();
      const actual_char_count = pythonData.character_count;
      transcript_id = pythonData.transcript_id;

      unit = "text";
      limit_per_credit = limits.chars_per_credit;
      totalUsage = actual_char_count;

      if (totalUsage > 0 && totalUsage < limit_per_credit * 0.5) {
        totalBaseCost = 0.5;
      } else {
        totalBaseCost = Math.ceil(totalUsage / limit_per_credit);
      }
      fileBaseCostsBreakdown.push({
        duration: totalUsage,
        cost: totalBaseCost,
      });
    } else if (Array.isArray(durations) && durations.length > 0) {
      unit = "audio";
      limit_per_credit = limits.audio_seconds_per_credit;
      numberOfItems = durations.length;

      for (const duration of durations) {
        totalUsage += duration;
        let fileBaseCost = 0;
        if (duration > 0 && duration < limit_per_credit * 0.5) {
          fileBaseCost = 0.5;
        } else {
          fileBaseCost = Math.ceil(duration / limit_per_credit);
        }
        totalBaseCost += fileBaseCost;
        fileBaseCostsBreakdown.push({ duration: duration, cost: fileBaseCost });
      }
    } else if (typeof character_count === "number") {
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
      });
    } else {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 5. Calculate Add-on cost (This now runs for all job types)
    if (config) {
      for (const key of Object.keys(ADD_ON_COSTS)) {
        const featureKey = key as AddOnKey;
        if (config[featureKey]) {
          const singleCost = ADD_ON_COSTS[featureKey];
          const totalFeatureCost = singleCost * numberOfItems;
          totalAddOnCost += totalFeatureCost;

          const readableName = featureKey
            .replace(/run_|_generation/g, " ")
            .replace(/_/g, " ")
            .replace("x thread", "X/Twitter Thread")
            .trim()
            .replace(/\b\w/g, (l) => l.toUpperCase());

          addOnsBreakdown.push({
            name: readableName,
            cost: totalFeatureCost,
            perFileCost: singleCost,
          });
        }
      }
    }

    const totalCost = totalBaseCost + totalAddOnCost;

    // 6. Check if user has enough credits
    if (userCredits < totalCost) {
      return NextResponse.json(
        {
          error: "Insufficient Credits",
          detail: `This job requires ${totalCost} credits, but you only have ${userCredits}.`,
        },
        { status: 402 }
      );
    }

    // 7. Construct and return the final payload
    const responsePayload = {
      totalCost,
      breakdown: {
        totalBaseCost,
        fileBaseCosts: fileBaseCostsBreakdown,
        addOns: addOnsBreakdown,
        totalAddOnCost,
      },
      usage: totalUsage,
      limitPerCredit: limit_per_credit,
      unit,
    };

    const finalResponse = transcript_id
      ? { ...responsePayload, transcript_id }
      : responsePayload;

    return NextResponse.json(finalResponse);
  } catch (error: any) {
    console.error("Credit check error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
