//  src/app/api/auth/social-signin/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { stripe } from "@/lib/stripe";

import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/app/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// ADDED HELPER FUNCTION
const getInitialCredits = () => {
  const promoEndDateString = process.env.NEXT_PUBLIC_PROMO_END_DATE;
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
    const { uid, email, name } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    const userDocRef = db.collection("saas_users").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      const newStripeCustomer = await stripe.customers.create({
        email: email,
        name: name || email,
        metadata: {
          firebaseUID: uid,
        },
      });

      const creditsToGive = getInitialCredits();

      await userDocRef.set({
        uid,
        email,
        name: name || "User",
        createdAt: new Date().toISOString(),
        analyses_remaining: creditsToGive,
        stripeCustomerId: newStripeCustomer.id,
        welcomeEmailSent: true,
      });

      console.log(
        `New user document and Stripe customer created for UID: ${uid}`
      );

      try {
        const emailHtml = await render(
          <WelcomeEmail userEmail={email} userName={name || "there"} />
        );

        await resend.emails.send({
          from: "Nguyen from Insights Crucible <onboarding@insightscrucible.com>",
          to: [email],
          subject: "Welcome to Insights Crucible!",
          html: emailHtml,
          replyTo: "7nguyennguyen@gmail.com",
        });
        console.log(
          `Welcome email successfully queued for ${email} (social signup)`
        );
      } catch (emailError) {
        console.error(
          "Failed to send welcome email for social signup:",
          emailError
        );
      }
    } else {
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
