// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";

import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/app/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 1. Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Create user document in Firestore
    await db.collection("saas_users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      createdAt: new Date().toISOString(),
      plan: "free",
      analyses_remaining: 5,
    });

    try {
      // Render the React email component to an HTML string
      // AWAIT THE RENDER FUNCTION HERE
      const emailHtml = await render(
        <WelcomeEmail userEmail={email} userName={name} />
      );

      // Send the email
      await resend.emails.send({
        from: "Jimmy from Insights Crucible <onboarding@insightscrucible.com>", // Ensure this domain is verified in Resend
        to: [email], // Send the email to the new user's email address
        subject: "Welcome to Insights Crucible!",
        html: emailHtml,
        replyTo: "jimmy@insightscrucible.com",
      });
      console.log(`Welcome email successfully queued for ${email}`);
    } catch (emailSendError) {
      console.error(
        `Failed to send welcome email to ${email}:`,
        emailSendError
      );
    }

    return NextResponse.json(
      { message: "User created successfully. Please sign in." },
      { status: 201 }
    );
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    let errorMessage = "An unexpected error occurred during sign up.";

    // Safely check if the error is a Firebase error object
    if (typeof error === "object" && error !== null && "code" in error) {
      // Firebase Auth error code for email already in use
      if ((error as { code: string }).code === "auth/email-already-in-use") {
        errorMessage = "This email address is already in use.";
      }
    }

    return NextResponse.json(
      { error: "Failed to create user", message: errorMessage },
      { status: 409 } // Use 409 Conflict for an existing user
    );
  }
}
