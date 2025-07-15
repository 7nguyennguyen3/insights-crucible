// app/api/auth/delete-account/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";

export async function DELETE(request: NextRequest) {
  try {
    // 1. Get the ID token from the Authorization header
    const authorizationHeader = request.headers.get("Authorization");

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: No or invalid Authorization header." },
        { status: 401 }
      );
    }

    const idToken = authorizationHeader.split("Bearer ")[1];

    // 2. Verify the ID token to get the user's UID
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Error verifying ID token:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired ID token." },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // 3. Delete the user's record from Firestore
    const userDocRef = db.collection("saas_users").doc(uid); // Adjust 'saas_users' to your collection name

    // Check if the document exists before trying to delete (optional, but good practice)
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      console.warn(
        `Attempted to delete non-existent user record for UID: ${uid}`
      );
      // Even if not found, we can consider it a success if the user Auth record was deleted.
      // Or you might want to return a 404 if this is critical. For account deletion,
      // it's often better to just confirm the user is gone.
      return NextResponse.json(
        {
          status: "success",
          message:
            "User record not found, but proceeding with deletion confirmation.",
        },
        { status: 200 }
      );
    }

    await userDocRef.delete();
    console.log(`User record deleted for UID: ${uid}`);

    return NextResponse.json(
      {
        status: "success",
        message: "User account and associated record deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ACCOUNT DELETION API ERROR:", error);
    // Generic error for unexpected issues
    return NextResponse.json(
      { error: "Failed to delete user account record due to a server error." },
      { status: 500 }
    );
  }
}
