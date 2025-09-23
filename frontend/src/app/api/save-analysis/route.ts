import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

interface SaveAnalysisRequest {
  publicShareId: string;
  customTitle?: string;
}

interface SaveAnalysisResponse {
  success: boolean;
  jobId?: string;
  message: string;
  creditsRemaining?: number;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 2. Parse request body
    const body: SaveAnalysisRequest = await request.json();
    const { publicShareId, customTitle } = body;

    if (!publicShareId) {
      return NextResponse.json(
        { success: false, message: "Public share ID is required" },
        { status: 400 }
      );
    }

    // 3. Check user's credit balance
    const userDocRef = db.collection("saas_users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentCredits = userData?.analyses_remaining || 0;
    const requiredCredits = 0.5;

    if (currentCredits < requiredCredits) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient credits. You need ${requiredCredits} credits but have ${currentCredits}.`,
          creditsRemaining: currentCredits,
        },
        { status: 400 }
      );
    }

    // 4. Find the public analysis
    let publicAnalysis = null;
    let originalDocPath = null;
    let originalJobRef = null;

    // Search across all user collections for the public analysis
    const usersSnapshot = await db.collection("saas_users").get();
    for (const userDocSnap of usersSnapshot.docs) {
      const jobsSnapshot = await userDocSnap.ref
        .collection("jobs")
        .where("publicShareId", "==", publicShareId)
        .where("isPublic", "==", true)
        .limit(1)
        .get();

      if (!jobsSnapshot.empty) {
        const jobDoc = jobsSnapshot.docs[0];
        publicAnalysis = jobDoc.data();
        originalDocPath = jobDoc.ref.path;
        originalJobRef = jobDoc.ref;
        break;
      }
    }

    if (!publicAnalysis || !originalJobRef) {
      return NextResponse.json(
        { success: false, message: "Public analysis not found or not accessible" },
        { status: 404 }
      );
    }

    // 4.1. Fetch the results subcollection from the original analysis
    let originalResults: any[] = [];
    try {
      const resultsSnapshot = await originalJobRef.collection("results").get();
      originalResults = resultsSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } catch (error) {
      console.warn("Could not fetch results subcollection:", error);
      // Continue without results - some analyses might not have results
    }

    // 5. Check if user already saved this analysis
    const existingSaveQuery = await db
      .collection("saas_users")
      .doc(userId)
      .collection("jobs")
      .where("originalPublicShareId", "==", publicShareId)
      .limit(1)
      .get();

    if (!existingSaveQuery.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already saved this analysis to your dashboard",
          jobId: existingSaveQuery.docs[0].id,
        },
        { status: 400 }
      );
    }

    // 6. Create a copy of the analysis for the user
    const newJobId = db.collection("_").doc().id; // Generate new ID

    // Prepare the job data (exclude user-specific data)
    const newJobData: any = {
      ...publicAnalysis,
      // Override with new metadata
      job_id: newJobId,
      job_title: customTitle || `${publicAnalysis.job_title} (Saved Copy)`,
      createdAt: FieldValue.serverTimestamp(),
      status: "COMPLETED",
      // Mark as saved copy
      originalPublicShareId: publicShareId,
      originalJobPath: originalDocPath,
      savedAt: FieldValue.serverTimestamp(),
      // Remove public sharing data for the copy (delete undefined fields)
      isPublic: false,
    };

    // Remove fields that should not be copied (Firestore doesn't accept undefined)
    delete newJobData.publicShareId;
    delete newJobData.libraryMeta;
    delete newJobData.viewCount;
    delete newJobData.quiz_results;
    delete newJobData.open_ended_results;

    // Clean up any other undefined fields that might exist
    Object.keys(newJobData).forEach(key => {
      if (newJobData[key] === undefined) {
        delete newJobData[key];
      }
    });

    // 7. Perform the save operation atomically
    await db.runTransaction(async (transaction) => {
      // Deduct credits
      transaction.update(userDocRef, {
        analyses_remaining: FieldValue.increment(-requiredCredits),
      });

      // Save the analysis copy
      const newJobRef = db
        .collection("saas_users")
        .doc(userId)
        .collection("jobs")
        .doc(newJobId);

      transaction.set(newJobRef, newJobData);

      // Copy all results from the original analysis
      for (const result of originalResults) {
        const newResultRef = newJobRef.collection("results").doc(result.id);
        transaction.set(newResultRef, result.data);
      }
    });

    // 8. Get updated credit balance
    const updatedUserDoc = await userDocRef.get();
    const updatedCredits = updatedUserDoc.data()?.analyses_remaining || 0;

    const response: SaveAnalysisResponse = {
      success: true,
      jobId: newJobId,
      message: "Analysis successfully saved to your dashboard",
      creditsRemaining: updatedCredits,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error saving analysis:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}