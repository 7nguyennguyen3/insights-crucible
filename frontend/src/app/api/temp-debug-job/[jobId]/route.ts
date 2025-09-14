// TEMPORARY DEBUG API - Returns raw job data as JSON
// app/api/temp-debug-job/[jobId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function GET(
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

    const jobDocRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
    const jobDocSnap = await jobDocRef.get();

    if (!jobDocSnap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get the raw job data
    const jobData = jobDocSnap.data();

    // Get all results subcollection data
    const resultsSnap = await jobDocRef
      .collection("results")
      .orderBy("start_time")
      .get();

    const resultsData = resultsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all open_ended_questions subcollection data
    const openEndedQuestionsSnap = await jobDocRef
      .collection("open_ended_questions")
      .get();

    const openEndedQuestionsData = openEndedQuestionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Truncate transcript to first 5 items if it exists
    const processedJobData = { ...jobData };
    if (processedJobData.transcript && Array.isArray(processedJobData.transcript)) {
      processedJobData.transcript = processedJobData.transcript.slice(0, 5);
    }

    // Build structured response that clearly shows database paths
    const rawJobData = {
      main_document: {
        path: `saas_users/${userId}/jobs/${jobDocSnap.id}`,
        document_id: jobDocSnap.id,
        data: processedJobData
      },
      subcollections: {} as any
    };

    // Add subcollections only if they have data
    if (resultsData.length > 0) {
      rawJobData.subcollections.results = {
        path: `saas_users/${userId}/jobs/${jobDocSnap.id}/results`,
        document_count: resultsData.length,
        documents: resultsData
      };
    }

    if (openEndedQuestionsData.length > 0) {
      rawJobData.subcollections.open_ended_questions = {
        path: `saas_users/${userId}/jobs/${jobDocSnap.id}/open_ended_questions`,
        document_count: openEndedQuestionsData.length,
        documents: openEndedQuestionsData
      };
    }

    return NextResponse.json(rawJobData, { status: 200 });
  } catch (error) {
    console.error(`Error fetching raw job data for ${jobId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}