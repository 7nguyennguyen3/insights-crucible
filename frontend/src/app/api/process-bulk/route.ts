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
    // 1. Authentication (same as before)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // This body will come from your frontend, containing the list of items
    const requestBody = await request.json();

    // 2. Credit Check for the ENTIRE BATCH
    const totalEstimatedCost = requestBody.total_estimated_cost_usd; // Frontend will need to send this

    if (typeof totalEstimatedCost === "number" && totalEstimatedCost > 0) {
      const userDocRef = db.collection("saas_users").doc(userId);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const userData = userDoc.data();
      const availableBalance =
        (userData?.credits || 0) - (userData?.pending_deductions || 0);

      if (availableBalance < totalEstimatedCost) {
        return NextResponse.json(
          {
            error: "Insufficient Credits",
            detail: `Your available credit of $${availableBalance.toFixed(
              2
            )} is not enough for the estimated batch cost of $${totalEstimatedCost.toFixed(
              2
            )}.`,
          },
          { status: 402 }
        );
      }

      // Hold credits for the entire batch
      await userDocRef.update({
        pending_deductions: FieldValue.increment(totalEstimatedCost),
      });
    }

    // 3. Proxy the request to the Python /process-bulk endpoint
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/process-bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": INTERNAL_API_KEY!,
      },
      // The body now matches the BulkAnalysisRequest model
      body: JSON.stringify({
        user_id: userId,
        items: requestBody.items, // Pass the list of items
        config: requestBody.config,
        model_choice: requestBody.model_choice,
      }),
    });

    const responseData = await pythonApiResponse.json();

    if (!pythonApiResponse.ok) {
      // If the bulk enqueue fails, revert the deduction
      if (typeof totalEstimatedCost === "number") {
        const userDocRef = db.collection("saas_users").doc(userId);
        await userDocRef.update({
          pending_deductions: FieldValue.increment(-totalEstimatedCost),
        });
      }
      return NextResponse.json(
        { error: "Error from bulk analysis service", details: responseData },
        { status: pythonApiResponse.status }
      );
    }

    // Return the response from the Python service (which includes the batch_id)
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Proxy error in /api/process-bulk:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
