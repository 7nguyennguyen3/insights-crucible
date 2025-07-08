// /emails/FeatureRequestNotificationEmail.tsx

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";

// You can reuse the styles from your WelcomeEmail for consistency
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container = { margin: "0 auto", padding: "20px 0 48px" };
const paragraph = { fontSize: "16px", lineHeight: "26px" };
const hr = { borderColor: "#cccccc", margin: "20px 0" };
const footer = { color: "#8898aa", fontSize: "12px" };

interface FeatureRequestEmailProps {
  submittedBy: string;
  title: string;
  description: string;
  priority: string;
  requestId: string;
}

export const FeatureRequestNotificationEmail = ({
  submittedBy,
  title,
  description,
  priority,
  requestId,
}: FeatureRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>New Feature Request: {title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={{ ...paragraph, fontSize: "20px", fontWeight: "bold" }}>
          New Feature Request!
        </Text>
        <Text style={paragraph}>A new feature request has been submitted.</Text>
        <Hr style={hr} />
        <Section>
          <Text style={paragraph}>
            <strong>Submitted By:</strong> {submittedBy}
          </Text>
          <Text style={paragraph}>
            <strong>Priority:</strong> {priority}
          </Text>
          <Text style={paragraph}>
            <strong>Title:</strong> {title}
          </Text>
          <Text style={paragraph}>
            <strong>Description:</strong>
            <br />
            {description}
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Request ID: {requestId}</Text>
      </Container>
    </Body>
  </Html>
);

export default FeatureRequestNotificationEmail;
