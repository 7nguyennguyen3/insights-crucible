// app/api/public/analysis/[publicShareId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { AnalysisSection } from "@/app/_global/interface";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicShareId: string }> } // <-- 1. Type is a Promise
) {
  const { publicShareId } = await params;
  try {
    if (!publicShareId) {
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      );
    }

    const querySnapshot = await db
      .collectionGroup("jobs")
      .where("publicShareId", "==", publicShareId)
      .where("isPublic", "==", true)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      console.log(
        `[Public API] No public job found for shareId: ${publicShareId}`
      );
      return NextResponse.json(
        { error: "Analysis not found or share link is inactive" },
        { status: 404 }
      );
    }

    const jobDoc = querySnapshot.docs[0];
    const jobData = jobDoc.data();

    const resultsSnapshot = await jobDoc.ref
      .collection("results")
      .orderBy("start_time")
      .get();

    const resultsData = resultsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AnalysisSection[];

    const publicData = {
      job_title: jobData.job_title,
      request_data: jobData.request_data,
      results: resultsData,
      structured_transcript: jobData.structured_transcript || [],
      status: jobData.status,
      job_id: jobDoc.id,
      generated_blog_post: jobData.generated_blog_post || null,
      generated_overall_x_thread: jobData.generated_overall_x_thread || null,
      generated_linkedin_post: jobData.generated_linkedin_post || null,

      // --- ADD THESE TWO LINES ---
      synthesis_results: jobData.synthesis_results || null,
      argument_structure: jobData.argument_structure || null,
      generated_slide_outline: jobData.generated_slide_outline || null,
      global_contextual_briefing: jobData.global_contextual_briefing || null,
    };

    return NextResponse.json(publicData);
  } catch (error) {
    console.error("[Public API] An unexpected error occurred:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
