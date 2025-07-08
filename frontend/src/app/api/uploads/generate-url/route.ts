import { NextRequest, NextResponse } from "next/server";
import { auth, storage } from "@/lib/firebaseAdmin"; // Make sure storage is exported from your firebaseAdmin.ts
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid"; // We'll use UUIDs for unique file names

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { fileName, fileType } = await request.json();
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "File name and type are required" },
        { status: 400 }
      );
    }

    const bucket = storage.bucket(process.env.GCP_STORAGE_BUCKET_NAME);

    // Create a unique file path to prevent overwrites
    const filePath = `uploads/${userId}/${uuidv4()}-${fileName}`;
    const file = bucket.file(filePath);

    // V4 signed URL configuration for a resumable upload
    const options = {
      version: "v4" as const,
      action: "write" as const,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    };

    // Generate the secure URL
    const [uploadUrl] = await file.getSignedUrl(options);

    // Return the URL and the path to the frontend
    return NextResponse.json({ uploadUrl, filePath });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
