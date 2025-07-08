// app/components/AllClipsDisplay.tsx (Corrected)

"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Clapperboard } from "lucide-react";
import { AnalysisSection } from "@/app/_global/interface";

interface AllClipsDisplayProps {
  results: AnalysisSection[];
}

export const AllClipsDisplay: React.FC<AllClipsDisplayProps> = ({
  results,
}) => {
  // Aggregate all clips from all sections, adding context from the section title
  const allClips = results.flatMap((section) => {
    // --- FIX: Determine the correct title based on the persona ---
    const sectionTitle =
      section.analysis_persona === "consultant"
        ? section.section_title
        : section.generated_title;

    // Map the clips for the current section
    return (
      section.suggested_clips?.map((clip) => ({
        ...clip,
        sectionTitle, // Use the correctly determined title
      })) ?? []
    );
  });

  if (allClips.length === 0) {
    return null; // Don't render anything if there are no clips
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      <AccordionItem
        value="all-clips"
        className="bg-white dark:bg-slate-900/70 rounded-lg shadow-md border-b-0"
      >
        <AccordionTrigger className="p-6 text-left hover:no-underline">
          <div className="flex items-center space-x-4">
            <Clapperboard className="w-6 h-6 text-purple-600 dark:text-purple-500" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              All Clip Suggestions ({allClips.length})
            </h3>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-6 pt-0">
          <div className="space-y-4">
            {allClips.map((clip, index) => (
              <div
                key={index}
                className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/50 border-l-4 border-purple-300 dark:border-purple-700"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  From: {clip.sectionTitle}
                </p>
                <p className="italic text-slate-800 dark:text-slate-200 mt-1">
                  "{clip.quote}"
                </p>
                <Badge variant="secondary" className="mt-2 font-mono">
                  {clip.start} - {clip.end}
                </Badge>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
