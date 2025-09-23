// app/api/library/bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

interface BulkLibraryRequest {
  jobIds: string[];
  description: string;
  tags: string[];
  category?: string;
}

interface IndividualMetadata {
  description?: string;
  tags?: string[];
}

interface HybridBulkLibraryRequest {
  jobIds: string[];
  sharedMetadata: {
    description: string;
    tags: string[];
    category?: string;
  };
  individualOverrides: Record<string, IndividualMetadata>;
}

interface BulkLibraryResult {
  jobId: string;
  success: boolean;
  error?: string;
}

/**
 * POST: Add multiple analyses to public library with shared metadata
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const body = await request.json();

    // Support both old and new format for backward compatibility
    let sharedMetadata: { description: string; tags: string[]; category?: string };
    let individualOverrides: Record<string, IndividualMetadata> = {};
    let jobIds: string[];

    if (body.sharedMetadata) {
      // New hybrid format
      const hybridBody: HybridBulkLibraryRequest = body;
      sharedMetadata = hybridBody.sharedMetadata;
      individualOverrides = hybridBody.individualOverrides || {};
      jobIds = hybridBody.jobIds;
    } else {
      // Legacy format
      const legacyBody: BulkLibraryRequest = body;
      sharedMetadata = {
        description: legacyBody.description,
        tags: legacyBody.tags,
        category: legacyBody.category
      };
      jobIds = legacyBody.jobIds;
    }

    // Validation
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "Job IDs array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (!sharedMetadata.description || !Array.isArray(sharedMetadata.tags)) {
      return NextResponse.json(
        { error: "Description and tags are required" },
        { status: 400 }
      );
    }

    if (jobIds.length > 50) {
      return NextResponse.json(
        { error: "Cannot process more than 50 analyses at once" },
        { status: 400 }
      );
    }

    const results: BulkLibraryResult[] = [];
    const batch = db.batch();
    const addedToLibraryAt = new Date().toISOString();

    // Process each job
    for (const jobId of jobIds) {
      try {
        const jobRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
        const docSnap = await jobRef.get();

        if (!docSnap.exists) {
          results.push({
            jobId,
            success: false,
            error: "Job not found or you do not have permission"
          });
          continue;
        }

        const jobData = docSnap.data();

        // Check if already in library
        if (jobData?.libraryMeta?.libraryEnabled) {
          results.push({
            jobId,
            success: false,
            error: "Analysis is already in the library"
          });
          continue;
        }

        // Ensure the job is public - if not, make it public
        let publicShareId = jobData?.publicShareId;
        let isPublic = jobData?.isPublic;

        if (!isPublic || !publicShareId) {
          publicShareId = nanoid(22);
          isPublic = true;
        }

        // Get effective metadata for this job (individual overrides or shared)
        const individualData = individualOverrides[jobId];
        const effectiveDescription = individualData?.description || sharedMetadata.description;
        const effectiveTags = individualData?.tags
          ? [...new Set([...sharedMetadata.tags, ...individualData.tags])]
          : sharedMetadata.tags;

        // Prepare library metadata
        const libraryMeta = {
          libraryEnabled: true,
          libraryDescription: effectiveDescription,
          libraryTags: effectiveTags,
          libraryCategory: sharedMetadata.category || null,
          addedToLibraryAt
        };

        // Add to batch - update both public sharing and library metadata
        batch.update(jobRef, {
          isPublic,
          publicShareId,
          libraryMeta,
          viewCount: jobData?.viewCount || 0
        });

        results.push({
          jobId,
          success: true
        });

      } catch (error) {
        console.error(`Error processing job ${jobId}:`, error);
        results.push({
          jobId,
          success: false,
          error: "Processing error"
        });
      }
    }

    // Execute batch operation for successful jobs
    const successfulJobs = results.filter(r => r.success);
    if (successfulJobs.length > 0) {
      await batch.commit();
      console.log(`Bulk added ${successfulJobs.length} analyses to library`);
    }

    const failedJobs = results.filter(r => !r.success);
    const summary = {
      total: jobIds.length,
      successful: successfulJobs.length,
      failed: failedJobs.length
    };

    return NextResponse.json({
      message: `Bulk operation completed: ${summary.successful} added, ${summary.failed} failed`,
      summary,
      results
    });

  } catch (error) {
    console.error("Error in bulk library operation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove multiple analyses from public library
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { jobIds }: { jobIds: string[] } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "Job IDs array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (jobIds.length > 50) {
      return NextResponse.json(
        { error: "Cannot process more than 50 analyses at once" },
        { status: 400 }
      );
    }

    const results: BulkLibraryResult[] = [];
    const batch = db.batch();
    const removedFromLibraryAt = new Date().toISOString();

    // Process each job
    for (const jobId of jobIds) {
      try {
        const jobRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
        const docSnap = await jobRef.get();

        if (!docSnap.exists) {
          results.push({
            jobId,
            success: false,
            error: "Job not found or you do not have permission"
          });
          continue;
        }

        const jobData = docSnap.data();

        if (!jobData?.libraryMeta?.libraryEnabled) {
          results.push({
            jobId,
            success: false,
            error: "Analysis is not in the library"
          });
          continue;
        }

        // Add to batch
        batch.update(jobRef, {
          "libraryMeta.libraryEnabled": false,
          "libraryMeta.removedFromLibraryAt": removedFromLibraryAt
        });

        results.push({
          jobId,
          success: true
        });

      } catch (error) {
        console.error(`Error processing job ${jobId}:`, error);
        results.push({
          jobId,
          success: false,
          error: "Processing error"
        });
      }
    }

    // Execute batch operation for successful jobs
    const successfulJobs = results.filter(r => r.success);
    if (successfulJobs.length > 0) {
      await batch.commit();
      console.log(`Bulk removed ${successfulJobs.length} analyses from library`);
    }

    const failedJobs = results.filter(r => !r.success);
    const summary = {
      total: jobIds.length,
      successful: successfulJobs.length,
      failed: failedJobs.length
    };

    return NextResponse.json({
      message: `Bulk removal completed: ${summary.successful} removed, ${summary.failed} failed`,
      summary,
      results
    });

  } catch (error) {
    console.error("Error in bulk library removal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}