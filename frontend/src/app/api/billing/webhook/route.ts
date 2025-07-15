// /api/billing/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { auth, db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

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
            let creditsToAdd = 0;

            if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID) {
              plan = "pro";
              creditsToAdd = 25;
            } else if (
              priceId ===
              process.env.NEXT_PUBLIC_STRIPE_CHARTER_MEMBER_PLAN_PRICE_ID
            ) {
              plan = "charter";
              creditsToAdd = 25;
            }

            // ✅ FIX: Access current_period_end from the subscription item.
            const nextBillingDate =
              subscription.items.data[0].current_period_end;

            if (plan !== "free") {
              await auth.setCustomUserClaims(userId, { plan });
              await userDoc.ref.update({
                plan: plan,
                analyses_remaining: FieldValue.increment(creditsToAdd),
                nextBillingDate: nextBillingDate,
                cancel_at_period_end: false,
                subscription_ends_at: null,
              });
              console.log(`✅ User ${userId} subscribed to ${plan} plan.`);
            }
          } else if (checkoutSession.mode === "payment") {
            const lineItems = await stripe.checkout.sessions.listLineItems(
              checkoutSession.id
            );
            const lineItem = lineItems.data[0];
            const priceId = lineItem.price?.id;

            if (
              priceId === process.env.NEXT_PUBLIC_STRIPE_ANALYSIS_PACK_PRICE_ID
            ) {
              const quantity = lineItem.quantity ?? 0;
              if (quantity > 0) {
                await userDoc.ref.update({
                  analyses_remaining: FieldValue.increment(quantity),
                });
                console.log(
                  `✅ User ${userId} purchased ${quantity} analyses.`
                );
              }
            }
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;

          // ✅ FIX: Use the correct path for the subscription ID from the invoice.
          const subscriptionId =
            invoice.parent?.subscription_details?.subscription;

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
              const userPlan = userDoc.data()?.plan;

              // Declare the subscription variable that we will populate.
              let subscription: Stripe.Subscription;

              // Check if you have the ID (string) or the full object.
              if (typeof subscriptionId === "string") {
                // If it's a string, retrieve the subscription object from Stripe.
                subscription =
                  await stripe.subscriptions.retrieve(subscriptionId);
              } else {
                // If it's already an object, just assign it.
                subscription = subscriptionId;
              }

              // Now you can safely use the 'subscription' object.
              // ✅ FIX: Access current_period_end from the subscription item.
              const nextBillingDate =
                subscription.items.data[0].current_period_end;

              const updateData: {
                nextBillingDate: number;
                analyses_remaining?: FirebaseFirestore.FieldValue;
              } = {
                nextBillingDate: nextBillingDate,
              };

              if (userPlan === "pro" || userPlan === "charter") {
                updateData.analyses_remaining = FieldValue.increment(25);
              }

              await userDoc.ref.update(updateData);
              console.log(
                `✅ Refilled credits for ${userPlan} user ${userDoc.id}.`
              );
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const deletedCustomerId = subscription.customer as string;

          const deletedUserQuery = await db
            .collection("saas_users")
            .where("stripeCustomerId", "==", deletedCustomerId)
            .limit(1)
            .get();

          if (!deletedUserQuery.empty) {
            const deletedUserDoc = deletedUserQuery.docs[0];
            const userId = deletedUserDoc.id;

            await auth.setCustomUserClaims(userId, { plan: "free" });

            await deletedUserDoc.ref.update({
              plan: "free",
            });
            console.log(`User ${deletedUserDoc.id} downgraded to free plan.`);
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

  return NextResponse.json({ received: true });
}
