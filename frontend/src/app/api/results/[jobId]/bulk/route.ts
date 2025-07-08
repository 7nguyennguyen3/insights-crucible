// api/results/[jobId]/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { AnalysisSection, SynthesisResults } from "@/app/_global/interface"; // Import SynthesisResults

export async function PATCH(
  request: NextRequest,
  context: { params: { jobId: string } }
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

    // --- CHANGE: Destructure the new updatedSynthesisResults property ---
    const {
      updatedResults,
      updatedJobTitle,
      updatedSlideDeck,
      updatedSynthesisResults,
      updatedArgumentStructure,
    } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const batch = db.batch();
    const jobDocRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);

    // 1. Update the individual analysis sections (no change here)
    if (Array.isArray(updatedResults)) {
      updatedResults.forEach((section: AnalysisSection) => {
        if (section.id) {
          const docRef = db
            .collection(`saas_users/${userId}/jobs/${jobId}/results`)
            .doc(section.id);
          const { id, ...dataToUpdate } = section;
          batch.update(docRef, dataToUpdate);
        }
      });
    }

    // 2. Update the main job title (no change here)
    if (typeof updatedJobTitle === "string") {
      batch.update(jobDocRef, { job_title: updatedJobTitle });
    }

    // 3. Update the slide deck outline (no change here)
    if (Array.isArray(updatedSlideDeck)) {
      batch.update(jobDocRef, { generated_slide_outline: updatedSlideDeck });
    }

    // --- CHANGE: Add logic to update the synthesis results ---
    if (updatedSynthesisResults) {
      batch.update(jobDocRef, { synthesis_results: updatedSynthesisResults });
    }

    if (updatedArgumentStructure) {
      batch.update(jobDocRef, { argument_structure: updatedArgumentStructure });
    }

    // Atomically commit all the changes
    await batch.commit();

    return NextResponse.json({ message: "Bulk update successful" });
  } catch (error) {
    console.error(`Bulk update failed for job ${context.params.jobId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
