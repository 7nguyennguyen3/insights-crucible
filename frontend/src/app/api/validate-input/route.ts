// app/api/validate-input/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

// Define your business limits here.
// Keep them in one place for easy updates.
const MAX_AUDIO_SECONDS = 3600; // 1 hour
const MAX_TRANSCRIPT_CHARS = 50000; // Approx. 8,000-10,000 words

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the user first
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await auth.verifySessionCookie(sessionCookie, true);

    // 2. Get the input length from the request
    const { duration_seconds, character_count } = await request.json();

    // 3. Perform the server-side validation
    if (typeof duration_seconds === "number") {
      if (duration_seconds > MAX_AUDIO_SECONDS) {
        return NextResponse.json(
          {
            error: `Audio is too long. Maximum duration is ${
              MAX_AUDIO_SECONDS / 60
            } minutes.`,
          },
          { status: 413 } // 413 Payload Too Large
        );
      }
    } else if (typeof character_count === "number") {
      if (character_count > MAX_TRANSCRIPT_CHARS) {
        return NextResponse.json(
          {
            error: `Transcript is too long. Maximum length is ${MAX_TRANSCRIPT_CHARS} characters.`,
          },
          { status: 413 }
        );
      }
    } else {
      // If the request body is malformed
      return NextResponse.json(
        { error: "Invalid validation request." },
        { status: 400 }
      );
    }

    // 4. If validation passes, return success
    return NextResponse.json({ message: "Validation successful." });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
