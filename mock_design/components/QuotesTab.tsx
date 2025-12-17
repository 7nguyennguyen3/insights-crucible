import React from "react";
import { Quote } from "lucide-react";
import { CopyButton } from "./CopyButton";

interface QuotesTabProps {
  quotes: Array<{
    quote: string;
    context: string;
    timestamp: string;
  }>;
}

export const QuotesTab: React.FC<QuotesTabProps> = ({ quotes }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
          Notable Quotes
        </h2>
        <p className="text-zinc-500 mt-1">
          Impactful moments ready for repurposing.
        </p>
      </div>

      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {quotes.map((item, index) => (
          <div
            key={index}
            className="break-inside-avoid bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 hover:shadow-lg hover:shadow-zinc-900/5 transition-all duration-300"
          >
            <Quote size={24} className="text-zinc-200 mb-4 fill-zinc-100" />

            <blockquote className="font-serif text-xl md:text-2xl text-zinc-800 leading-relaxed mb-6">
              "{item.quote}"
            </blockquote>

            <div className="flex items-end justify-between pt-6 border-t border-zinc-50">
              <div>
                <p className="text-sm font-medium text-zinc-900 mb-1">
                  Context
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
                  {item.context}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded">
                  {item.timestamp || "00:00"}
                </span>
                <CopyButton text={item.quote} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
