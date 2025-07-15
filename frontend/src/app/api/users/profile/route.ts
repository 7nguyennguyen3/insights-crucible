import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function GET(_request: NextRequest) {
  try {
    // 1. Authenticate the user from their session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 2. Fetch the user's document from Firestore
    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    let nextBillingDate: number | null = null;

    // 3. If the user has a Stripe ID, fetch their active subscription
    if (userData?.stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: userData.stripeCustomerId,
        status: "active",
        limit: 1,
      });

      const subscription = subscriptions.data[0];

      // 4. Safely get the billing date from the nested subscription item
      if (subscription && subscription.items.data.length > 0) {
        nextBillingDate = subscription.items.data[0].current_period_end;
      }
    }

    // 5. Assemble and return the final profile object
    const userProfile = {
      plan: userData?.plan || "free",
      analyses_remaining: userData?.analyses_remaining || 0,
      nextBillingDate: nextBillingDate,
      cancel_at_period_end: userData?.cancel_at_period_end || false,
      subscription_ends_at: userData?.subscription_ends_at || null,
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
