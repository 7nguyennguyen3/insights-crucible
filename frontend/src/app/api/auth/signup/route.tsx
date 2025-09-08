// Final code for src/app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";

import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/app/emails/WelcomeEmail";
import VerificationEmail from "@/app/emails/VerificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const getInitialCredits = () => {
  const promoEndDateString = process.env.NEXT_PUBLIC_PROMO_END_DATE; // e.g., "09/01"
  const promoCredits = parseInt(
    process.env.NEXT_PUBLIC_PROMO_CREDITS || "10",
    10
  );
  const defaultCredits = parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_CREDITS || "5",
    10
  );

  if (promoEndDateString && promoEndDateString.includes("/")) {
    const [month, day] = promoEndDateString.split("/");
    const currentYear = new Date().getFullYear();
    const promoEndDate = new Date(`${currentYear}-${month}-${day}T00:00:00Z`);
    const now = new Date();

    if (now < promoEndDate) {
      return promoCredits;
    }
  }

  return defaultCredits;
};

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
    // ADDED THIS LINE
    const creditsToGive = getInitialCredits();

    await db.collection("saas_users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      createdAt: new Date().toISOString(),
      analyses_remaining: creditsToGive,
      welcomeEmailSent: false,
    });

    try {
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/actions`,
        handleCodeInApp: true,
      };
      const signInLink = await auth.generateSignInWithEmailLink(
        email,
        actionCodeSettings
      );

      const emailHtml = await render(
        <VerificationEmail userName={name} verificationLink={signInLink} />
      );

      await resend.emails.send({
        from: "Jimmy from Insights Crucible <onboarding@insightscrucible.com>",
        to: [email],
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
    if (typeof error === "object" && error !== null && "code" in error) {
      if ((error as { code: string }).code === "auth/email-already-in-use") {
        errorMessage = "This email address is already in use.";
      }
    }

    return NextResponse.json(
      { error: "Failed to create user", message: errorMessage },
      { status: 409 }
    );
  }
}
