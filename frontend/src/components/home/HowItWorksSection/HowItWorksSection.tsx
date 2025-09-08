"use client";

import React from "react";
import AnimatedCrucibleFlow from "@/components/AnimatedCrucibleFlow";
import {
  backgroundVariants,
  gridPatterns,
  textGradients,
  containerVariants,
  spacingVariants,
  typographyVariants,
} from "@/styles/variants";

export const HowItWorksSection: React.FC = () => (
  <section
    className={`relative ${spacingVariants.sectionPadding} ${backgroundVariants.universal}`}
  >
    <div className={`absolute inset-0 ${gridPatterns.medium}`} />
    <div className={`${containerVariants.section} relative`}>
      <div className={containerVariants.maxWidth}>
        <div className={`${containerVariants.centered} relative`}>
          <h2
            className={`${typographyVariants.sectionTitle} text-slate-900 dark:text-slate-100`}
          >
            A Simple, Powerful
            <span className={`block ${textGradients.accent}`}>
              Learning Process
            </span>
          </h2>
          <p className="mt-6 text-xl text-slate-800 dark:text-slate-200 leading-relaxed">
            Turn 3-hour podcast episodes into 5-minute learning sessions. Save
            20+ hours every week.
          </p>
        </div>

        <AnimatedCrucibleFlow />
      </div>
    </div>
  </section>
);
