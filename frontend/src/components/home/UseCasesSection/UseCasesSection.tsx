"use client";

import React from "react";
import {
  GraduationCap,
  Brain,
} from "lucide-react";
import { backgroundVariants, textGradients, containerVariants, spacingVariants, typographyVariants } from "@/styles/variants";

const USE_CASES = [
  {
    icon: GraduationCap,
    category: "STUDENTS & LEARNERS",
    title: "Interactive Learning",
    subtitle: "Turn podcasts into structured study materials.",
    features: ["Concept breakdowns", "Interactive quizzes", "Timestamped references"],
  },
  {
    icon: Brain,
    category: "RESEARCHERS & PROFESSIONALS",
    title: "Deep Analysis", 
    subtitle: "Extract insights for academic and professional work.",
    features: ["Structured summaries", "Key insights", "Citations with timestamps"],
  },
];

const UseCaseCard: React.FC<{
  icon: React.ComponentType<any>;
  category: string;
  title: string;
  subtitle: string;
  features: string[];
}> = ({ icon: Icon, category, title, subtitle, features }) => (
  <div className="group relative h-full">
    <div className="absolute inset-0 bg-gradient-to-br from-stone-200/20 to-stone-300/20 rounded-2xl blur-lg transition-all duration-300 group-hover:from-stone-200/30 group-hover:to-stone-300/30" />
    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-stone-200/40 dark:border-stone-700/40 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1 h-full flex flex-col">
      
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-coral-500 via-orange-500 to-red-500 rounded-2xl shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 tracking-wider">
          {category}
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
        {subtitle}
      </p>
      
      <div className="space-y-2 flex-grow">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-1 h-1 bg-slate-400 rounded-full flex-shrink-0" />
            <span className="text-sm text-slate-800 dark:text-slate-200">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const UseCasesSection: React.FC = () => (
  <section className={`relative ${spacingVariants.sectionPadding} ${backgroundVariants.universal} overflow-hidden`}>
    {/* Clean geometric accent shapes */}
    <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-slate-200/20 to-slate-300/20 rounded-full blur-xl" />
    <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-br from-slate-100/10 to-slate-200/10 rounded-full blur-2xl" />

    <div className={`${containerVariants.section} relative`}>
      <div className={containerVariants.maxWidth}>
        <div className="max-w-4xl mb-20 mx-auto text-center relative">
          <h2 className={`${typographyVariants.sectionTitle} text-slate-900 dark:text-slate-100 mb-6`}>
            Supercharge Your Learning
            <span className={`block ${textGradients.accent}`}>
              From Any Podcast
            </span>
          </h2>

          <p className="text-xl text-slate-800 dark:text-slate-200 leading-relaxed max-w-3xl mx-auto">
            Transform hours of podcast content into personalized learning experiences.
            Whether you're a student, creator, or researcher - learn faster and deeper than ever before.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto items-stretch">
          {USE_CASES.map((useCase, index) => (
            <UseCaseCard
              key={useCase.title}
              icon={useCase.icon}
              category={useCase.category}
              title={useCase.title}
              subtitle={useCase.subtitle}
              features={useCase.features}
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);