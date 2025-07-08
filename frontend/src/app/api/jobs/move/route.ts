import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore"; // <-- Import FieldValue

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;
    const { jobId, folderId } = await request.json();

    const jobRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);

    // --- THIS IS THE FIX ---
    // If folderId is null or undefined, delete the field.
    // Otherwise, update it with the new folderId.
    const updateData = {
      folderId: folderId ? folderId : FieldValue.delete(),
    };
    await jobRef.update(updateData);
    // --- END FIX ---

    return NextResponse.json({
      message: `Job successfully moved.`,
    });
  } catch (error) {
    console.error("MOVE JOB: An error was caught:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
