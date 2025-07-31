// /app/page.tsx

"use client";

import {
  ArrowRight,
  BarChart,
  BrainCircuit,
  Copy,
  FileText,
  MessageSquareQuote,
  UploadCloud,
  Zap,
} from "lucide-react";
import React, { useState, useEffect } from "react";

// --- Components (Button, FeatureCard, HowItWorksStep) are unchanged ---

const Button = ({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}) => {
  const baseClasses =
    "inline-flex items-center justify-center px-6 py-3 font-semibold rounded-md shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "text-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:ring-slate-500",
  };
  return (
    <a
      href={href}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </a>
  );
};

const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-full transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl">
    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg mb-4">
      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
      {title}
    </h3>
    <p className="text-slate-600 dark:text-slate-400">{description}</p>
  </div>
);

const HowItWorksStep = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center text-center">
    <div className="flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-slate-200 dark:border-slate-700 mb-4">
      <Icon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
      {title}
    </h3>
    <p className="text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

const MarketingHomePage = () => {
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [credits, setCredits] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_CREDITS || "5"
  );
  const [promoDeadlineText, setPromoDeadlineText] = useState("");

  useEffect(() => {
    const promoEndDateString = process.env.NEXT_PUBLIC_PROMO_END_DATE;
    if (!promoEndDateString || !promoEndDateString.includes("/")) return;

    const [month, day] = promoEndDateString.split("/");
    const currentYear = new Date().getFullYear();
    const promoEndDate = new Date(`${currentYear}-${month}-${day}T00:00:00Z`);
    const now = new Date();

    if (now < promoEndDate) {
      setIsPromoActive(true);
      setCredits(process.env.NEXT_PUBLIC_PROMO_CREDITS || "10");

      const dayOfMonth = promoEndDate.getUTCDate();
      const getOrdinalSuffix = (d: number) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };

      // ⬇️ FIXED: Added timeZone: 'UTC' to prevent misinterpretation
      const formattedMonth = new Intl.DateTimeFormat("en-US", {
        month: "long",
        timeZone: "UTC",
      }).format(promoEndDate);
      setPromoDeadlineText(
        `${formattedMonth} ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`
      );
    }
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          {isPromoActive && (
            <div className="mb-8 p-4 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg max-w-2xl mx-auto">
              <p className="font-semibold text-blue-800 dark:text-blue-200">
                ✨ Special Offer: Sign up before {promoDeadlineText} and get{" "}
                {credits} free analyses!
              </p>
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto">
            Go from Raw Content to Strategic Insight in Minutes
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Insights Crucible deconstructs your interviews, documents, and audio
            into actionable themes, arguments, and key takeaways. Stop sifting,
            start strategizing.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/auth?tab=signup" variant="primary">
              Get {credits} Free Analysis Credits
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button href="/pricing" variant="secondary">
              View Plans
            </Button>
          </div>
        </div>
      </section>
      {/* --- Other sections remain unchanged --- */}
      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4"></div>
      </section>
      <section className="py-20 md:py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              A Simple, Powerful Workflow
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Get from raw data to deep insight in three easy steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <HowItWorksStep
              icon={UploadCloud}
              title="1. Upload Anything"
              description="Securely upload an audio/video file or paste any text-based content."
            />
            <HowItWorksStep
              icon={Zap}
              title="2. Initiate Deep Analysis"
              description="With a single click, our AI deconstructs your content, identifying themes, arguments, and more."
            />
            <HowItWorksStep
              icon={BarChart}
              title="3. Get Your Structured Report"
              description="Receive a comprehensive, interactive report in your dashboard, ready to export and use in your work."
            />
          </div>
        </div>
      </section>
      <section className="relative py-20 md:py-24">
        {/* Subtle background dot pattern */}
        <div
          className="absolute inset-0 bg-repeat bg-center"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsla(0, 0%, 71%, 0.15) 1px, transparent 0)",
            backgroundSize: "1.5rem 1.5rem",
          }}
          aria-hidden="true"
        ></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Go Beyond Simple Summaries
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Our core Insight Engine doesn't just shorten your text—it gives
              you a structured, multi-faceted understanding of it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <FeatureCard
              icon={BrainCircuit}
              title="Thematic Analysis"
              description="Automatically identify the key themes, topics, and concepts discussed, with concise summaries for each one."
            />
            <FeatureCard
              icon={FileText}
              title="Argument Deconstruction"
              description="Unpack the core thesis, supporting arguments, and even counter-arguments mentioned within the text."
            />
            <FeatureCard
              icon={MessageSquareQuote}
              title="Key Takeaways & Quotes"
              description="Instantly extract notable quotes, key questions, and actionable advice directly from the source material."
            />
            <FeatureCard
              icon={Copy}
              title="One-Click Content Creation"
              description="Instantly repurpose any analysis into a polished blog post or a compelling Twitter (X) thread to share your insights."
            />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 p-10 md:p-16 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Zap
              className="absolute -right-10 -bottom-10 h-48 w-48 text-blue-500/10"
              aria-hidden="true"
            />
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Try the Full Power of the Engine, On Us.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Experience our Insight Engine with no limitations. Your free
              account comes with{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {credits} full analysis credits
              </span>{" "}
              to use on any content you want. No credit card required.
            </p>
            <div className="mt-8">
              <Button href="/pricing" variant="secondary">
                See All Plans & Features
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="relative overflow-hidden py-20 md:py-24">
        {/* Background Aurora Effect */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-3xl -z-10"
          aria-hidden="true"
        ></div>

        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
            Ready to Unlock Your Content's Potential?
          </h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Stop sifting through raw data. Start discovering actionable
            insights. Your first {credits} analyses are on us.
          </p>
          <div className="mt-8">
            <Button
              href="/auth?tab=signup"
              variant="primary"
              className="shadow-lg hover:shadow-blue-500/20"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketingHomePage;
