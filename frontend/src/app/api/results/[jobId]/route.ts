// app/api/results/[jobId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function GET(
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

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const jobDocRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
    const jobDocSnap = await jobDocRef.get();

    if (!jobDocSnap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const jobData = jobDocSnap.data();

    const resultsSnap = await jobDocRef
      .collection("results")
      .orderBy("start_time")
      .get();

    const resultsData = resultsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const finalResponse = {
      job_id: jobDocSnap.id,
      status: jobData?.status,
      job_title: jobData?.job_title,
      structured_transcript: jobData?.structured_transcript || null,
      global_contextual_briefing: jobData?.global_contextual_briefing || null,

      generated_slide_outline: jobData?.generated_slide_outline || null,

      generated_blog_post: jobData?.generated_blog_post || null,
      generated_overall_x_thread: jobData?.generated_overall_x_thread || null,

      // --- FIX: Add this line to pass the config to the frontend ---
      request_data: jobData?.request_data || null,

      results: resultsData,
      synthesis_results: jobData?.synthesis_results || null,
      argument_structure: jobData?.argument_structure || null,
      isPublic: jobData?.isPublic || false,
      publicShareId: jobData?.publicShareId || null,
    };

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error(`Error fetching results for job ${jobId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
