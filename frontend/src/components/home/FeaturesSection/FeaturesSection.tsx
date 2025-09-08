"use client";

import React from "react";
import {
  BrainCircuit,
  MessageSquareQuote,
  Target,
  FileText,
} from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { FEATURE_DATA } from "@/lib/constants";
import { backgroundVariants, textGradients, containerVariants, spacingVariants } from "@/styles/variants";

const FEATURE_ICONS = [BrainCircuit, MessageSquareQuote, Target, FileText];

export const FeaturesSection: React.FC = () => (
  <section className={`relative ${spacingVariants.sectionPadding} overflow-hidden`}>
    {/* Enhanced background elements */}
    <div className={`absolute inset-0 ${backgroundVariants.featureGradient}`} />

    {/* Animated gradient orbs */}
    <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse" />
    <div
      className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse"
      style={{ animationDelay: "2s" }}
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "1s" }}
    />

    {/* Floating geometric shapes */}
    <div
      className="absolute top-32 left-20 w-4 h-4 bg-teal-400/40 rounded-full animate-bounce"
      style={{ animationDuration: "4s", animationDelay: "0s" }}
    />
    <div
      className="absolute top-48 right-32 w-3 h-3 bg-blue-400/40 rounded-square animate-bounce"
      style={{ animationDuration: "5s", animationDelay: "1s" }}
    />
    <div
      className="absolute bottom-32 left-1/3 w-5 h-5 bg-cyan-400/40 rounded-full animate-bounce"
      style={{ animationDuration: "6s", animationDelay: "2s" }}
    />
    <div
      className="absolute bottom-48 right-20 w-2 h-2 bg-teal-500/50 rounded-full animate-bounce"
      style={{ animationDuration: "3s", animationDelay: "0.5s" }}
    />

    {/* Subtle grid pattern */}
    <div
      className="absolute inset-0 bg-repeat bg-center opacity-20 dark:opacity-10"
      style={{
        backgroundImage:
          "radial-gradient(circle at 2px 2px, hsla(180, 100%, 50%, 0.15) 1px, transparent 0)",
        backgroundSize: "2rem 2rem",
      }}
      aria-hidden="true"
    />

    {/* Animated lines */}
    <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent animate-pulse" />
    <div
      className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"
      style={{ animationDelay: "1s" }}
    />

    <div className={`${containerVariants.section} relative`}>
      <div className={containerVariants.maxWidth}>
        <div className="max-w-4xl mb-20 mx-auto text-center relative">
          {/* Decorative elements around title */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-full blur-2xl animate-pulse" />
          <div
            className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute -top-2 -left-6 w-6 h-6 bg-gradient-to-br from-pink-400/30 to-rose-400/30 rounded-full animate-bounce"
            style={{ animationDelay: "1s" }}
          />

          <h2 className="relative text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-6">
            <span className="relative">
              Transform How You
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/5 to-transparent rounded-lg -z-10" />
            </span>
            <span className={`block ${textGradients.accent} relative`}>
              Learn from Podcasts
              {/* Subtle underline effect */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-teal-500/30 to-blue-500/30 rounded-full" />
            </span>
          </h2>

          <div className="text-xl text-slate-800 dark:text-slate-200 leading-relaxed relative">
            Stop wasting hours rewinding and re-listening. Get structured
            insights that help you master complex topics faster than ever
            before.
            {/* Subtle highlight box */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-50/30 to-transparent dark:via-teal-900/10 rounded-lg -z-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURE_DATA.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={FEATURE_ICONS[index]}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);