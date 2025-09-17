// app/api/library/[jobId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

/**
 * POST: Add analysis to public library
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { description, tags, category } = body;

    if (!description || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: "Description and tags are required" },
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

    const jobData = docSnap.data();

    // Ensure the job is already public
    if (!jobData?.isPublic || !jobData?.publicShareId) {
      return NextResponse.json(
        { error: "Job must be publicly shared before adding to library" },
        { status: 400 }
      );
    }

    // Update with library metadata
    const libraryMeta = {
      libraryEnabled: true,
      libraryDescription: description,
      libraryTags: tags,
      libraryCategory: category || null,
      addedToLibraryAt: new Date().toISOString()
    };

    await jobRef.update({
      libraryMeta,
      viewCount: jobData.viewCount || 0 // Initialize view count if not present
    });

    console.log(`Analysis ${jobId} added to public library`);

    return NextResponse.json({
      message: "Analysis added to library successfully",
      libraryMeta
    });
  } catch (error) {
    console.error("Error adding analysis to library:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update library metadata for analysis
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { description, tags, category } = body;

    const jobRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
    const docSnap = await jobRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Job not found or you do not have permission" },
        { status: 404 }
      );
    }

    const jobData = docSnap.data();

    if (!jobData?.libraryMeta?.libraryEnabled) {
      return NextResponse.json(
        { error: "Analysis is not in the library" },
        { status: 400 }
      );
    }

    // Update library metadata
    const updatedLibraryMeta = {
      ...jobData.libraryMeta,
      libraryDescription: description || jobData.libraryMeta.libraryDescription,
      libraryTags: tags || jobData.libraryMeta.libraryTags,
      libraryCategory: category !== undefined ? category : jobData.libraryMeta.libraryCategory,
      lastUpdated: new Date().toISOString()
    };

    await jobRef.update({
      libraryMeta: updatedLibraryMeta
    });

    console.log(`Library metadata updated for analysis ${jobId}`);

    return NextResponse.json({
      message: "Library metadata updated successfully",
      libraryMeta: updatedLibraryMeta
    });
  } catch (error) {
    console.error("Error updating library metadata:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove analysis from public library
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

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

    // Remove from library while keeping public share active
    await jobRef.update({
      "libraryMeta.libraryEnabled": false,
      "libraryMeta.removedFromLibraryAt": new Date().toISOString()
    });

    console.log(`Analysis ${jobId} removed from public library`);

    return NextResponse.json({
      message: "Analysis removed from library successfully"
    });
  } catch (error) {
    console.error("Error removing analysis from library:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}