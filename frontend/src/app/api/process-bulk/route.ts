// src/app/api/process-bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { calculateCost } from "@/lib/billing";

const PYTHON_API_URL =
  process.env.PYTHON_API_URL || "http://127.0.0.1:8000/api";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// Define a type for the items in the request body for clarity
interface ProcessItem {
  duration_seconds?: number;
  character_count?: number;
  // you can add other item properties here if needed, like 'storagePath'
}

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
    // Cast the items array to your new type
    const items: ProcessItem[] = requestBody.items || [];

    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userData = userDoc.data()!;
    const userPlan = userData.plan || "free";
    const analysesRemaining = userData.analyses_remaining || 0;

    // 2. Calculate total cost with explicit types
    const totalCalculatedCost = items.reduce(
      (total: number, item: ProcessItem) => {
        return total + calculateCost(item, userPlan);
      },
      0
    );

    // 3. Check and Decrement Correct Amount
    if (analysesRemaining < totalCalculatedCost) {
      return NextResponse.json(
        {
          error: "Insufficient Analyses Remaining",
          detail: `This batch requires ${totalCalculatedCost} analyses, but you only have ${analysesRemaining} left.`,
        },
        { status: 402 }
      );
    }

    if (totalCalculatedCost > 0) {
      await userDocRef.update({
        analyses_remaining: FieldValue.increment(-totalCalculatedCost),
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
        items: requestBody.items,
        config: requestBody.config,
        model_choice: requestBody.model_choice,
      }),
    });

    const responseData = await pythonApiResponse.json();

    if (!pythonApiResponse.ok) {
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
