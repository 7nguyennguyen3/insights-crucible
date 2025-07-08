// app/api/auth/sessionLogin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // The session cookie will be valid for 14 days.
    const expiresIn = 60 * 60 * 24 * 14 * 1000;

    // 1. Create a session cookie from the ID token
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    // 2. Set the cookie on the response
    const response = NextResponse.json({ status: "success" });
    response.cookies.set({
      name: "session", // A standard name for session cookies
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("SESSION LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}
