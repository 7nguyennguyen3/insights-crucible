import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { jobId, newTitle } = await request.json();
    if (
      !jobId ||
      !newTitle ||
      typeof newTitle !== "string" ||
      newTitle.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Job ID and a valid new title are required" },
        { status: 400 }
      );
    }

    // Get reference to the document and update it directly
    const docRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
    await docRef.update({ job_title: newTitle.trim() });

    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for successful update
  } catch (error) {
    console.error("Proxy error in /api/jobs/rename:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
