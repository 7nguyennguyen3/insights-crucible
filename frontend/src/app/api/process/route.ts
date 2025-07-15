// src/app/api/process/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { calculateCost } from "@/lib/billing";

const PYTHON_API_URL =
  process.env.PYTHON_API_URL || "http://127.0.0.1:8000/api";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;
    const requestBody = await request.json();

    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }
    const userData = userDoc.data()!;
    const userPlan = userData.plan || "free";

    // 2. Calculate cost using the helper function
    const calculatedCost = calculateCost(requestBody, userPlan);

    // 3. Check and Decrement Correct Amount
    const analysesRemaining = userData.analyses_remaining || 0;
    if (analysesRemaining < calculatedCost) {
      return NextResponse.json(
        { error: "Insufficient Credits" },
        { status: 402 }
      );
    }

    await userDocRef.update({
      analyses_remaining: FieldValue.increment(-calculatedCost),
    });

    // 4. Proxy the request to Python
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": INTERNAL_API_KEY!,
      },
      body: JSON.stringify({
        user_id: userId,
        ...requestBody,
      }),
    });

    const responseData = await pythonApiResponse.json();

    // Note: There's no need to revert the decrement if the API fails,
    // as the analysis credit was consumed by starting the job.

    if (!pythonApiResponse.ok) {
      return NextResponse.json(
        { error: "Error from analysis service", details: responseData },
        { status: pythonApiResponse.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Proxy error in /api/process:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
