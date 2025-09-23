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

    // Fetch open-ended question results if they exist
    const openEndedQuestionsSnap = await jobDocRef
      .collection("open_ended_questions")
      .get();

    const openEndedQuestionsData = openEndedQuestionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Create open-ended results structure if we have completed answers
    let openEndedResults = null;
    const completedOpenEndedAnswers = openEndedQuestionsData.filter(
      (answer: any) => answer.grading_status === "COMPLETED"
    );

    if (completedOpenEndedAnswers.length > 0) {
      // Find the most recent completion date
      const completedAt = completedOpenEndedAnswers.reduce((latest: any, answer: any) => {
        return answer.graded_at && (!latest || answer.graded_at.seconds > latest.seconds) 
          ? answer.graded_at 
          : latest;
      }, null);

      openEndedResults = {
        open_ended_answers: completedOpenEndedAnswers,
        completed_at: completedAt,
        user_id: userId,
      };
    }

    const finalResponse = {
      job_id: jobDocSnap.id,
      status: jobData?.status,
      job_title: jobData?.job_title,
      structured_transcript: jobData?.structured_transcript || null,
      transcript: jobData?.transcript || null, // Add root-level transcript for YouTube sources

      generated_slide_outline: jobData?.generated_slide_outline || null,

      // --- FIX: Add this line to pass the config to the frontend ---
      request_data: jobData?.request_data || null,

      results: resultsData,
      synthesis_results: jobData?.synthesis_results || null,
      argument_structure: jobData?.argument_structure || null,

      // Learning accelerator specific fields
      learning_synthesis: jobData?.learning_synthesis || null,
      generated_quiz_questions: jobData?.generated_quiz_questions || null,

      // Quiz results for showing previous quiz completion
      quiz_results: jobData?.quiz_results || null,

      // Open-ended question results for showing previous open-ended completion
      open_ended_results: openEndedResults,

      // Library sharing fields
      isPublic: jobData?.isPublic || false,
      publicShareId: jobData?.publicShareId || null,
      libraryMeta: jobData?.libraryMeta || null,
      libraryDescriptionSuggestion: jobData?.libraryDescriptionSuggestion || null,
      libraryTagsSuggestion: jobData?.libraryTagsSuggestion || null,
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
