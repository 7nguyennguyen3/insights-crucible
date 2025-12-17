"use client";

import React from "react";
import { CopyButton } from "./CopyButton";
import { TitleVariations } from "@/types/analysis";

interface TitlesTabProps {
  titleVariations: TitleVariations;
}

export const TitlesTab: React.FC<TitlesTabProps> = ({ titleVariations }) => {
  const variations = [
    { type: "Curiosity Gap", value: titleVariations.curiosity_gap, tag: "Viral" },
    { type: "Benefit Driven", value: titleVariations.benefit_driven, tag: "Educational" },
    { type: "Contrarian", value: titleVariations.contrarian, tag: "Disruptive" },
    { type: "Direct", value: titleVariations.direct, tag: "SEO" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Title Variations
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          AI-generated angles optimized for different audience segments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variations.map((item, index) => (
          <div
            key={index}
            className="group bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:shadow-zinc-900/5 dark:hover:shadow-zinc-950/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-300 relative flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider border border-zinc-100 dark:border-zinc-700">
                {item.type}
              </span>
              <CopyButton text={item.value} />
            </div>

            <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200 leading-snug group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
              {item.value}
            </p>

            <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Best for: {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
