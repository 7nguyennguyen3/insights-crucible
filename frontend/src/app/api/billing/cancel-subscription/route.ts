//api/billing/cancel-subscription/route.ts

import type { Stripe } from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function POST(_request: NextRequest) {
  try {
    // 1. Authenticate the user and get their ID
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 2. Retrieve the user's Stripe Customer ID from Firestore
    const userDoc = await db.collection("saas_users").doc(userId).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;
    if (!stripeCustomerId) {
      throw new Error("Stripe customer not found.");
    }

    // 3. Find the user's active subscription on Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });
    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription to cancel.");
    }
    const subscriptionId = subscriptions.data[0].id;

    // 4. Tell Stripe to cancel the subscription at the end of the current billing period
    const updatedSubscription: Stripe.Subscription =
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

    // 5. Create a safe data object for Firestore, preventing 'undefined' values
    const dataToUpdate = {
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      // ✅ Use the 'cancel_at' property. It holds the timestamp for the end of the period.
      ...(updatedSubscription.cancel_at && {
        subscription_ends_at: updatedSubscription.cancel_at,
      }),
    };

    // 6. Update the user's document in Firestore with the cancellation status and end date
    await db.collection("saas_users").doc(userId).update(dataToUpdate);

    return NextResponse.json({
      message: "Subscription cancellation scheduled successfully.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Cancellation API Error:", error); // Log the full error on the server
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
