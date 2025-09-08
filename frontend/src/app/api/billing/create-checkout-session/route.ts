//src/app/api/billing/create-checkout-session

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";

// Import credit pack Price IDs
const starterPackPriceId = process.env.NEXT_PUBLIC_STRIPE_STARTER_PACK_PRICE_ID;
const professionalPackPriceId = process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PACK_PRICE_ID;
const ultimatePackPriceId = process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_PACK_PRICE_ID;

// Validate the required environment variables
if (!starterPackPriceId || !professionalPackPriceId || !ultimatePackPriceId) {
  throw new Error(
    "Missing credit pack Stripe Price ID environment variables. Please check your .env.local file."
  );
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { priceId, quantity, success_url, cancel_url } = await request.json();

    if (!priceId || !success_url || !cancel_url) {
      return NextResponse.json(
        { error: "Missing required parameters from the client." },
        { status: 400 }
      );
    }

    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: decodedToken.email,
        metadata: { firebaseUID: userId },
      });
      stripeCustomerId = customer.id;
      await userDocRef.update({ stripeCustomerId });
    }

    // All purchases are now one-time payments (no subscriptions)
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: quantity || 1,
        },
      ],
      mode: "payment", // Always payment mode for credit packs
      success_url: success_url,
      cancel_url: cancel_url,
    });

    if (!session.id) {
      throw new Error("Could not create Stripe Checkout session.");
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    // This detailed logging is correct and will help if an error still occurs
    console.error(
      "FULL STRIPE CHECKOUT ERROR:",
      JSON.stringify(error, null, 2)
    );

    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
