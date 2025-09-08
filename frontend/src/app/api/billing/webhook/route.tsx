import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { auth, db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

// This set defines which Stripe events our webhook will process.
const relevantEvents = new Set([
  "checkout.session.completed", // Only handle one-time credit purchases
]);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = (await headers()).get("Stripe-Signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Idempotency check: prevent processing the same event twice.
  const eventRef = db.collection("processed_stripe_events").doc(event.id);
  const eventDoc = await eventRef.get();
  if (eventDoc.exists) {
    console.log(`✅ Event ${event.id} already processed.`);
    return NextResponse.json({ received: true });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        // --- Handles one-time credit pack purchases only ---
        case "checkout.session.completed": {
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          const customerId = checkoutSession.customer as string;

          const userQuery = await db
            .collection("saas_users")
            .where("stripeCustomerId", "==", customerId)
            .limit(1)
            .get();

          if (userQuery.empty) {
            console.error(
              `Webhook Error: No user found for Stripe Customer ID: ${customerId}`
            );
            break;
          }
          const userDoc = userQuery.docs[0];
          const userId = userDoc.id;

          // All purchases are now one-time credit packs
          const lineItems = await stripe.checkout.sessions.listLineItems(
            checkoutSession.id
          );
          const lineItem = lineItems.data[0];
          const priceId = lineItem.price?.id;
          
          let creditsToGrant = 0;

          // Map price IDs to credit amounts
          if (priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PACK_PRICE_ID) {
            creditsToGrant = 30; // Starter pack
          } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PACK_PRICE_ID) {
            creditsToGrant = 75; // Professional pack (60 base + 15 bonus)
          } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_PACK_PRICE_ID) {
            creditsToGrant = 170; // Ultimate pack (120 base + 50 bonus)
          }

          if (creditsToGrant > 0) {
            await userDoc.ref.update({
              analyses_remaining: FieldValue.increment(creditsToGrant),
            });
            console.log(
              `✅ User ${userId} purchased ${creditsToGrant} credits.`
            );
          }
          break;
        }

        default:
          console.log(`Unhandled relevant event type: ${event.type}`);
          break;
      }
    } catch (error) {
      console.log("Webhook handler error:", error);
      return NextResponse.json(
        { error: "Webhook handler failed." },
        { status: 500 }
      );
    }
  }

  // After successful processing, mark the event ID as handled.
  await eventRef.set({
    processedAt: FieldValue.serverTimestamp(),
    eventType: event.type,
  });

  return NextResponse.json({ received: true });
}
