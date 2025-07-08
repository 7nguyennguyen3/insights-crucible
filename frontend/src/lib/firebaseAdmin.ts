import * as admin from "firebase-admin";

// --- THIS IS THE FIX ---
// Check if the app is already initialized to avoid errors during hot-reloading
if (!admin.apps.length) {
  try {
    // Get the bucket name from environment variables
    const bucketName = process.env.GCP_STORAGE_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCP_STORAGE_BUCKET_NAME environment variable not set.");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }),
      // Explicitly tell the Admin SDK which storage bucket to use
      storageBucket: bucketName,
    });
    console.log(
      "Firebase Admin initialized successfully for bucket:",
      bucketName
    );
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}
// --- END FIX ---

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export default admin;
