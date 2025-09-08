// api/results/[jobId]/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { AnalysisSection, SynthesisResults } from "@/app/_global/interface";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> } // <-- 1. Type is a Promise
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

    // Destructure all possible fields from the request body
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

    // 1. Update individual analysis sections
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

    // 2. Create an object for all top-level field updates
    const topLevelUpdates: { [key: string]: any } = {};

    if (typeof updatedJobTitle === "string") {
      topLevelUpdates.job_title = updatedJobTitle;
    }
    if (Array.isArray(updatedSlideDeck)) {
      topLevelUpdates.generated_slide_outline = updatedSlideDeck;
    }
    if (updatedSynthesisResults) {
      topLevelUpdates.synthesis_results = updatedSynthesisResults;
    }
    if (updatedArgumentStructure) {
      topLevelUpdates.argument_structure = updatedArgumentStructure;
    }

    // 3. Apply all top-level updates in one go
    if (Object.keys(topLevelUpdates).length > 0) {
      batch.update(jobDocRef, topLevelUpdates);
    }

    // Atomically commit all the changes
    await batch.commit();

    return NextResponse.json({ message: "Bulk update successful" });
  } catch (error) {
    console.error(`Bulk update failed for job ${jobId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
