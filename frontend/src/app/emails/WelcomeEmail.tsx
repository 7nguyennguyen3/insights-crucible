// src/emails/WelcomeEmail.tsx

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";

const Logo = () => (
  <Text
    style={{
      ...paragraph,
      fontSize: "20px",
      fontWeight: "bold",
      margin: "0 0 20px 0",
    }}
  >
    Insights Crucible
  </Text>
);

// --- ADD THIS HELPER FUNCTION ---
const getInitialCredits = () => {
  const promoEndDateString = process.env.NEXT_PUBLIC_PROMO_END_DATE;
  const promoCredits = parseInt(
    process.env.NEXT_PUBLIC_PROMO_CREDITS || "10",
    10
  );
  const defaultCredits = parseInt(
    process.env.NEXT_PUBLIC_DEFAULT_CREDITS || "5",
    10
  );

  if (promoEndDateString && promoEndDateString.includes("/")) {
    const [month, day] = promoEndDateString.split("/");
    const currentYear = new Date().getFullYear();
    // Sets the promo end to the beginning of the specified day
    const promoEndDate = new Date(`${currentYear}-${month}-${day}T00:00:00Z`);
    const now = new Date();

    if (now < promoEndDate) {
      return promoCredits;
    }
  }

  return defaultCredits;
};

interface WelcomeEmailProps {
  userEmail: string;
  userName?: string;
  verificationLink?: string;
}

export const WelcomeEmail = ({
  userEmail,
  userName,
  verificationLink,
}: WelcomeEmailProps) => {
  const greetingName =
    userName && userName !== "" ? userName.split(" ")[0] : "there";

  // --- USE THE HELPER FUNCTION ---
  const creditsToDisplay = getInitialCredits();

  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Insights Crucible! Your AI-powered insights await.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Logo />
          <Text style={paragraph}>Hi {greetingName},</Text>

          {verificationLink ? (
            // --- A. CONTENT FOR EMAIL/PASSWORD SIGN-UP ---
            <>
              <Text style={paragraph}>
                Welcome aboard! To complete your sign-up and secure your
                account, please verify your email address by clicking the button
                below:
              </Text>
              <Section style={btnContainer}>
                <Button style={button} href={verificationLink}>
                  Verify Your Email Address
                </Button>
              </Section>
              <Text style={paragraph}>
                After verifying, you can start transforming your content. You
                have {/* --- USE THE DYNAMIC VALUE HERE --- */}
                <strong>
                  {creditsToDisplay} complimentary analysis credits
                </strong>{" "}
                waiting for you.
              </Text>
            </>
          ) : (
            // --- B. CONTENT FOR SOCIAL SIGN-UP ---
            <>
              <Text style={paragraph}>
                Welcome aboard Insights Crucible! I'm Jimmy, the founder, and
                I'm genuinely excited to have you join our journey.
              </Text>
              <Text style={paragraph}>
                Your account is ready, and you're all set to start transforming
                your content. You have{" "}
                {/* --- USE THE DYNAMIC VALUE HERE --- */}
                <strong>
                  {creditsToDisplay} complimentary analysis credits
                </strong>{" "}
                on your <strong>free plan</strong> to help you get acquainted
                with the power of AI-driven insights.
              </Text>
              <Section style={btnContainer}>
                <Button
                  style={button}
                  href="https://www.insightscrucible.com/engine"
                >
                  Start Your First Analysis
                </Button>
              </Section>
            </>
          )}

          <Text style={paragraph}>
            As an early user, you're part of our foundational community. For the{" "}
            <strong>first 100 users</strong>, we're offering an exclusive{" "}
            <strong style={{ color: "#1d1d1f", fontWeight: "bold" }}>
              Charter Member plan at just $15/month for life!
            </strong>{" "}
            This is a special opportunity to secure full access at our lowest
            rate ever, and your feedback will be invaluable in shaping the
            future of Insights Crucible. You can learn more and upgrade anytime
            from your dashboard.
          </Text>

          <Text style={paragraph}>
            If you have any questions or ideas as you explore, please don't
            hesitate to reply directly to this email. I read every message and
            look forward to connecting with you. You can also follow my
            building-in-public journey on{" "}
            <Link
              style={link}
              href="https://x.com/NguyenNguy20059"
              target="_blank"
              rel="noopener noreferrer"
            >
              X (Twitter)
            </Link>{" "}
            or{" "}
            <Link
              style={link}
              href="https://www.linkedin.com/in/7nguyennguyen3"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </Link>
            .
          </Text>
          <Text style={paragraph}>
            Best,
            <br />
            Jimmy
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you signed up for an account at
            insightscrucible.com.
          </Text>
          <Text style={footer}>
            If you did not sign up for this service, please ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// --- Styles for the email (no changes needed here) ---
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container = { margin: "0 auto", padding: "20px 0 48px" };
const paragraph = { fontSize: "16px", lineHeight: "26px" };
const btnContainer = { textAlign: "center" as const, margin: "30px 0" };
const button = {
  backgroundColor: "#0d6efd",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
const hr = { borderColor: "#cccccc", margin: "20px 0" };
const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
};
const link = { color: "#0d6efd", textDecoration: "underline" };
