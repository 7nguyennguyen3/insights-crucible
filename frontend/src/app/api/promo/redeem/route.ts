// src/app/api/promo/redeem/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import admin from "firebase-admin";

// Helper function to apply the reward to the user's document
const applyReward = async (
  transaction: admin.firestore.Transaction,
  userDocRef: admin.firestore.DocumentReference,
  reward: { credits?: number; plan?: string }
) => {
  const updateData: { [key: string]: any } = {};

  if (reward.credits && reward.credits > 0) {
    // Use FieldValue.increment for safe, atomic credit additions
    updateData.analyses_remaining = admin.firestore.FieldValue.increment(
      reward.credits
    );
  }

  if (reward.plan) {
    updateData.plan = reward.plan;
  }

  // Update the user document within the transaction
  transaction.update(userDocRef, updateData);
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 2. Get the promo code from the request body
    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Promo code is required." },
        { status: 400 }
      );
    }
    const promoCode = code.toUpperCase().trim();

    // 3. Define references to Firestore documents
    const promoCodeRef = db.collection("promo_codes").doc(promoCode);
    const userDocRef = db.collection("saas_users").doc(userId);
    const redeemedCodeRef = userDocRef
      .collection("redeemedCodes")
      .doc(promoCode);

    // 4. Run a transaction for atomicity
    await db.runTransaction(async (transaction) => {
      // Fetch all necessary documents within the transaction
      const promoDoc = await transaction.get(promoCodeRef);
      const userDoc = await transaction.get(userDocRef);
      const redeemedDoc = await transaction.get(redeemedCodeRef);

      // --- Validation Checks ---
      if (!promoDoc.exists) {
        throw new Error("Invalid promo code.");
      }

      if (!userDoc.exists) {
        throw new Error("User profile not found.");
      }

      if (redeemedDoc.exists) {
        throw new Error("You have already redeemed this code.");
      }

      const promoData = promoDoc.data();
      if (!promoData) {
        throw new Error("Invalid promo code data.");
      }

      // Check for expiration
      if (promoData.expiresAt && new Date(promoData.expiresAt) < new Date()) {
        throw new Error("This promo code has expired.");
      }

      // Check usage limits
      if (promoData.maxUses && promoData.currentUses >= promoData.maxUses) {
        throw new Error("This promo code has reached its redemption limit.");
      }

      // --- Apply Reward and Update State ---

      // Apply the reward to the user
      await applyReward(transaction, userDocRef, promoData.reward);

      // Increment the promo code's usage count
      transaction.update(promoCodeRef, {
        currentUses: admin.firestore.FieldValue.increment(1),
      });

      // Mark the code as redeemed for this user
      transaction.set(redeemedCodeRef, {
        redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
        reward: promoData.reward, // Store what they received
      });
    });

    return NextResponse.json({ message: "Promo code redeemed successfully!" });
  } catch (error: any) {
    console.error("Promo Redemption Error:", error);
    // Return the specific error message from our validation checks
    return NextResponse.json(
      { error: error.message || "An internal error occurred." },
      { status: 400 }
    );
  }
}
