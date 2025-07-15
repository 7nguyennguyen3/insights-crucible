import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function POST(_request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 2. Get user's active subscription ID
    const userDoc = await db.collection("saas_users").doc(userId).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;
    if (!stripeCustomerId) {
      throw new Error("Stripe customer not found.");
    }
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active", // It's still 'active' even when scheduled to cancel
      limit: 1,
    });
    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found to reactivate.");
    }
    const subscriptionId = subscriptions.data[0].id;

    // 3. Tell Stripe to keep the subscription active
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    // 4. Update the user's document in Firestore
    await db.collection("saas_users").doc(userId).update({
      cancel_at_period_end: false,
      subscription_ends_at: null,
    });

    return NextResponse.json({ message: "Subscription reactivated." });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Reactivation API Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
