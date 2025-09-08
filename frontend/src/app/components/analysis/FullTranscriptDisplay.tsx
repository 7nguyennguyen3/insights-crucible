"use client";

import React from "react";
import { secondsToHHMMSS } from "@/app/utils/convertTime";
import { Utterance } from "@/app/_global/interface";

interface FullTranscriptDisplayProps {
  transcript: Utterance[];
}

const speakerColors: { [key: string]: string } = {
  A: "bg-blue-500",
  B: "bg-green-500",
  C: "bg-purple-500",
  D: "bg-orange-500",
  E: "bg-pink-500",
  F: "bg-teal-500",
};

const colorCycle = Object.values(speakerColors);

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

  const assignedColors: { [key: string]: string } = {};
  let colorIndex = 0;

  const getSpeakerColor = (speaker: string) => {
    if (speakerColors[speaker]) return speakerColors[speaker];
    if (assignedColors[speaker]) return assignedColors[speaker];
    const newColor = colorCycle[colorIndex % colorCycle.length];
    assignedColors[speaker] = newColor;
    colorIndex++;
    return newColor;
  };

  return (
    <div className="space-y-8">
      {transcript.map((utterance, index) => {
        const bgColor = getSpeakerColor(utterance.speaker);
        return (
          <div key={index} className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${bgColor}`}
            >
              {utterance.speaker}
            </div>

            <div className="flex-grow">
              <div className="flex items-baseline gap-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Speaker {utterance.speaker}
                </p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {secondsToHHMMSS(utterance.start)}
                </p>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1 whitespace-pre-wrap">
                {utterance.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
