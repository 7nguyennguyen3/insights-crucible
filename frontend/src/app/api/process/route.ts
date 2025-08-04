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

    // 2. Get user's current credit balance
    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }
    const userData = userDoc.data()!;
    const analysesRemaining = userData.analyses_remaining || 0;

    // 3. Get the pre-calculated cost from the frontend
    // Note: You must update your frontend to send this value.
    const { totalCost, ...jobDetails } = requestBody;

    if (typeof totalCost !== "number") {
      return NextResponse.json(
        { error: "Invalid request: totalCost is missing." },
        { status: 400 }
      );
    }

    // 4. Perform final credit check and decrement
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

    // 5. Proxy the job details to Python to start processing
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": INTERNAL_API_KEY!,
      },
      body: JSON.stringify({
        user_id: userId,
        ...jobDetails, // Send the rest of the details (transcript_id, config, etc.)
      }),
    });

    const responseData = await pythonApiResponse.json();

    if (!pythonApiResponse.ok) {
      // If the Python service fails, refund the credits
      await userDocRef.update({
        analyses_remaining: FieldValue.increment(totalCost),
      });
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
