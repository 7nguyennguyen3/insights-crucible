// /app/api/feature-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { FeatureRequestNotificationEmail } from "@/lib/emails/FeatureRequestNotificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.BUSINESS_EMAIL;

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY || !TO_EMAIL) {
    console.error("Missing required environment variables for sending email.");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  try {
    const { title, description, email, priority } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required." },
        { status: 400 }
      );
    }

    // 1. Save to Firestore Database
    const requestRef = await db.collection("feature_requests").add({
      title,
      description,
      priority: priority || "Important",
      submittedBy: email || "anonymous",
      submittedAt: new Date(),
      status: "pending",
    });

    // 2. Render the React Email component to an HTML string
    const emailHtml = await render(
      <FeatureRequestNotificationEmail
        title={title}
        description={description}
        priority={priority || "Important"}
        submittedBy={email || "anonymous"}
        requestId={requestRef.id}
      />
    );

    // 3. Send the rendered HTML using Resend
    await resend.emails.send({
      from: "Feature Bot <bot@insightscrucible.com>",
      to: TO_EMAIL,
      subject: `New Feature Request: ${title}`,
      html: emailHtml,
    });

    return NextResponse.json({
      message: "Thank you for your feedback!",
      id: requestRef.id,
    });
  } catch (error) {
    console.error("Feature request error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
