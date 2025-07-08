// app/api/notifications/mark-all-as-read/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const notificationsRef = db.collection(
      `saas_users/${userId}/notifications`
    );

    // 1. Find all unread notifications for the user.
    const unreadQuery = notificationsRef.where("isRead", "==", false);
    const unreadSnapshot = await unreadQuery.get();

    if (unreadSnapshot.empty) {
      // No unread notifications to mark, which is a success case.
      return NextResponse.json({
        success: true,
        message: "No unread notifications.",
      });
    }

    // 2. Use a batch write to update all found documents efficiently.
    const batch = db.batch();
    unreadSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });

    // 3. Commit the batch.
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
