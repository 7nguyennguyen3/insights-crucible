"use client";

import React from "react";
import { CopyButton } from "./CopyButton";
import { ShowNotes } from "@/types/analysis";

interface OverviewTabProps {
  showNotes: ShowNotes;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ showNotes }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left Column: Main Content */}
      <div className="lg:col-span-8 space-y-12">
        {/* Description */}
        <section>
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Executive Summary
            </h3>
            <CopyButton text={showNotes.episode_description} />
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap text-[15px]">
              {showNotes.episode_description}
            </p>
          </div>
        </section>

        {/* Key Points */}
        <section>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-6">
            Key Insights
          </h3>
          <div className="grid gap-4">
            {showNotes.key_points.map((point, index) => (
              <div
                key={index}
                className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1">{point}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Chapters */}
      <div className="lg:col-span-4 space-y-8">
        <section>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-6">
            Timeline
          </h3>
          <div className="relative border-l border-zinc-200 dark:border-zinc-700 ml-3 space-y-8 py-2">
            {showNotes.chapters.map((chapter, index) => (
              <div key={index} className="relative pl-8 group">
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-200 transition-colors ring-4 ring-white dark:ring-zinc-950"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 font-mono mb-1">
                    {chapter.timestamp}
                  </span>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {chapter.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-4">
                    {chapter.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
