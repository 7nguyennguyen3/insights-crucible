"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React from "react";

import {
  AlertTriangle,
  HelpCircle,
  Info,
  Lightbulb,
  MessageSquareQuote,
  PlusCircle,
  Users,
} from "lucide-react";
import { ConsultantAnalysisSection } from "../../_global/interface";
import { EditableField } from "./EditableField";
import { secondsToHHMMSS } from "@/app/utils/convertTime";

type ConsultantItemField =
  | "client_pain_points"
  | "strategic_opportunities"
  | "critical_quotes"
  | "open_questions"
  | "key_stakeholders_mentioned";

interface AnalysisResultsDisplayProps {
  results: ConsultantAnalysisSection[];
  isEditMode: boolean;
  onAddItem: (sectionId: string, field: ConsultantItemField) => void;
  onDeleteItem: (
    sectionId: string,
    field: ConsultantItemField,
    index: number
  ) => void;
  onItemChange: (
    sectionId: string,
    field: ConsultantItemField,
    index: number,
    newValue: string
  ) => void;
  onFieldChange: (
    sectionId: string,
    field: "executive_summary" | "section_title",
    value: any
  ) => void;
  onEntityChange?: (
    sectionId: string,
    index: number,
    field: "name" | "explanation",
    value: string
  ) => void;
  onAddEntity?: (sectionId: string) => void;
  onDeleteEntity?: (sectionId: string, index: number) => void;
}

const timeStringToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(":");
  if (parts.length === 0) return 0;
  const reversedParts = parts.reverse();
  let totalSeconds = 0;
  if (reversedParts[0]) totalSeconds += parseFloat(reversedParts[0]) || 0;
  if (reversedParts[1])
    totalSeconds += (parseInt(reversedParts[1], 10) || 0) * 60;
  if (reversedParts[2])
    totalSeconds += (parseInt(reversedParts[2], 10) || 0) * 3600;
  return totalSeconds;
};

const SectionRenderer: React.FC<{
  title: string;
  icon: React.ReactNode;
  sectionId: string;
  items: string[];
  field: ConsultantItemField;
  isEditMode: boolean;
  onAddItem: (sectionId: string, field: ConsultantItemField) => void;
  onDeleteItem: (
    sectionId: string,
    field: ConsultantItemField,
    index: number
  ) => void;
  onItemChange: (
    sectionId: string,
    field: ConsultantItemField,
    index: number,
    newValue: string
  ) => void;
  isQuote?: boolean;
}> = ({
  title,
  icon,
  sectionId,
  items,
  field,
  isEditMode,
  onAddItem,
  onDeleteItem,
  onItemChange,
  isQuote,
}) => {
  if (!items || items.length === 0) {
    if (!isEditMode) return null;
    return (
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <h4 className="flex items-center font-semibold mb-2 text-slate-700 dark:text-slate-300">
          {icon} {title}
        </h4>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 ml-7"
          onClick={() => onAddItem(sectionId, field)}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Add {title.slice(0, -1)}
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
      <h4 className="flex items-center font-semibold mb-2 text-slate-700 dark:text-slate-300">
        {icon} {title}
      </h4>
      <div className={`pl-7 space-y-2`}>
        {items.map((item, i) =>
          isQuote ? (
            <blockquote
              key={`${field}-${sectionId}-${i}`}
              className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic text-slate-800 dark:text-slate-200"
            >
              <EditableField
                isEditing={isEditMode}
                value={item}
                onChange={(newValue) =>
                  onItemChange(sectionId, field, i, newValue)
                }
                onDelete={() => onDeleteItem(sectionId, field, i)}
                isTextarea
              />
            </blockquote>
          ) : (
            <div
              key={`${field}-${sectionId}-${i}`}
              className="flex items-start"
            >
              <span className="mr-2 text-indigo-500">▪</span>
              <EditableField
                isEditing={isEditMode}
                value={item}
                onChange={(newValue) =>
                  onItemChange(sectionId, field, i, newValue)
                }
                onDelete={() => onDeleteItem(sectionId, field, i)}
                isTextarea
                className="flex-1 font-normal text-slate-700 text-sm"
              />
            </div>
          )
        )}
      </div>
      {isEditMode && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 ml-7"
          onClick={() => onAddItem(sectionId, field)}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Add {title.slice(0, -1)}
        </Button>
      )}
    </div>
  );
};

