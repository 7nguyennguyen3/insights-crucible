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

// --- HELPER FUNCTION FOR DYNAMIC CREDITS ---
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
                have{" "}
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
                Welcome aboard Insights Crucible! I'm Nguyen, the founder, and
                I'm genuinely excited to have you join our journey.
              </Text>
              <Text style={paragraph}>
                Your account is ready, and you're all set to start transforming
                your content. You have{" "}
                <strong>
                  {creditsToDisplay} complimentary analysis credits
                </strong>{" "}
                to help you get started and experience the power of AI-driven
                insights.
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
            I started Insights Crucible because I realized that real learning
            happens when we force our brains to actively process and reconstruct
            information - not just consume it. I was drowning in saved articles,
            videos, and notes that I never truly understood because I never took
            the time to extract patterns, test my understanding, or explain
            concepts in my own words. This tool isn't about generating insights
            for you to passively read - it's about creating a dialogue with your
            content, asking better questions, and using AI as a thinking partner
            to challenge your understanding and help you see connections you
            might have missed.
          </Text>

          <Text style={paragraph}>
            <strong>Quick tip to get started:</strong> Try analyzing content
            you've recently consumed but haven't fully processed yet. The AI
            will help you identify key patterns and connections you might have
            missed. I built this tool to solve my own learning challenges, and I
            hope it transforms yours too.
          </Text>

          <Text style={paragraph}>
            Thank you for choosing Insights Crucible - it truly means the world
            to me that you're giving this product a try. As an early user,
            you're part of our foundational community, and I'd love to hear what
            types of content you're analyzing and what insights you're
            discovering. Your feedback will be invaluable in shaping the future
            of this platform.
          </Text>

          <Text style={paragraph}>
            When you need more analysis power, you can easily purchase
            additional credits from your dashboard. But here's something
            important: if you ever find yourself running out of credits and
            aren't able to purchase more, please don't hesitate to reach out to
            me at{" "}
            <Link style={link} href="mailto:jimmy@insightscrucible.com">
              jimmy@insightscrucible.com
            </Link>{" "}
            (or my personal email{" "}
            <Link style={link} href="mailto:7nguyennguyen@gmail.com">
              7nguyennguyen@gmail.com
            </Link>{" "}
            if you prefer). I'd be happy to set you up with additional credits -
            no questions asked. I believe everyone should have access to
            powerful AI tools for learning, regardless of their financial
            situation.
          </Text>

          <Text style={paragraph}>
            If you have any questions, ideas, or just want to share your
            learning journey as you explore, please don't hesitate to reply
            directly to this email. I read every message personally and look
            forward to connecting with you. You can also follow my
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
            Here's to transforming how we learn, together.
          </Text>

          <Text style={paragraph}>
            Best,
            <br />
            Jimmy (Nguyen)
            <br />
            Founder, Insights Crucible
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

// --- Styles for the email ---
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
