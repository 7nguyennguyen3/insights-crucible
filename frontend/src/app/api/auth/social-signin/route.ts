// app/api/auth/social-signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

/**
 * This endpoint is responsible for creating a user document in Firestore
 * the first time a user signs in with a social provider (e.g., Google).
 */
export async function POST(request: NextRequest) {
  try {
    const { uid, email, name } = await request.json();

    // Basic validation
    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    // Check if the user document already exists in Firestore
    const userDocRef = db.collection("saas_users").doc(uid);
    const userDoc = await userDocRef.get();

    // If the document does not exist, it's a new user. Create the document.
    if (!userDoc.exists) {
      await userDocRef.set({
        uid,
        email,
        name: name || "User", // Use the provided name or a default
        createdAt: new Date().toISOString(),
        plan: "free", // Default plan for new users
        credits: 2.0, // Default credits for new users
        pending_deductions: 0,
      });
      console.log(`New user document created for UID: ${uid}`);
    }

    return NextResponse.json(
      { status: "success", message: "User document verified or created." },
      { status: 200 }
    );
  } catch (error) {
    console.error("SOCIAL SIGN-IN ERROR:", error);
    return NextResponse.json(
      { error: "Failed to process social sign-in" },
      { status: 500 }
    );
  }
}
