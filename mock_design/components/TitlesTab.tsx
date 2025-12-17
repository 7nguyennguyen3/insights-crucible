import React from "react";
import { Sparkles, Copy } from "lucide-react";
import { CopyButton } from "./CopyButton";

interface TitlesTabProps {
  data: {
    curiosity_gap: string;
    benefit_driven: string;
    contrarian: string;
    direct: string;
  };
}

export const TitlesTab: React.FC<TitlesTabProps> = ({ data }) => {
  const variations = [
    { type: "Curiosity Gap", value: data.curiosity_gap, tag: "Viral" },
    { type: "Benefit Driven", value: data.benefit_driven, tag: "Educational" },
    { type: "Contrarian", value: data.contrarian, tag: "Disruptive" },
    { type: "Direct", value: data.direct, tag: "SEO" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
          Title Variations
        </h2>
        <p className="text-zinc-500 mt-1">
          AI-generated angles optimized for different audience segments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variations.map((item, index) => (
          <div
            key={index}
            className="group bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm hover:shadow-lg hover:shadow-zinc-900/5 hover:border-zinc-200 transition-all duration-300 relative flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-500 text-xs font-medium uppercase tracking-wider border border-zinc-100">
                {item.type}
              </span>
              <CopyButton text={item.value} />
            </div>

            <p className="text-lg font-medium text-zinc-800 leading-snug group-hover:text-zinc-900">
              {item.value}
            </p>

            <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-xs text-zinc-400">
                Best for: {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
