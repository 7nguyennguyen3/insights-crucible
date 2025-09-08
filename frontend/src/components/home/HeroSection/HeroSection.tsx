"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { CustomButton } from "@/components/common/CustomButton";
import { PromoNotification } from "./PromoNotification";
import { PodcastThumbnails } from "./PodcastThumbnails";
import { usePromotion } from "@/hooks/usePromotion";
import { ROUTES } from "@/lib/constants";
import {
  backgroundVariants,
  gridPatterns,
  textGradients,
  containerVariants,
  spacingVariants,
  typographyVariants,
} from "@/styles/variants";

export const HeroSection: React.FC = () => {
  const { isPromoActive, credits, promoDeadlineText } = usePromotion();

  return (
    <div
      className={`${backgroundVariants.universal} text-slate-800 dark:text-slate-200 relative overflow-hidden`}
    >
      {/* Background Elements */}
      <div className={`absolute inset-0 ${gridPatterns.subtle}`} />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Hero Section */}
      <section className={`relative ${spacingVariants.heroPadding}`}>
        <div className={containerVariants.section}>
          {isPromoActive && (
            <PromoNotification
              credits={credits}
              promoDeadlineText={promoDeadlineText}
            />
          )}

          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              <h1 className={typographyVariants.heroTitle}>
                <span className={textGradients.warmHero}>
                  Transform Podcasts
                </span>
                <br />
                <span className={textGradients.accent}>Into Learning</span>
                <br />
                <span className={textGradients.warmHero}>Superpowers.</span>
              </h1>

              <p className="mt-8 text-xl md:text-2xl leading-relaxed text-slate-700 dark:text-slate-300 max-w-2xl lg:max-w-none">
                Turn any podcast into structured learning with concept
                breakdowns, interactive quizzes, and memory-boosting techniques.
                <strong className="text-slate-900 dark:text-slate-100">
                  {" "}
                  Master complex topics faster with AI-powered learning.
                </strong>
              </p>

              <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <CustomButton
                  href={ROUTES.AUTH_SIGNUP}
                  variant="primary"
                  className="shadow-2xl"
                >
                  Start Learning Faster
                  <ArrowRight className="w-5 h-5" />
                </CustomButton>

                <div className="flex flex-col items-center">
                  <CustomButton href={ROUTES.DEMO} variant="secondary">
                    Try Interactive Demo
                  </CustomButton>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    No sign-up required
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Podcast Thumbnails Stack */}
            <PodcastThumbnails />
          </div>
        </div>
      </section>
    </div>
  );
};
