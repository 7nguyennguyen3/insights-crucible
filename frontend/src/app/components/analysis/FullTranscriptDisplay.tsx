"use client";

import React from "react";
import { secondsToHHMMSS } from "@/app/utils/convertTime";
import { Utterance } from "@/app/_global/interface";

interface FullTranscriptDisplayProps {
  transcript: Utterance[];
}

export const FullTranscriptDisplay: React.FC<FullTranscriptDisplayProps> = ({
  transcript,
}) => {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 py-8">
        No transcript data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {transcript.map((utterance, index) => {
        return (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 flex flex-col gap-2">
              {/* Speaker badge - only show if speaker is available (upload sources) */}
              {utterance.speaker && (
                <div className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${utterance.speaker === 'A'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : utterance.speaker === 'B'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  }
                `}>
                  Speaker {utterance.speaker}
                </div>
              )}
              {/* Timestamp */}
              <p className="font-mono text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {secondsToHHMMSS(utterance.start)}
              </p>
            </div>

            <div className="flex-grow">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {utterance.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
