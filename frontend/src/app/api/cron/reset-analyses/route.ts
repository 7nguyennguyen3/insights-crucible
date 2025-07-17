// src/app/api/cron/reset-analyses/route.ts

import { db } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 1. Secure the endpoint
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Find all users on the "free" OR "founder" plan
    const usersRef = db.collection("saas_users");
    const usersToResetQuery = usersRef.where("plan", "in", ["free", "founder"]);
    const snapshot = await usersToResetQuery.get();

    if (snapshot.empty) {
      console.log("No users found on free or founder plans to reset.");
      return NextResponse.json({
        success: true,
        message: "No users to update.",
      });
    }

    // 3. Use a batch write for efficiency
    const batch = db.batch();
    let freeUsersCount = 0;
    let founderUsersCount = 0;
    const totalUsersChecked = snapshot.size;

    snapshot.docs.forEach((doc) => {
      const userRef = usersRef.doc(doc.id);
      const userData = doc.data();

      // Ensure 'analyses_remaining' exists and is a number, default to 0 if not
      const currentAnalyses = userData.analyses_remaining ?? 0;

      // --- START: CRUCIAL LOGIC FIX ---
      if (userData.plan === "free") {
        // Only update if their current balance is less than 3
        if (currentAnalyses < 3) {
          batch.update(userRef, { analyses_remaining: 3 });
          freeUsersCount++; // Only count users who are actually updated
        }
      } else if (userData.plan === "founder") {
        // Only update if their current balance is less than 30
        if (currentAnalyses < 30) {
          batch.update(userRef, { analyses_remaining: 30 });
          founderUsersCount++; // Only count users who are actually updated
        }
      }
      // --- END: CRUCIAL LOGIC FIX ---
    });

    // 4. Commit the batch
    await batch.commit();

    const successMessage = `Checked ${totalUsersChecked} users. Successfully topped-up credits for ${freeUsersCount} free users and ${founderUsersCount} founder users.`;
    console.log(successMessage);
    return NextResponse.json({
      success: true,
      message: successMessage,
      updated_counts: {
        free: freeUsersCount,
        founder: founderUsersCount,
        total_updated: freeUsersCount + founderUsersCount,
        total_checked: totalUsersChecked,
      },
    });
  } catch (error) {
    console.error("Error resetting user credits:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
