// app/api/library/view/[publicShareId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

/**
 * POST: Track a view for a library entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicShareId: string }> }
) {
  const { publicShareId } = await params;
  try {
    if (!publicShareId) {
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      );
    }

    // Find the job by publicShareId
    const querySnapshot = await db
      .collectionGroup("jobs")
      .where("publicShareId", "==", publicShareId)
      .where("isPublic", "==", true)
      .where("libraryMeta.libraryEnabled", "==", true)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "Library entry not found" },
        { status: 404 }
      );
    }

    const jobDoc = querySnapshot.docs[0];
    const jobData = jobDoc.data();

    // Increment view count
    const currentViewCount = jobData.viewCount || 0;
    await jobDoc.ref.update({
      viewCount: currentViewCount + 1,
      lastViewedAt: new Date().toISOString()
    });

    return NextResponse.json({
      message: "View tracked successfully",
      viewCount: currentViewCount + 1
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}