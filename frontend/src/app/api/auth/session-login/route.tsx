// app/api/auth/session-login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin"; // ⬅️ ADD db IMPORT
import { Resend } from "resend"; // ⬅️ ADD Resend IMPORT
import { render } from "@react-email/render"; // ⬅️ ADD render IMPORT
import WelcomeEmail from "@/app/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // ⬇️ ADDED: Decode token to get user info and check if email is verified
    const decodedToken = await auth.verifyIdToken(idToken);

    if (!decodedToken.email_verified) {
      // This is an extra security check, though your frontend should already prevent this.
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    const { uid, email, name } = decodedToken;

    // ⬇️ ADDED: Check if we need to send the welcome email
    const userDocRef = db.collection("saas_users").doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists && userDoc.data()?.welcomeEmailSent === false) {
      console.log(`Sending post-verification welcome email to ${email}...`);

      // Render the welcome email (without a verification link)
      const emailHtml = await render(
        <WelcomeEmail userEmail={email!} userName={name} />
      );

      // Send the email using Resend
      await resend.emails.send({
        from: "Jimmy from Insights Crucible <onboarding@insightscrucible.com>",
        to: [email!],
        subject: "Welcome to Insights Crucible!",
        html: emailHtml,
        replyTo: "jimmy@insightscrucible.com",
      });

      // Update the flag in Firestore so we don't send it again
      await userDocRef.update({ welcomeEmailSent: true });
    }

    // --- The original logic for creating the session cookie ---
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    const response = NextResponse.json({ status: "success" });
    response.cookies.set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("SESSION LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}
