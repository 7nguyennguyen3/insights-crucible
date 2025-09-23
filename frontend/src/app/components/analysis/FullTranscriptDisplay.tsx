"use client";

import React, { useState, useMemo } from "react";
import { secondsToHHMMSS } from "@/app/utils/convertTime";
import { Utterance } from "@/app/_global/interface";

interface FullTranscriptDisplayProps {
  transcript: Utterance[];
}

/**
 */
const HighlightedText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  // If there's no highlight term, return the original text
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  // Create a case-insensitive regular expression to find all occurrences of the highlight term
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        // Check if the part matches the highlight term (case-insensitively)
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark
            key={`highlight-${i}-${part.slice(0, 10)}`}
            className="bg-yellow-300 dark:bg-yellow-500 rounded px-1 text-slate-800"
          >
            {part}
          </mark>
        ) : (
          // Otherwise, render the part as plain text
          <span key={`text-${i}-${part.slice(0, 10)}`}>{part}</span>
        )
      )}
    </span>
  );
};

export const FullTranscriptDisplay: React.FC<FullTranscriptDisplayProps> = ({
  transcript,
}) => {
  // State to store the user's search term
  const [searchTerm, setSearchTerm] = useState("");

  // Memoize the filtered transcript to avoid re-calculating on every render
  const filteredTranscript = useMemo(() => {
    if (!searchTerm.trim()) {
      return transcript; // Return all items if search is empty
    }
    // Filter utterances to only include those that contain the search term
    return transcript.filter((utterance) =>
      utterance.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, transcript]); // Recalculate only if searchTerm or transcript changes

  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 py-8">
        No transcript data available.
      </div>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      <div className="space-y-4 sm:space-y-6">
        {/* Search Input Field */}
        <div className="mb-4 sm:mb-6 sticky top-0 bg-white dark:bg-slate-900 py-4 z-10">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transcript..."
            className="w-full px-4 py-3 sm:py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 text-base"
          />
        </div>

        {/* Render the filtered and highlighted transcript */}
        {filteredTranscript.length > 0 ? (
          filteredTranscript.map((utterance, index) => (
            <div
              key={`${utterance.start}-${index}`}
              className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4"
            >
              <div className="flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-28">
                {utterance.speaker && (
                  <div
                    className={`
                    inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium
                    ${
                      utterance.speaker === "A"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        : utterance.speaker === "B"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    }
                  `}
                  >
                    <span className="sm:hidden">{utterance.speaker}</span>
                    <span className="hidden sm:inline">
                      Speaker {utterance.speaker}
                    </span>
                  </div>
                )}
                <p className="font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                  {secondsToHHMMSS(utterance.start)}
                </p>
              </div>

              <div className="flex-grow">
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {/* Use the helper to highlight the text */}
                  <HighlightedText text={utterance.text} highlight={searchTerm} />
                </p>
              </div>
            </div>
          ))
        ) : (
          // Show a message if no matches are found
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            No matches found for "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
};
