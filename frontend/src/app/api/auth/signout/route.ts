import { NextResponse } from "next/server";

export async function POST() {
  try {
    // To sign out, we send back a response that clears the session cookie.
    const response = NextResponse.json({
      message: "Signout successful",
      success: true,
    });

    // Setting the cookie with maxAge: 0 tells the browser to expire it immediately.
    response.cookies.set({
      name: "session",
      value: "", // The value doesn't matter since it's being expired
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0, // Expire immediately
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("SIGNOUT ERROR:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Failed to sign out", message: errorMessage },
      { status: 500 }
    );
  }
}
