import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // --- THIS IS THE MODIFICATION ---
    // We create the user document in the 'saas_users' collection to be consistent.
    // We also add the 'plan' and starting 'credits'.
    await db.collection("saas_users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      createdAt: new Date().toISOString(),
      plan: "free",
      credits: 2.0,
      pending_deductions: 0, // Add this line
    });
    // --- END MODIFICATION ---

    return NextResponse.json(
      { message: "User created successfully. Please sign in." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("SIGNUP ERROR:", error);
    const errorMessage =
      error.code === "auth/email-already-exists"
        ? "This email address is already in use."
        : "An unexpected error occurred during sign up.";

    return NextResponse.json(
      { error: "Failed to create user", message: errorMessage },
      { status: 500 }
    );
  }
}
