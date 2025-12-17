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
      console.log("🔍 API Route Debug - Missing publicShareId");
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
        `🔍 API Route Debug - No public job found for shareId: ${publicShareId}`
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
      structured_transcript: jobData.structured_transcript || null, // Don't return empty array, let parser handle fallback
      transcript: jobData.transcript || null, // Add for getStructuredTranscript fallback
      status: jobData.status,
      job_id: jobDoc.id,
      generated_quiz_questions: jobData.generated_quiz_questions || null,
      quiz_results: jobData.quiz_results || null,
      open_ended_results: jobData.open_ended_results || null,
      show_notes: jobData.show_notes || null, // Podcaster persona show notes
      section_analyses: jobData.section_analyses || null, // Podcaster persona section analyses
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
