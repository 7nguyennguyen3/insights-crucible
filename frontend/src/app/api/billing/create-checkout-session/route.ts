import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { Stripe } from "stripe";

// --- THIS IS THE FIX ---
// List all of your subscription Price IDs here.
// For now, it's just the one for your Pro Plan.
const SUBSCRIPTION_PRICE_IDS = new Set([
  "price_1Rb1IDGouIqXjNckkNEPW61t", // Your $10/mo Pro Plan Price ID
]);
// --- END FIX ---

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { priceId, customAmount, success_url, cancel_url } =
      await request.json();

    if (!success_url || !cancel_url || (!priceId && !customAmount)) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: decodedToken.email,
        name: userDoc.data()?.name,
        metadata: { firebaseUID: userId },
      });
      stripeCustomerId = customer.id;
      await userDocRef.update({ stripeCustomerId });
    }

    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // --- THIS IS THE FIX ---
    // Default to 'payment' mode for one-time purchases.
    let mode: "subscription" | "payment" = "payment";

    if (priceId) {
      line_items.push({ price: priceId, quantity: 1 });
      // If the provided Price ID is in our list of subscriptions, change the mode.
      if (SUBSCRIPTION_PRICE_IDS.has(priceId)) {
        mode = "subscription";
      }
    } else if (customAmount) {
      const amountInCents = Math.round(parseFloat(customAmount) * 100);

      if (amountInCents < 100) {
        return NextResponse.json(
          { error: "Custom amount must be at least $1.00" },
          { status: 400 }
        );
      }

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Custom Credit Top-up",
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      });
      mode = "payment";
    }
    // --- END FIX ---

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: line_items,
      mode: mode, // The mode is now set dynamically
      success_url: success_url,
      cancel_url: cancel_url,
    });

    if (!session.id) {
      throw new Error("Could not create Stripe Checkout session.");
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
