// app/api/results/[jobId]/[sectionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  context: { params: { jobId: string; sectionId: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { jobId, sectionId } = await context.params;
    const body = await request.json();

    if (!jobId || !sectionId) {
      return NextResponse.json(
        { error: "Job ID and Section ID are required" },
        { status: 400 }
      );
    }

    const resultDocRef = db
      .collection(`saas_users/${userId}/jobs/${jobId}/results`)
      .doc(sectionId);

    const docSnap = await resultDocRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Result section not found" },
        { status: 404 }
      );
    }

    await resultDocRef.update(body);

    return NextResponse.json({ message: "Update successful" }, { status: 200 });
  } catch (error) {
    console.error(`Error updating result section:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
