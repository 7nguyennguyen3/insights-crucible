import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

interface OpenEndedProgressRequest {
  jobId: string;
  userId: string;
  questionId: string;
  questionIndex: number;
  userAnswer: string;
  isSubmitted: boolean; // true when user submits answer, false for auto-save
}

interface OpenEndedQuestionProgress {
  id: string;
  job_id: string;
  user_id: string;
  question_id: string;
  question_index: number;
  user_answer: string;
  is_submitted: boolean;
  submitted_at?: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    // In a real implementation, you'd verify the Firebase Auth token
    // For now, we'll proceed with the request

    const body: OpenEndedProgressRequest = await request.json();
    const { jobId, userId, questionId, questionIndex, userAnswer, isSubmitted } = body;

    if (!jobId || !userId || !questionId || userAnswer === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Firestore
    const db = getFirestore();

    // Create a unique document ID for this progress entry
    const progressId = `${userId}_${jobId}_${questionId}`;

    // Prepare progress data
    const progressData: Partial<OpenEndedQuestionProgress> = {
      job_id: jobId,
      user_id: userId,
      question_id: questionId,
      question_index: questionIndex,
      user_answer: userAnswer,
      is_submitted: isSubmitted,
      updated_at: new Date() as any, // Firestore will convert this to Timestamp
    };

    // Add submitted_at timestamp if this is a submission
    if (isSubmitted) {
      progressData.submitted_at = new Date() as any;
    }

    // Save progress to a subcollection under the job
    const progressRef = db
      .collection("saas_users")
      .doc(userId)
      .collection("jobs")
      .doc(jobId)
      .collection("open_ended_progress")
      .doc(progressId);

    await progressRef.set(progressData, { merge: true });

    return NextResponse.json({
      success: true,
      message: isSubmitted ? "Answer submitted successfully" : "Progress saved",
      data: {
        progress_id: progressId,
        job_id: jobId,
        user_id: userId,
        question_id: questionId,
        is_submitted: isSubmitted,
        updated_at: progressData.updated_at,
      },
    });
  } catch (error) {
    console.error("Error saving open-ended progress:", error);

    // Handle specific Firestore errors
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      if (error.message.includes("permission")) {
        return NextResponse.json(
          { error: "Permission denied" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const userId = searchParams.get("userId");

    if (!jobId || !userId) {
      return NextResponse.json(
        { error: "Missing jobId or userId" },
        { status: 400 }
      );
    }

    // Initialize Firestore
    const db = getFirestore();

    // Get all progress for this job and user
    const progressRef = db
      .collection("saas_users")
      .doc(userId)
      .collection("jobs")
      .doc(jobId)
      .collection("open_ended_progress");

    const snapshot = await progressRef.get();

    const progressData: OpenEndedQuestionProgress[] = [];
    snapshot.forEach((doc) => {
      progressData.push({
        id: doc.id,
        ...doc.data(),
      } as OpenEndedQuestionProgress);
    });

    return NextResponse.json({
      success: true,
      data: progressData,
    });
  } catch (error) {
    console.error("Error retrieving open-ended progress:", error);

    return NextResponse.json(
      { error: "Failed to retrieve progress" },
      { status: 500 }
    );
  }
}