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
    const { jobId } = await request.json();

    const docRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const currentIsStarred = docSnap.data()?.isStarred || false;

    await docRef.update({
      isStarred: !currentIsStarred,
    });

    return NextResponse.json({
      message: "Star status updated successfully.",
      newStatus: !currentIsStarred,
    });
  } catch (error) {
    console.error("TOGGLE STAR: An error was caught:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
