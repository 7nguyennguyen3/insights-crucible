"use client";

import React from "react";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { CustomButton } from "@/components/common/CustomButton";
import { usePromotion } from "@/hooks/usePromotion";
import { ROUTES } from "@/lib/constants";
import { backgroundVariants, textGradients, containerVariants, spacingVariants } from "@/styles/variants";

export const TestimonialSection: React.FC = () => {
  const { credits } = usePromotion();

  return (
    <section className={`${spacingVariants.sectionPadding} ${backgroundVariants.secondaryGradient}`}>
      <div className={containerVariants.section}>
        <div className={containerVariants.maxWidth}>
          <div className="relative overflow-hidden max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 rounded-3xl" />
            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-12 md:p-20 rounded-3xl border border-teal-200/30 dark:border-teal-700/30 shadow-2xl shadow-teal-500/10">
              {/* Floating elements */}
              <div className="absolute top-8 right-8 p-4 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl shadow-lg rotate-12">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-8 left-8 p-3 bg-white dark:bg-slate-700 rounded-xl shadow-lg -rotate-6 border border-slate-200 dark:border-slate-600">
                <Target className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>

              <div className="text-center relative">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-6">
                  Try the Full Learning Experience,
                  <span className={`block ${textGradients.secondary}`}>
                    On Us.
                  </span>
                </h2>
                <p className="text-xl text-slate-800 dark:text-slate-200 leading-relaxed max-w-3xl mx-auto mb-10">
                  Experience our learning platform with no limitations. Your
                  free account comes with{" "}
                  <span className={`font-bold ${textGradients.secondary}`}>
                    {credits} full podcast analyses
                  </span>{" "}
                  to help you learn faster. No credit card required.
                </p>
                <CustomButton
                  href={ROUTES.PRICING}
                  variant="accent"
                  className="shadow-2xl"
                >
                  See All Learning Plans
                  <ArrowRight className="w-5 h-5" />
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};