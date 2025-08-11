import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { auth, db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

// This set defines which Stripe events our webhook will process.
const relevantEvents = new Set([
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.updated",
  "customer.subscription.deleted",
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
        // --- Handles new subscriptions and one-time purchases ---
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

          // Handle a new subscription
          if (
            checkoutSession.mode === "subscription" &&
            checkoutSession.subscription
          ) {
            let subscription: Stripe.Subscription;
            if (typeof checkoutSession.subscription === "string") {
              subscription = await stripe.subscriptions.retrieve(
                checkoutSession.subscription
              );
            } else {
              subscription = checkoutSession.subscription;
            }

            const priceId = subscription.items.data[0].price.id;
            let plan = "free";
            let creditsToGrant = 0;

            // UPDATED LOGIC: Check for Starter or Pro plan
            if (
              priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID
            ) {
              plan = "starter";
              creditsToGrant = 30;
            } else if (
              priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID
            ) {
              plan = "pro";
              creditsToGrant = 100;
            }

            if (plan !== "free" && creditsToGrant > 0) {
              await auth.setCustomUserClaims(userId, { plan });
              await userDoc.ref.update({
                plan: plan,
                analyses_remaining: FieldValue.increment(creditsToGrant),
                nextBillingDate: subscription.items.data[0].current_period_end,
                cancel_at_period_end: false,
                subscription_ends_at: null,
              });
              console.log(
                `✅ User ${userId} subscribed to ${plan} plan, granting ${creditsToGrant} credits.`
              );
              // TODO: Consider sending a welcome email or in-app notification here.
            }
          }
          // Handle a one-time credit pack purchase
          else if (checkoutSession.mode === "payment") {
            const lineItems = await stripe.checkout.sessions.listLineItems(
              checkoutSession.id
            );
            const lineItem = lineItems.data[0];
            const priceId = lineItem.price?.id;

            if (
              priceId === process.env.NEXT_PUBLIC_STRIPE_ANALYSIS_PACK_PRICE_ID
            ) {
              const baseQuantity = lineItem.quantity ?? 0;
              let bonusQuantity = 0;

              // This is our new business logic for tiered bonuses
              if (baseQuantity === 100) {
                // Corresponds to the $20 pack
                bonusQuantity = 20;
              } else if (baseQuantity === 250) {
                // Corresponds to the $50 pack
                bonusQuantity = 75;
              } else if (baseQuantity === 25) {
                // Corresponds to the $5 pack
                bonusQuantity = 3;
              }

              const totalCreditsToGrant = baseQuantity + bonusQuantity;

              if (totalCreditsToGrant > 0) {
                await userDoc.ref.update({
                  analyses_remaining: FieldValue.increment(totalCreditsToGrant),
                });
                // The new console log is more descriptive for easier debugging
                console.log(
                  `✅ User ${userId} purchased ${baseQuantity} credits + ${bonusQuantity} bonus. Total granted: ${totalCreditsToGrant}.`
                );
              }
            }
          }
          break;
        }

        // --- Handles recurring subscription payments (credit refills) ---
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.lines.data[0]?.subscription as string;

          if (
            invoice.billing_reason === "subscription_cycle" &&
            subscriptionId
          ) {
            const customerId = invoice.customer as string;
            const userQuery = await db
              .collection("saas_users")
              .where("stripeCustomerId", "==", customerId)
              .limit(1)
              .get();

            if (!userQuery.empty) {
              const userDoc = userQuery.docs[0];
              const subscription =
                await stripe.subscriptions.retrieve(subscriptionId);

              const userData = userDoc.data();
              let creditsToRefill = 0;

              // UPDATED LOGIC: Refill credits based on the user's plan
              if (userData?.plan === "starter") {
                creditsToRefill = 30;
              } else if (userData?.plan === "pro") {
                creditsToRefill = 100;
              }

              if (creditsToRefill > 0) {
                await userDoc.ref.update({
                  analyses_remaining: FieldValue.increment(creditsToRefill),
                  nextBillingDate:
                    subscription.items.data[0].current_period_end,
                });
                console.log(
                  `✅ Refilled ${creditsToRefill} credits for ${userData?.plan} user ${userDoc.id}.`
                );
              }
            }
          }
          break;
        }

        // --- Handles subscription cancellation requests (e.g., user clicks "cancel") ---
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const userQuery = await db
            .collection("saas_users")
            .where("stripeCustomerId", "==", customerId)
            .limit(1)
            .get();

          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            await userDoc.ref.update({
              cancel_at_period_end: subscription.cancel_at_period_end,
              subscription_ends_at: subscription.cancel_at,
            });

            if (subscription.cancel_at_period_end) {
              console.log(
                `✅ User ${userDoc.id} set subscription to cancel at period end.`
              );
            } else {
              console.log(
                `✅ User ${userDoc.id} reactivated their subscription.`
              );
            }
          }
          break;
        }

        // --- Handles when a subscription is fully ended and deleted ---
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const userQuery = await db
            .collection("saas_users")
            .where("stripeCustomerId", "==", customerId)
            .limit(1)
            .get();

          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userId = userDoc.id;

            // Downgrade user to the free plan
            await auth.setCustomUserClaims(userId, { plan: "free" });
            await userDoc.ref.update({
              plan: "free",
              nextBillingDate: null,
              cancel_at_period_end: false,
              subscription_ends_at: null,
            });
            console.log(`✅ User ${userDoc.id} downgraded to free plan.`);
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
