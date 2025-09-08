"use client";

import React from "react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <div className="group relative bg-gradient-to-br from-white/60 via-white/40 to-slate-50/60 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 h-full transition-all duration-700 hover:bg-gradient-to-br hover:from-white/90 hover:via-white/70 hover:to-slate-50/90 dark:hover:from-slate-800/90 dark:hover:via-slate-800/70 dark:hover:to-slate-900/90 hover:shadow-2xl hover:shadow-teal-500/20 hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:-translate-y-2 hover:scale-105 overflow-hidden">
    {/* Animated background gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

    {/* Floating decorative elements */}
    <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

    {/* Animated border shimmer */}
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="relative z-10">
      {/* Enhanced icon container */}
      <div className="relative mb-8">
        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-100 via-blue-100 to-cyan-100 dark:from-teal-900/60 dark:via-blue-900/60 dark:to-cyan-900/60 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:shadow-teal-500/30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="w-10 h-10 text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-300" />

          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-2xl border-2 border-teal-500/30 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700" />
        </div>

        {/* Floating sparkle effects */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
        <div
          className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"
          style={{ animationDelay: "0.3s" }}
        />
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-300 leading-tight">
        {title}
      </h3>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors duration-300">
        {description}
      </p>

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>

    {/* Corner accent decorations */}
    <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-teal-500/20 to-transparent rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-blue-500/20 to-transparent rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
  </div>
);