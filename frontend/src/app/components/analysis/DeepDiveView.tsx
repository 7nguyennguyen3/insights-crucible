"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  BookText, 
  MessageSquareQuote,
  Zap,
  Brain,
  HelpCircle
} from "lucide-react";
import { EditableField } from "./EditableField";

import { DeepDiveSection, ActionableTakeaway } from "@/app/_global/interface";

interface DeepDiveViewProps {
  results: DeepDiveSection[];
  isEditMode?: boolean;
  onFieldChange?: (
    sectionId: string,
    field: keyof DeepDiveSection,
    value: any
  ) => void;
  onTakeawayChange?: (
    sectionId: string,
    index: number,
    field: keyof ActionableTakeaway,
    value: string
  ) => void;
  onAddTakeaway?: (sectionId: string) => void;
  onDeleteTakeaway?: (sectionId: string, index: number) => void;
}

const timeStringToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === "N/A") return 0;

  const parts = timeStr.split(":");
  if (parts.length === 0) return 0;

  const reversedParts = parts.reverse();
  let totalSeconds = 0;

  if (reversedParts[0]) {
    totalSeconds += parseFloat(reversedParts[0]) || 0;
  }
  if (reversedParts[1]) {
    totalSeconds += (parseInt(reversedParts[1], 10) || 0) * 60;
  }
  if (reversedParts[2]) {
    totalSeconds += (parseInt(reversedParts[2], 10) || 0) * 3600;
  }

  return totalSeconds;
};

