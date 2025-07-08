import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

const PYTHON_API_URL =
  process.env.PYTHON_API_URL || "http://127.0.0.1:8000/api";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;
    const requestBody = await request.json();

    const estimatedCost = requestBody.estimated_cost_usd;

    if (typeof estimatedCost === "number") {
      const userDocRef = db.collection("saas_users").doc(userId);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        return NextResponse.json(
          { error: "User profile not found." },
          { status: 404 }
        );
      }

      const userData = userDoc.data();
      const userCredits = userData?.credits || 0;
      const pendingDeductions = userData?.pending_deductions || 0;

      // Check against the *available* balance
      const availableBalance = userCredits - pendingDeductions;

      if (availableBalance < estimatedCost) {
        return NextResponse.json(
          {
            error: "Insufficient Credits",
            detail: `Your available credit of $${availableBalance.toFixed(
              2
            )} is not enough for the estimated job cost of $${estimatedCost.toFixed(
              2
            )}.`,
          },
          { status: 402 } // 402 Payment Required
        );
      }

      // If the check passes, place a "hold" on the credits by incrementing pending_deductions
      // This is an atomic operation and is safe from race conditions.
      await userDocRef.update({
        pending_deductions: FieldValue.increment(estimatedCost),
      });
    }

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

    if (!pythonApiResponse.ok) {
      // If enqueuing fails, we should revert the pending deduction
      if (typeof estimatedCost === "number") {
        const userDocRef = db.collection("saas_users").doc(userId);
        await userDocRef.update({
          pending_deductions: FieldValue.increment(-estimatedCost),
        });
      }
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
