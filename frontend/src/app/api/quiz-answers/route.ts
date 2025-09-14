import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

interface QuizAnswer {
  questionIndex: number;
  selectedAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  question: string;
  correctAnswer: "A" | "B" | "C" | "D";
}

interface QuizAnswersRequest {
  jobId: string;
  userId: string;
  answers: QuizAnswer[];
  finalScore: {
    correct: number;
    total: number;
  };
}

interface QuizResults {
  quiz_answers: QuizAnswer[];
  final_score: {
    correct: number;
    total: number;
  };
  completed_at: FirebaseFirestore.Timestamp;
  user_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    // In a real implementation, you'd verify the Firebase Auth token
    // For now, we'll proceed with the request

    const body: QuizAnswersRequest = await request.json();
    const { jobId, userId, answers, finalScore } = body;

    if (!jobId || !userId || !answers || !finalScore) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Firestore
    const db = getFirestore();

    // Prepare quiz results data
    const quizResults: QuizResults = {
      quiz_answers: answers,
      final_score: finalScore,
      completed_at: new Date() as any, // Firestore will convert this to Timestamp
      user_id: userId,
    };

    // Save quiz results to the job document
    const jobRef = db
      .collection("saas_users")
      .doc(userId)
      .collection("jobs")
      .doc(jobId);

    await jobRef.update({
      quiz_results: quizResults,
    });

    return NextResponse.json({
      success: true,
      message: "Quiz answers saved successfully",
      data: {
        job_id: jobId,
        user_id: userId,
        completed_at: quizResults.completed_at,
      },
    });
  } catch (error) {
    console.error("Error saving quiz answers:", error);

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
      { error: "Failed to save quiz answers" },
      { status: 500 }
    );
  }
}
