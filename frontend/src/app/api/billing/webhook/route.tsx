// /api/billing/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { auth, db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

import { Resend } from "resend";
import { render } from "@react-email/render";
import CharterWelcomeEmail from "@/app/emails/CharterWelcomeEmail";

const relevantEvents = new Set([
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.updated", // Added
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

  // ✨ MODIFICATION: Added idempotency check to prevent processing the same event twice.
  const eventRef = db.collection("processed_stripe_events").doc(event.id);
  const eventDoc = await eventRef.get();
  if (eventDoc.exists) {
    console.log(`✅ Event ${event.id} already processed.`);
    return NextResponse.json({ received: true });
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

            // Check if the subscription is for the Charter Member plan
            if (
              priceId ===
              process.env.NEXT_PUBLIC_STRIPE_CHARTER_MEMBER_PLAN_PRICE_ID
            ) {
              plan = "charter";

              // ✨ MODIFICATION: Define base, bonus, and total credits separately for clarity.
              const baseCredits = 25;
              const bonusCredits = 5;
              const totalCreditsToGrant = baseCredits + bonusCredits;

              // Update database and send email for the charter plan
              await auth.setCustomUserClaims(userId, { plan });
              await userDoc.ref.update({
                plan: plan,
                analyses_remaining: FieldValue.increment(totalCreditsToGrant),
                nextBillingDate: subscription.items.data[0].current_period_end,
                cancel_at_period_end: false,
                subscription_ends_at: null,
              });
              console.log(
                `✅ User ${userId} subscribed to ${plan} plan, granting ${totalCreditsToGrant} credits.`
              );

              // Logic to send welcome email with the correct props
              try {
                const userData = userDoc.data();
                if (userData?.email) {
                  // ✨ MODIFICATION: Pass baseCredits and bonusCredits to the email component.
                  const emailHtml = await render(
                    <CharterWelcomeEmail
                      userName={userData.name}
                      baseCredits={baseCredits}
                      bonusCredits={bonusCredits}
                    />
                  );
                  await resend.emails.send({
                    from: "Jimmy from Insights Crucible <onboarding@insightscrucible.com>",
                    to: [userData.email],
                    subject: "Thank you for becoming a Charter Member!",
                    html: emailHtml,
                  });
                  console.log(`✅ Welcome email queued for ${userData.email}.`);
                }
              } catch (emailError) {
                console.error(
                  `Failed to send welcome email for user ${userId}:`,
                  emailError
                );
              }

              try {
                const notificationsCollectionRef = db.collection(
                  `saas_users/${userId}/notifications`
                );
                await notificationsCollectionRef.add({
                  message: `Welcome to the Charter Member family! 🎉 You've received ${bonusCredits} 
                  bonus analysis credits as a token of our appreciation.`,
                  isRead: false,
                  link: "/account",
                  createdAt: FieldValue.serverTimestamp(),
                });
                console.log(
                  `✅ Notification added for user ${userId} regarding ${bonusCredits} bonus credits.`
                );
              } catch (notificationError) {
                console.error(
                  `❌ Failed to create bonus credit notification for user ${userId}:`,
                  notificationError
                );
              }
            }

            // You can add 'else if' blocks here for future plans like the "Pro" plan.
          } else if (checkoutSession.mode === "payment") {
            // Your one-time payment logic (which is correct) remains here.
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
                  `✅ User ${userId} purchased ${quantity} one-time analyses.`
                );
              }
            }
          }
          break;
        }

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

              // ✨ MODIFICATION: Refill with 25 base credits for Charter plan renewals.
              // This logic correctly handles the charter plan. You can add an `else if` for the pro plan later.
              if (userDoc.data()?.plan === "charter") {
                await userDoc.ref.update({
                  analyses_remaining: FieldValue.increment(25),
                  nextBillingDate:
                    subscription.items.data[0].current_period_end,
                });
                console.log(
                  `✅ Refilled 25 credits for charter user ${userDoc.id}.`
                );
              }
            }
          }
          break;
        }

        // ✨ MODIFICATION: New handler for subscription updates (e.g., cancellation requests).
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
            const updateData: {
              cancel_at_period_end: boolean;
              subscription_ends_at: number | null;
            } = {
              cancel_at_period_end: subscription.cancel_at_period_end,
              subscription_ends_at: subscription.cancel_at,
            };

            await userDoc.ref.update(updateData);

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

        case "customer.subscription.deleted": {
          // This logic is now correct, as it runs only when the subscription is truly over.
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

            await auth.setCustomUserClaims(userId, { plan: "free" });
            await userDoc.ref.update({
              plan: "free",
              // Optionally clear subscription-specific fields
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

  // ✨ MODIFICATION: After successful processing, mark the event ID as handled.
  await eventRef.set({
    processedAt: FieldValue.serverTimestamp(),
    eventType: event.type,
  });

  return NextResponse.json({ received: true });
}
