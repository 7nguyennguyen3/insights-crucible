// app/api/jobs/[jobId]/share/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

/**
 * POST: Create a new public share link for a job.
 */
export async function POST(
  request: NextRequest,
  context: { params: { jobId: string } } // FIX: Changed signature
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;
    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const jobRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
    const docSnap = await jobRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Job not found or you do not have permission" },
        { status: 404 }
      );
    }

    const publicShareId = nanoid(22);

    await jobRef.update({
      isPublic: true,
      publicShareId: publicShareId,
    });

    console.log(
      `Public link created for job ${jobId} with shareId ${publicShareId}`
    );

    return NextResponse.json({
      message: "Public link created successfully.",
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${publicShareId}`,
    });
  } catch (error) {
    console.error("Error creating public share link:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Revoke an existing public share link for a job.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { jobId: string } } // FIX: Changed signature
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;
    const { jobId } = context.params; // FIX: Destructure from context

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const jobRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
    const docSnap = await jobRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Job not found or you do not have permission" },
        { status: 404 }
      );
    }

    await jobRef.update({
      isPublic: false,
      publicShareId: null,
    });

    console.log(`Public link revoked for job ${jobId}`);

    return NextResponse.json({ message: "Public link revoked successfully." });
  } catch (error) {
    console.error("Error revoking public share link:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
