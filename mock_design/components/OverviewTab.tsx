import React from "react";
import { CopyButton } from "./CopyButton";
import { AnalysisData } from "../types";

interface OverviewTabProps {
  data: AnalysisData["main_document"]["data"];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left Column: Main Content */}
      <div className="lg:col-span-8 space-y-12">
        {/* Description */}
        <section>
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">
              Executive Summary
            </h3>
            <CopyButton text={data.show_notes.episode_description} />
          </div>
          <div className="prose prose-zinc max-w-none">
            <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap text-[15px]">
              {data.show_notes.episode_description}
            </p>
          </div>
        </section>

        {/* Key Points */}
        <section>
          <h3 className="text-lg font-semibold text-zinc-900 tracking-tight mb-6">
            Key Insights
          </h3>
          <div className="grid gap-4">
            {data.show_notes.key_points.map((point, index) => (
              <div
                key={index}
                className="flex gap-4 p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-zinc-700 leading-relaxed pt-1">{point}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Chapters */}
      <div className="lg:col-span-4 space-y-8">
        <section>
          <h3 className="text-lg font-semibold text-zinc-900 tracking-tight mb-6">
            Timeline
          </h3>
          <div className="relative border-l border-zinc-200 ml-3 space-y-8 py-2">
            {data.show_notes.chapters.map((chapter, index) => (
              <div key={index} className="relative pl-8 group">
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-300 group-hover:bg-zinc-900 transition-colors ring-4 ring-[#fafafa]"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-400 font-mono mb-1">
                    {chapter.timestamp}
                  </span>
                  <h4 className="font-medium text-zinc-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {chapter.title}
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4">
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
