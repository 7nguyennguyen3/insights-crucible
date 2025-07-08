import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// We will listen to all events necessary for the full lifecycle
const relevantEvents = new Set([
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.deleted",
]);

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

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "checkout.session.completed":
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          console.log(
            `✅ Received checkout.session.completed for customer: ${checkoutSession.customer}`
          );

          const customerId = checkoutSession.customer as string;
          if (!customerId) {
            throw new Error("Missing customer ID in checkout session.");
          }

          const userQuery = await db
            .collection("saas_users")
            .where("stripeCustomerId", "==", customerId)
            .limit(1)
            .get();
          if (userQuery.empty) {
            break;
          }
          const userDoc = userQuery.docs[0];
          const userId = userDoc.id;

          // --- UNIFIED LOGIC FOR FULFILLMENT ---
          if (checkoutSession.mode === "subscription") {
            console.log(
              `Upgrading user ${userId} to Pro plan and granting welcome credits.`
            );

            // 1. Update plan and grant initial credits in one step
            await userDoc.ref.update({
              plan: "pro",
              credits: FieldValue.increment(5.0), // Grant $5 welcome credit
            });

            // 2. Create the usage record for the credit grant
            await db.collection("usage_records").add({
              userId: userId,
              jobId: null,
              jobTitle: "Pro Plan Welcome Credits",
              type: "credit",
              usageMetric: null,
              costInUSD: 5.0, // Positive value for credits
              createdAt: FieldValue.serverTimestamp(),
              breakdown: null,
            });
            console.log(`Granted $5.00 welcome credit to user ${userId}.`);
          } else if (checkoutSession.mode === "payment") {
            console.log(
              `Processing one-time credit purchase for user ${userId}.`
            );
            const amountPaid = checkoutSession.amount_total || 0;
            const creditsToGrant = amountPaid / 100;

            if (creditsToGrant > 0) {
              await userDoc.ref.update({
                credits: FieldValue.increment(creditsToGrant),
              });

              await db.collection("usage_records").add({
                userId: userId,
                jobId: null,
                jobTitle: `$${creditsToGrant.toFixed(2)} Credit Purchase`,
                type: "credit",
                usageMetric: null,
                costInUSD: creditsToGrant,
                createdAt: FieldValue.serverTimestamp(),
                breakdown: null,
              });
              console.log(
                `Granted $${creditsToGrant.toFixed(
                  2
                )} purchased credit to user ${userId}.`
              );
            }
          }
          break;

        case "invoice.paid":
          // This event is now primarily for *recurring* subscription payments.
          // The initial payment is handled by checkout.session.completed.
          const invoice = event.data.object as Stripe.Invoice;
          // The 'billing_reason' can be 'subscription_cycle' for renewals.
          if (invoice.billing_reason === "subscription_cycle") {
            console.log(
              `✅ Received recurring invoice.paid for customer: ${invoice.customer}`
            );
            // Add logic here to grant monthly credits for Pro plan renewals
          }
          break;

        case "customer.subscription.deleted":
          const subscription = event.data.object as Stripe.Subscription;
          const customerId_deleted = subscription.customer as string;
          console.log(
            `Subscription cancelled for customer: ${customerId_deleted}`
          );

          const userQuery_deleted = await db
            .collection("saas_users")
            .where("stripeCustomerId", "==", customerId_deleted)
            .limit(1)
            .get();
          if (!userQuery_deleted.empty) {
            const userDoc = userQuery_deleted.docs[0];
            // Downgrade user back to the free plan
            await userDoc.ref.update({
              plan: "free",
            });
            console.log(
              `User ${userDoc.id} downgraded to free plan due to cancellation.`
            );
          }
          break;

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

  return NextResponse.json({ received: true });
}
