// src/app/api/process-bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

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
    const { totalCost, ...jobDetails } = requestBody; // ✅ Get totalCost

    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userData = userDoc.data()!;
    const analysesRemaining = userData.analyses_remaining || 0;

    // 2. ❌ REMOVED: Internal cost calculation is no longer needed.

    // 3. Check and Decrement Correct Amount using pre-calculated cost
    if (typeof totalCost !== "number") {
      return NextResponse.json(
        { error: "Invalid request: totalCost is missing." },
        { status: 400 }
      );
    }

    if (analysesRemaining < totalCost) {
      return NextResponse.json(
        { error: "Insufficient Credits" },
        { status: 402 }
      );
    }

    if (totalCost > 0) {
      await userDocRef.update({
        analyses_remaining: FieldValue.increment(-totalCost),
      });
    }

    // 4. Proxy the request to the Python service
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/process-bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": INTERNAL_API_KEY!,
      },
      body: JSON.stringify({
        user_id: userId,
        ...jobDetails, // Pass items, config, etc.
      }),
    });

    const responseData = await pythonApiResponse.json();

    if (!pythonApiResponse.ok) {
      // If Python fails, refund the credits
      await userDocRef.update({
        analyses_remaining: FieldValue.increment(totalCost),
      });
      return NextResponse.json(
        { error: "Error from bulk analysis service", details: responseData },
        { status: pythonApiResponse.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Proxy error in /api/process-bulk:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
