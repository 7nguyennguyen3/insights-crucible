import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000/api";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string; questionId: string }> }) {
  try {
    // Authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { jobId, questionId } = await params;

    // Forward to FastAPI backend with new endpoint format
    const response = await fetch(`${BACKEND_URL}/grading-status/${jobId}/${questionId}?user_id=${userId}`, {
      method: "GET",
      headers: {
        "X-Internal-API-Key": INTERNAL_API_KEY || "",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Grading status check error:", error);
    return NextResponse.json(
      { error: "Failed to check grading status" },
      { status: 500 }
    );
  }
}