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
import React from "react";

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
  <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-full">
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
  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* --- HERO SECTION: Sharpened Value Proposition --- */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          {/* MODIFIED: More active, benefit-driven headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto">
            Go from Raw Content to Strategic Insight in Minutes
          </h1>
          {/* MODIFIED: Sharpened sub-headline focusing on pain and outcome */}
          <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Insights Crucible deconstructs your interviews, documents, and audio
            into actionable themes, arguments, and key takeaways. Stop sifting,
            start strategizing.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/auth?tab=signup" variant="primary">
              Get 5 Free Analysis Credits
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button href="/pricing" variant="secondary">
              View Plans
            </Button>
          </div>
        </div>
      </section>

      {/* --- Visual Section with Video (Unchanged) --- */}
      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          {/* <div className="relative max-w-5xl mx-auto bg-slate-200 dark:bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700 p-2 pt-7">
            <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <iframe
                src="https://player.vimeo.com/video/1096042314?h=474f12371d&title=0&byline=0&portrait=0&autoplay=1&loop=1&muted=1&controls=0"
                width="100%"
                height="100%"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </div> */}
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION: Simplified Language --- */}
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
            {/* MODIFIED: More user-friendly descriptions */}
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

      {/* --- FEATURES SECTION: Refocused on Core Value & New Feature --- */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Go Beyond Simple Summaries
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Our core Insight Engine doesn't just shorten your text—it gives
              you a structured, multi-faceted understanding of it.
            </p>
          </div>
          {/* MODIFIED: Changed grid to be more responsive and added a 4th feature */}
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
            {/* MODIFIED: Renamed for clarity */}
            <FeatureCard
              icon={MessageSquareQuote}
              title="Key Takeaways & Quotes"
              description="Instantly extract notable quotes, key questions, and actionable advice directly from the source material."
            />
            {/* NEW: Added a dedicated card for the content creation feature */}
            <FeatureCard
              icon={Copy}
              title="One-Click Content Creation"
              description="Instantly repurpose any analysis into a polished blog post or a compelling Twitter (X) thread to share your insights."
            />
          </div>
        </div>
      </section>

      {/* NEW: Added Social Proof / Testimonials Section */}
      {/* <section className="py-20 md:py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Trusted by Top Analysts & Consultants
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Professionals rely on Insights Crucible to save time and deliver
              deeper, higher-quality work.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <blockquote className="text-slate-600 dark:text-slate-300 italic">
                "This tool saved me at least 10 hours on my last project. The
                argument deconstruction is a legitimate game-changer that I
                haven't seen anywhere else."
              </blockquote>
              <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                — Alex Carter, Senior Strategy Consultant
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <blockquote className="text-slate-600 dark:text-slate-300 italic">
                "I can now process a week's worth of user interviews in a single
                afternoon. Insights Crucible helps me find the 'so what' faster
                than any other tool I've tried."
              </blockquote>
              <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                — Maria Rodriguez, Lead UX Researcher
              </p>
            </div>
          </div>
        </div>
      </section> */}

      {/* --- PRICING TEASER (Unchanged) --- */}
      <section className="py-20 md:py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-slate-100 dark:bg-slate-800/50 p-10 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Try the Full Power of the Engine, On Us.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Sign up in seconds and get{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                5 full analysis credits for free
              </span>{" "}
              to experience the depth and quality of our insights firsthand. No
              credit card required.
            </p>
            <div className="mt-8">
              <Button href="/pricing" variant="secondary">
                See All Plans & Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA (Unchanged) --- */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Ready to Unlock Your Content's Potential?
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Sign up now and get your first 5 analysis credits for free.
          </p>
          <div className="mt-8">
            <Button href="/auth?tab=signup" variant="primary">
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
