import WelcomeEmail from "@/app/emails/WelcomeEmail";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      // ✅ UPDATE THIS LINE
      from: "Jimmy from Insights Crucible <jimmy@insightscrucible.com>",

      // ✅ MAKE SURE THIS USES THE DYNAMIC EMAIL
      to: [email],

      subject: "Welcome to the Insights Crucible Waitlist!",
      react: WelcomeEmail({ userEmail: email }),
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json(
        { error: "Error sending email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Success!", data }, { status: 200 });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
