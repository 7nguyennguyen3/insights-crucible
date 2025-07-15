// app/api/auth/social-signin/route.tsx <-- Rename to .tsx
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { stripe } from "@/lib/stripe";

import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/app/emails/WelcomeEmail"; // Adjust this path if your email component is elsewhere

const resend = new Resend(process.env.RESEND_API_KEY);

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
      // ✅ 1. Create a corresponding customer in Stripe
      const newStripeCustomer = await stripe.customers.create({
        email: email,
        name: name || email, // Use email as a fallback for name
        metadata: {
          firebaseUID: uid, // Recommended: Link Stripe customer to Firebase UID
        },
      });

      // ✅ 2. Save the new Stripe Customer ID to the user's document
      await userDocRef.set({
        uid,
        email,
        name: name || "User", // Provide a default name if 'name' is not present
        createdAt: new Date().toISOString(),
        plan: "free",
        analyses_remaining: 5,
        stripeCustomerId: newStripeCustomer.id, // <-- Add this line
      });

      console.log(
        `New user document and Stripe customer created for UID: ${uid}`
      );

      // --- NEW CODE: Send Welcome Email for Social Sign-Up ---
      try {
        // Render your React email component to HTML
        // Use a default name like "there" if `name` is null/undefined
        const emailHtml = await render(
          <WelcomeEmail userEmail={email} userName={name || "there"} />
        );

        // Send the email
        await resend.emails.send({
          from: "Jimmy from Insights Crucible <onboarding@insightscrucible.com>", // Ensure this domain is verified in Resend
          to: [email], // Send to the newly signed-up user's email
          subject: "Welcome to Insights Crucible!",
          html: emailHtml,
          replyTo: "jimmy@insightscrucible.com",
        });
        console.log(
          `Welcome email successfully queued for ${email} (social signup)`
        );
      } catch (emailError) {
        console.error(
          "Failed to send welcome email for social signup:",
          emailError
        );
        // Decide if you want to return an error here or continue.
        // Often, a failed welcome email isn't critical enough to stop user creation.
      }
      // --- END NEW CODE ---
    } else {
      // If user document already exists, it's a returning social login.
      // You can log this or do other returning user-specific actions here,
      // but no email sending is needed as per your requirement.
      console.log(`Returning user login via social provider for UID: ${uid}`);
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
