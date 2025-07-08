"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clapperboard } from "lucide-react";
import { SuggestedClip } from "@/app/_global/interface";

interface SuggestedClipsDisplayProps {
  clips: SuggestedClip[];
}

export const SuggestedClipsDisplay: React.FC<SuggestedClipsDisplayProps> = ({
  clips,
}) => {
  if (!clips || clips.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
      <h4 className="flex items-center text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">
        <Clapperboard className="w-5 h-5 mr-3 text-purple-500" />
        Clip Suggestions
      </h4>
      <div className="space-y-4">
        {clips.map((clip, index) => (
          <div
            key={index}
            className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/50"
          >
            <p className="italic text-slate-800 dark:text-slate-200">
              "{clip.quote}"
            </p>
            <Badge variant="secondary" className="mt-2 font-mono">
              {clip.start} - {clip.end}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};