export const ConsultantReportView: React.FC<AnalysisResultsDisplayProps> = (
  props
) => {
  const {
    results,
    isEditMode,
    onFieldChange,
    onEntityChange = () => {},
    onAddEntity = () => {},
    onDeleteEntity = () => {},
  } = props;
  const sortedResults = [...results].sort((a, b) => {
    if (a.start_time === "N/A" || !a.start_time) return 1;
    if (b.start_time === "N/A" || !b.start_time) return -1;
    return (
      timeStringToSeconds(a.start_time) - timeStringToSeconds(b.start_time)
    );
  });

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={sortedResults.length > 0 ? sortedResults[0].id : undefined}
      className="w-full space-y-4 mb-20"
    >
      {sortedResults.map((section, index) => (
        <AccordionItem
          key={section.id + "-" + index}
          value={section.id}
          className="bg-white dark:bg-slate-900/70 rounded-lg shadow-md border-b-0"
        >
          <AccordionTrigger className="w-full p-6 text-left hover:no-underline">
            <div className="flex items-start md:items-center space-x-4 w-full">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">
                {index + 1}
              </div>
              <div className="flex-1 text-left">
                <EditableField
                  isEditing={isEditMode}
                  value={section.section_title}
                  onChange={(newValue) =>
                    onFieldChange(section.id, "section_title", newValue)
                  }
                  className="font-bold text-lg text-slate-800 dark:text-slate-100"
                  placeholder="Enter section title..."
                />
                {/* --- MOVED: The executive summary is now here, always visible --- */}
                <EditableField
                  isEditing={isEditMode}
                  value={section.executive_summary}
                  onChange={(newValue) =>
                    onFieldChange(section.id, "executive_summary", newValue)
                  }
                  isTextarea
                  className="text-sm italic text-slate-500 dark:text-slate-400 mt-1"
                  placeholder="Enter executive summary..."
                />
              </div>
              {section.start_time && section.start_time !== "N/A" && (
                <Badge
                  variant="outline"
                  className="hidden md:block ml-auto mr-2 font-mono whitespace-nowrap self-start"
                >
                  {secondsToHHMMSS(timeStringToSeconds(section.start_time))} -{" "}
                  {secondsToHHMMSS(timeStringToSeconds(section.end_time))}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6 pt-0">
            {/* --- REMOVED: The summary is no longer in the content area --- */}
            <div className="space-y-6">
              <SectionRenderer
                title="Client Pain Points"
                icon={<AlertTriangle className="w-4 h-4 mr-3 text-red-500" />}
                field="client_pain_points"
                items={section.client_pain_points}
                sectionId={section.id}
                {...props}
              />
              <SectionRenderer
                title="Strategic Opportunities"
                icon={<Lightbulb className="w-4 h-4 mr-3 text-green-500" />}
                field="strategic_opportunities"
                items={section.strategic_opportunities}
                sectionId={section.id}
                {...props}
              />
              <SectionRenderer
                title="Critical Quotes"
                icon={
                  <MessageSquareQuote className="w-4 h-4 mr-3 text-blue-500" />
                }
                field="critical_quotes"
                items={section.critical_quotes}
                isQuote
                sectionId={section.id}
                {...props}
              />
              <SectionRenderer
                title="Key Stakeholders"
                icon={<Users className="w-4 h-4 mr-3 text-purple-500" />}
                field="key_stakeholders_mentioned"
                items={section.key_stakeholders_mentioned}
                sectionId={section.id}
                {...props}
              />
              <SectionRenderer
                title="Open Questions"
                icon={<HelpCircle className="w-4 h-4 mr-3 text-yellow-500" />}
                field="open_questions"
                items={section.open_questions}
                sectionId={section.id}
                {...props}
              />

              {section.entities && section.entities.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="key-concepts" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline p-0">
                        <h4 className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300">
                          <Info className="w-4 h-4 mr-3 text-sky-500" />
                          Key Concepts
                        </h4>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-0">
                        <div className="space-y-4 pl-7">
                          {section.entities.map((entity, i) => (
                            <div key={`entity-${section.id}-${i}`}>
                              <EditableField
                                isEditing={isEditMode}
                                value={entity.name}
                                onChange={(newValue) =>
                                  onEntityChange(
                                    section.id,
                                    i,
                                    "name",
                                    newValue
                                  )
                                }
                                onDelete={
                                  isEditMode
                                    ? () => onDeleteEntity(section.id, i)
                                    : undefined
                                }
                                placeholder="Enter concept name..."
                                className="font-semibold text-slate-800 dark:text-slate-200"
                              />
                              <EditableField
                                isEditing={isEditMode}
                                value={entity.explanation}
                                onChange={(newValue) =>
                                  onEntityChange(
                                    section.id,
                                    i,
                                    "explanation",
                                    newValue
                                  )
                                }
                                isTextarea
                                placeholder="Enter explanation..."
                                className="text-slate-600 dark:text-slate-400 mt-1"
                              />
                            </div>
                          ))}
                        </div>
                        {isEditMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 ml-7"
                            onClick={() => onAddEntity(section.id)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" /> Add Concept
                          </Button>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
