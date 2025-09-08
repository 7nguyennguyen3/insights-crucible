import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { cookies } from "next/headers";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

export async function GET(request: NextRequest) {
  try {
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the session cookie
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // Query for the latest learning_accelerator job
    const jobsRef = db.collection(`saas_users/${userId}/jobs`);
    const snapshot = await jobsRef
      .where(
        "request_data.config.analysis_persona",
        "==",
        "learning_accelerator"
      )
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        {
          error: "No learning_accelerator jobs found",
          message: "Try creating a learning_accelerator analysis first",
        },
        { status: 404 }
      );
    }

    const jobDoc = snapshot.docs[0];
    const jobData = jobDoc.data();
    const jobId = jobDoc.id;

    // Get all section results from the subcollection
    const resultsRef = db.collection(
      `saas_users/${userId}/jobs/${jobId}/results`
    );
    const resultsSnapshot = await resultsRef.orderBy("start_time").get();
    const sectionResults = resultsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Return the complete job data
    const response = {
      jobId,
      jobData: {
        ...jobData,
        createdAt: jobData.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: jobData.updatedAt?.toDate?.()?.toISOString() || null,
      },
      sectionResults,
      totalSections: sectionResults.length,
      persona: jobData.request_data?.config?.analysis_persona || "unknown",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching learning accelerator data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
