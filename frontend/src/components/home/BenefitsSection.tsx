"use client";

import React from "react";
import { BookOpen, TrendingUp, Clock, Brain, Target } from "lucide-react";
import {
  backgroundVariants,
  containerVariants,
  spacingVariants,
  typographyVariants,
} from "@/styles/variants";

const BENEFITS = [
  {
    icon: BookOpen,
    title: "Master Any Topic",
    description:
      "Turn any podcast into structured learning materials with breakdowns and quizzes.",
  },
  {
    icon: Clock,
    title: "Learn 10x Faster",
    description:
      "Master 3-hour episodes in just 5 minutes with AI-powered concept extraction.",
  },
  {
    icon: Brain,
    title: "Better Retention",
    description:
      "Interactive quizzes and spaced repetition help you remember what you learn.",
  },
  {
    icon: TrendingUp,
    title: "Stay Ahead of Trends",
    description:
      "Quickly digest the latest insights from industry leaders and thought experts.",
  },
  {
    icon: Target,
    title: "Stay Focused",
    description:
      "Skip the fluff and get straight to the key concepts and actionable insights.",
  },
];

const BenefitCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center text-center group">
    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl shadow-lg mb-4 group-hover:scale-105 transition-transform duration-200">
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
      {title}
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
      {description}
    </p>
  </div>
);

export const BenefitsSection: React.FC = () => (
  <section
    className={`relative ${spacingVariants.sectionPadding} ${backgroundVariants.secondary}`}
  >
    <div className={`${containerVariants.section} relative`}>
      <div className={containerVariants.maxWidth}>
        <div className="text-center mb-12">
          <h2
            className={`${typographyVariants.sectionTitle} text-slate-900 dark:text-slate-100 mb-4`}
          >
            Why Learners Choose Us
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Transform any podcast into actionable insights with AI-powered
            analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {BENEFITS.map((benefit, index) => (
            <BenefitCard
              key={benefit.title}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);