const formatTimeDisplay = (timeStr: string): string => {
  if (!timeStr || timeStr === "N/A") return timeStr;

  const parts = timeStr.split(":");
  if (parts.length === 0) return timeStr;

  // If already in H:MM:SS format, return as is
  if (parts.length === 3) return timeStr;

  // Convert MM:SS to H:MM:SS if minutes >= 60
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parts[1];

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds}`;
    }
  }

  return timeStr;
};

const getTakeawayTypeConfig = (type: ActionableTakeaway["type"]) => {
  switch (type) {
    case "Prescriptive Action":
      return {
        icon: Zap,
        label: "Prescriptive Action",
        badgeColor: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
      };
    case "Mental Model":
      return {
        icon: Brain,
        label: "Mental Model",
        badgeColor: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
      };
    case "Reflective Question":
      return {
        icon: HelpCircle,
        label: "Reflective Question",
        badgeColor: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
      };
    default:
      return {
        icon: BookText,
        label: "Takeaway",
        badgeColor: "bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300"
      };
  }
};

const DeepDiveView: React.FC<DeepDiveViewProps> = ({
  results,
  isEditMode = false,
  onFieldChange,
  onTakeawayChange,
  onAddTakeaway,
  onDeleteTakeaway,
}) => {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No analysis results available.
      </div>
    );
  }

  // Sort results by start_time before rendering
  const sortedResults = [...results].sort((a, b) => {
    const aSeconds = timeStringToSeconds(a.start_time);
    const bSeconds = timeStringToSeconds(b.start_time);
    return aSeconds - bSeconds;
  });

  return (
    <div className="space-y-6">
      <Accordion
        type="single"
        collapsible
        defaultValue={sortedResults.length > 0 ? (sortedResults[0].id || "section-0") : undefined}
        className="space-y-4"
      >
        {sortedResults.map((section, index) => (
          <AccordionItem
            key={section.id || index}
            value={section.id || `section-${index}`}
            className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline group">
              <div className="flex flex-col items-start text-left w-full">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {formatTimeDisplay(section.start_time)} - {formatTimeDisplay(section.end_time)}
                  </span>
                </div>
                <EditableField
                  isEditing={isEditMode}
                  value={section.generated_title || section.section_title || `Section ${index + 1}`}
                  onChange={(newValue) =>
                    onFieldChange?.(section.id, "generated_title", newValue)
                  }
                  className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2"
                />
                <EditableField
                  isEditing={isEditMode}
                  value={section["1_sentence_summary"] || ""}
                  onChange={(newValue) =>
                    onFieldChange?.(section.id, "1_sentence_summary", newValue)
                  }
                  className="text-sm text-slate-600 dark:text-slate-400 italic"
                  placeholder="One sentence summary..."
                />
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-6 pb-6 pt-2">
              {/* Actionable Takeaways */}
              <div>
                <h4 className="flex items-center text-base font-semibold mb-4 text-slate-700 dark:text-slate-300">
                  <BookText className="w-4 h-4 mr-2 text-green-600" />
                  Actionable Takeaways
                </h4>
                
                <div className="space-y-4">
                  {(section.actionable_takeaways || section.lessons_and_concepts)
                    ?.slice() // Create a copy to avoid mutating the original array
                    .sort((a, b) => {
                      // Handle cases where quote_timestamp might be undefined
                      const aTimestamp = a.quote_timestamp?.start || "0:00";
                      const bTimestamp = b.quote_timestamp?.start || "0:00";
                      
                      const aSeconds = timeStringToSeconds(aTimestamp);
                      const bSeconds = timeStringToSeconds(bTimestamp);
                      
                      return aSeconds - bSeconds;
                    })
                    .map((item, sortedIndex) => {
                      // Handle both new actionable_takeaways and legacy lessons_and_concepts
                      const isNewFormat = 'type' in item && 'takeaway' in item;
                      const takeaway = isNewFormat ? item as ActionableTakeaway : {
                        type: "Prescriptive Action" as const,
                        takeaway: (item as any).lesson || "",
                        supporting_quote: (item as any).supporting_quote || "",
                        quote_timestamp: (item as any).quote_timestamp
                      };

                      // Debug quote timestamp
                      console.log("🔍 DeepDive Debug - Item:", item);
                      console.log("🔍 DeepDive Debug - Takeaway quote_timestamp:", takeaway.quote_timestamp);
                      console.log("🔍 DeepDive Debug - Has quote_timestamp?", !!takeaway.quote_timestamp);
                      console.log("🔍 DeepDive Debug - quote_timestamp.start:", takeaway.quote_timestamp?.start);

                      // Find the original index for edit operations
                      const sourceArray = section.actionable_takeaways || section.lessons_and_concepts || [];
                      const originalIndex = sourceArray.findIndex(original => original === item) ?? sortedIndex;
                      
                      const typeConfig = getTakeawayTypeConfig(takeaway.type);
                      const IconComponent = typeConfig.icon;
                      
                      return (
                        <div
                          key={`takeaway-${section.id}-${originalIndex}`}
                          className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-4 border border-slate-200 dark:border-slate-800/30"
                        >
                          {/* Takeaway Type Badge */}
                          <div className="flex items-center mb-3">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig.badgeColor}`}>
                              <IconComponent className="w-3 h-3 mr-1" />
                              {typeConfig.label}
                            </div>
                          </div>

                          {/* Takeaway Content */}
                          <div className="mb-4">
                            <EditableField
                              isEditing={isEditMode}
                              value={takeaway.takeaway}
                              onChange={(newValue) =>
                                onTakeawayChange?.(section.id, originalIndex, "takeaway" as keyof ActionableTakeaway, newValue)
                              }
                              onDelete={isEditMode ? () => onDeleteTakeaway?.(section.id, originalIndex) : undefined}
                              isTextarea
                              placeholder="Enter actionable takeaway..."
                              className="font-medium text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          {/* Supporting Quote */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <MessageSquareQuote className="w-3 h-3 mr-2 text-amber-600" />
                                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                  Supporting Quote
                                </span>
                              </div>
                              {takeaway.quote_timestamp && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                  {formatTimeDisplay(takeaway.quote_timestamp.start)}
                                </span>
                              )}
                            </div>
                            <blockquote className="border-l-3 border-amber-400 pl-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-r-lg py-2">
                              <EditableField
                                isEditing={isEditMode}
                                value={takeaway.supporting_quote}
                                onChange={(newValue) =>
                                  onTakeawayChange?.(section.id, originalIndex, "supporting_quote", newValue)
                                }
                                isTextarea
                                placeholder="Enter supporting quote..."
                                className="italic text-slate-600 dark:text-slate-400 text-sm"
                              />
                            </blockquote>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {isEditMode && (
                  <button
                    onClick={() => onAddTakeaway?.(section.id)}
                    className="mt-4 px-4 py-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg border border-green-300 dark:border-green-700 transition-colors"
                  >
                    + Add Takeaway
                  </button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default DeepDiveView;