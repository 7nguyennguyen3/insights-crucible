import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

const PYTHON_API_URL =
  process.env.PYTHON_API_URL || "http://127.0.0.1:8000/api";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// --- MODIFICATION: Changed from POST to GET ---
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> } // <-- 1. Type is a Promise
) {
  const { jobId } = await params;
  try {
    // 1. Authenticate the user
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // 2. Get the job_id from the URL parameters
    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // 3. Forward the request to the Python backend's /results endpoint
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/results`, {
      method: "POST", // Python endpoint is still POST
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": INTERNAL_API_KEY!,
      },
      body: JSON.stringify({
        user_id: userId,
        job_id: jobId,
      }),
    });

    const responseData = await pythonApiResponse.json();

    if (!pythonApiResponse.ok) {
      return NextResponse.json(
        { error: "Error from results service", details: responseData },
        { status: pythonApiResponse.status }
      );
    }

    // 4. Return the final results to the client
    return NextResponse.json(responseData);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("session cookie") ||
        error.message.includes("revoked"))
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid session" },
        { status: 401 }
      );
    }
    console.error("Proxy error in /api/results/[jobId]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
