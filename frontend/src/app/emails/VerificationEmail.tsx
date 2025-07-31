// src/emails/VerificationEmail.tsx

import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  userName?: string;
  verificationLink: string;
}

export const VerificationEmail = ({
  userName,
  verificationLink,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={heading}>Verify your email address</Text>
        <Text style={paragraph}>
          Hi {userName || "there"}, thanks for signing up for Insights Crucible!
          Please click the button below to verify your email address and
          complete your registration.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={verificationLink}>
            Verify Email
          </Button>
        </Section>
        <Text style={paragraph}>
          If you didn't create an account, no action is needed.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

// --- Styles ---
const main = { backgroundColor: "#ffffff", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "20px 0 48px" };
const heading = { fontSize: "24px", fontWeight: "bold", margin: "30px 0" };
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
