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
  <Text style={{ ...paragraph, fontSize: "20px", fontWeight: "bold" }}>
    Insights Crucible
  </Text>
);

interface WelcomeEmailProps {
  userEmail: string;
}

export const WelcomeEmail = ({ userEmail }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Your spot on the Insights Crucible waitlist is confirmed!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Text style={paragraph}>Hi there,</Text>
        <Text style={paragraph}>
          Thank you for joining the waitlist for Insights Crucible! I'm the
          founder, and I'm thrilled to have you on board.
        </Text>
        <Text style={paragraph}>My name is Nguyen, but I go by Jimmy.</Text>
        <Text style={paragraph}>
          You've successfully secured your spot. As an early adopter, you're now
          in line for the exclusive{" "}
          <strong style={{ color: "#1d1d1f", fontWeight: "bold" }}>
            Charter Member Offer ($15/mo for life)
          </strong>{" "}
          once we launch. Your feedback will be essential in shaping the future
          of this tool.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href="https://insightscrucible.com">
            Visit insightscrucible.com
          </Button>
        </Section>
        <Text style={paragraph}>
          In the meantime, I'm building Insights Crucible in public and would
          love to connect. Feel free to follow my journey or ask me anything
          directly on{" "}
          <Link style={link} href="https://twitter.com/[YourTwitterHandle]">
            X (Twitter)
          </Link>{" "}
          or{" "}
          <Link
            style={link}
            href="https://linkedin.com/in/[YourLinkedInProfile]"
          >
            LinkedIn
          </Link>
          . I read every message and look forward to connecting.
        </Text>
        <Text style={paragraph}>
          Best,
          <br />
          Jimmy
        </Text>
        {/* ... rest of the component remains the same ... */}
        <Hr style={hr} />
        <Text style={footer}>
          You're receiving this because you signed up for the waitlist at
          insightscrucible.com
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

// --- Styles for the email (no changes needed here) ---
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container = { margin: "0 auto", padding: "20px 0 48px" };
const paragraph = { fontSize: "16px", lineHeight: "26px" };
const btnContainer = { textAlign: "center" as const };
const button = {
  backgroundColor: "#0d6efd",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};
const hr = { borderColor: "#cccccc", margin: "20px 0" };
const footer = { color: "#8898aa", fontSize: "12px" };
const link = { color: "#0d6efd", textDecoration: "underline" };
