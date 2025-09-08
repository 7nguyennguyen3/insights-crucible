"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { CustomButton } from "@/components/common/CustomButton";
import { usePromotion } from "@/hooks/usePromotion";
import { ROUTES } from "@/lib/constants";
import { backgroundVariants, gridPatterns, textGradients, containerVariants, spacingVariants, typographyVariants } from "@/styles/variants";

export const CTASection: React.FC = () => {
  const { credits } = usePromotion();

  return (
    <section className={`relative overflow-hidden ${spacingVariants.sectionPadding} ${backgroundVariants.universal}`}>
      {/* Enhanced background effects */}
      <div className={`absolute inset-0 ${gridPatterns.fine}`} />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-gradient-radial from-slate-200/8 via-slate-300/4 to-transparent rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className={`${containerVariants.section} text-center relative`}>
        <div className={containerVariants.maxWidth}>
          <h2 className={`${typographyVariants.ctaTitle} mb-8`}>
            <span className="text-slate-900 dark:text-slate-100">
              Ready to Learn 10x
            </span>
            <br />
            <span className={textGradients.accent}>
              Faster from Podcasts?
            </span>
          </h2>
          <p className="mt-6 text-xl text-slate-800 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed mb-12">
            Stop taking scattered notes. Start structured learning. Get{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              30 free credits
            </strong>{" "}
            when you sign up - no card required.
          </p>
          <CustomButton
            href={ROUTES.AUTH_SIGNUP}
            variant="primary"
            className="shadow-2xl hover:shadow-blue-500/30"
          >
            Start Learning for Free
            <ArrowRight className="w-6 h-6" />
          </CustomButton>
        </div>
      </div>
    </section>
  );
};