import { NextRequest, NextResponse } from "next/server";
import { auth, db, storage } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// Helper function to recursively delete a collection
async function deleteCollection(
  collectionRef: FirebaseFirestore.CollectionReference,
  batchSize: number
) {
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(
  query: FirebaseFirestore.Query,
  resolve: (value?: unknown) => void
) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    return resolve();
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { jobId } = await request.json();
    if (!jobId)
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );

    const jobDocRef = db.collection(`saas_users/${userId}/jobs`).doc(jobId);
    const jobDocSnap = await jobDocRef.get();

    if (!jobDocSnap.exists) {
      return new NextResponse(null, { status: 204 }); // Job already gone
    }

    const jobData = jobDocSnap.data();

    // 1. Delete associated file from Google Cloud Storage, if it exists
    if (jobData?.request_data?.storagePath) {
      try {
        await storage
          .bucket(process.env.GCP_STORAGE_BUCKET_NAME)
          .file(jobData.request_data.storagePath)
          .delete();
        console.log(`Deleted GCS file: ${jobData.request_data.storagePath}`);
      } catch (gcsError: any) {
        if (gcsError.code !== 404) {
          // Don't throw error if file is already gone
          console.error("Error deleting GCS file:", gcsError);
        }
      }
    }

    // 2. Delete the 'results' subcollection
    const resultsCollectionRef = jobDocRef.collection("results");
    await deleteCollection(resultsCollectionRef, 100);
    console.log(`Deleted results subcollection for job ${jobId}`);

    // 3. Finally, delete the main job document
    await jobDocRef.delete();
    console.log(`Deleted main job document ${jobId}`);

    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for successful delete
  } catch (error) {
    console.error("Proxy error in /api/jobs/delete:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
