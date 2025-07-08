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

    const { notificationId } = await request.json();
    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // --- THIS IS THE FIX ---
    // The path is changed from "users" to "saas_users" to match your database structure.
    const notifRef = db
      .collection(`saas_users/${userId}/notifications`)
      .doc(notificationId);

    // We use a `try/catch` here in case the document doesn't exist.
    try {
      await notifRef.update({ isRead: true });
    } catch (docError) {
      // This can happen if the user clicks very fast, it's not a critical error.
      console.warn(
        `Could not find notification ${notificationId} to mark as read.`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
