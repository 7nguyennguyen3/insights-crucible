// src/emails/CharterWelcomeEmail.tsx

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
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

// Add 'creditsAdded' to the props interface
interface CharterWelcomeEmailProps {
  userName?: string;
  baseCredits: number; // e.g., 25
  bonusCredits: number; // e.g., 5
}

export const CharterWelcomeEmail = ({
  userName,
  baseCredits,
  bonusCredits,
}: CharterWelcomeEmailProps) => {
  const greetingName = userName ? userName.split(" ")[0] : "Charter Member";

  return (
    <Html>
      <Head />
      <Preview>Thank you for becoming a Charter Member!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Logo />
          <Text style={paragraph}>Hi {greetingName},</Text>
          <Text style={paragraph}>
            Thank you for becoming a <strong>Charter Member</strong> of Insights
            Crucible! I'm Jimmy, the founder, and your support at this early
            stage means the world.
          </Text>

          {/* ✨ MODIFICATION: Updated text to clearly state the monthly credits and the bonus. */}
          <Text style={paragraph}>
            Your account has been upgraded with your{" "}
            <strong>{baseCredits} monthly analysis credits</strong>. As a
            special token of my appreciation, I've also added a{" "}
            <strong>bonus of {bonusCredits} extra credits</strong> to your
            account.
          </Text>
          <Section style={btnContainer}>
            <Button
              style={button}
              href="https://www.insightscrucible.com/account"
            >
              Go to Your Account
            </Button>
          </Section>
          <Text style={paragraph}>
            As a Charter Member, your feedback is crucial. If you have any ideas
            or questions, please reply directly to this email. I read every
            single one.
          </Text>
          <Text style={paragraph}>
            Welcome aboard,
            <br />
            Jimmy
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you subscribed to the Charter Member
            plan at insightscrucible.com.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CharterWelcomeEmail;

// --- Styles (no changes needed here) ---
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
