import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import Navbar from "./components/Navbar";
import { Providers } from "./components/Providers";
import "./globals.css";
import Footer from "./components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default:
      "Insights Crucible - AI-Powered Content Analysis for Actionable Insights",
    template: "%s | Insights Crucible",
  },
  description:
    "Transform your audio, video, and text content into actionable intelligence with Insights Crucible's advanced AI analysis tools. Unlock deeper understanding and drive smarter decisions.",
  keywords: [
    "AI analysis",
    "content analysis",
    "audio transcription",
    "video analysis",
    "text analysis",
    "business insights",
    "actionable intelligence",
    "SaaS",
    "AI tools",
    "insights platform",
    "transcription service",
  ],
  authors: [{ name: "Embercore LLC" }],
  creator: "Embercore LLC",
  publisher: "Embercore LLC", // Your company's legal name
  metadataBase: new URL("https://www.insightscrucible.com"), // Replace with your actual domain

  // Open Graph (for social media sharing)
  openGraph: {
    title: "Insights Crucible - AI-Powered Content Analysis",
    description:
      "Transform your audio, video, and text content into actionable intelligence with Insights Crucible.",
    url: "https://www.insightscrucible.com", // Replace with your actual domain
    siteName: "Insights Crucible",
    images: [
      {
        url: "https://www.insightscrucible.com/logo-icon.svg", // Replace with an actual Open Graph image URL
        width: 1200,
        height: 630,
        alt: "Insights Crucible - AI-Powered Content Analysis",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter Card (for Twitter sharing)
  twitter: {
    card: "summary_large_image",
    site: "@ICrucibleHQ", // Your X/Twitter handle (e.g., @ICrucibleHQ)
    creator: "@ICrucibleHQ", // Your X/Twitter handle
    title: "Insights Crucible - AI for Smarter Decisions",
    description:
      "Unlock actionable insights from your content with Insights Crucible's AI tools.",
    images: ["https://www.insightscrucible.com/logo-icon.svg"], // Replace with an actual Twitter image URL
  },

  // Favicons/Icons (adjust paths as needed)
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  // Canonical URL (good for SEO, helps search engines know the primary version of a page)
  alternates: {
    canonical: "https://www.insightscrucible.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
      >
        <SpeedInsights />
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
