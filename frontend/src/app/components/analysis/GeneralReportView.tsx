"use client";

import {
  ArgumentStructure,
  GeneralAnalysisSection,
} from "@/app/_global/interface";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookText,
  CheckCircle,
  ListChecks,
  MessageSquareQuote,
  PlusCircle,
} from "lucide-react";
import React from "react";
import { ArgumentStructureCard } from "./ArgumentStructureCard";
import { EditableField } from "./EditableField";
import { secondsToHHMMSS } from "@/app/utils/convertTime";

type ItemField = "summary_points" | "actionable_advice" | "notable_quotes";

interface AnalysisResultsDisplayProps {
  results: GeneralAnalysisSection[];
  isEditMode?: boolean;
  onAddItem?: (
    sectionId: string,
    field: ItemField | "questions_and_answers"
  ) => void;
  onDeleteItem?: (
    sectionId: string,
    field: ItemField | "questions_and_answers",
    index: number
  ) => void;
  onItemChange?: (
    sectionId: string,
    field: ItemField,
    index: number,
    newValue: string
  ) => void;
  onFieldChange?: (
    sectionId: string,
    field: keyof GeneralAnalysisSection,
    value: any
  ) => void;
  onQaChange?: (
    sectionId: string,
    index: number,
    field: "question" | "answer",
    value: string
  ) => void;
}

const timeStringToSeconds = (timeStr: string): number => {
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

export const GeneralReportView: React.FC<AnalysisResultsDisplayProps> = ({
  results,
  isEditMode = false,
  onAddItem = () => {},
  onDeleteItem = () => {},
  onItemChange = () => {},
  onFieldChange = () => {},
  onQaChange = () => {},
}) => {
  const sortedResults = [...results].sort((a, b) => {
    if (a.start_time === "N/A" || !a.start_time) return 1;
    if (b.start_time === "N/A" || !b.start_time) return -1;
    const aSeconds = timeStringToSeconds(a.start_time);
    const bSeconds = timeStringToSeconds(b.start_time);
    return aSeconds - bSeconds;
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
                  value={section.generated_title}
                  onChange={(newValue) =>
                    onFieldChange(section.id, "generated_title", newValue)
                  }
                  className="font-bold text-lg text-slate-800 dark:text-slate-100"
                  placeholder="Enter section title..."
                />
                <EditableField
                  isEditing={isEditMode}
                  value={section["1_sentence_summary"]}
                  onChange={(newValue) =>
                    onFieldChange(section.id, "1_sentence_summary", newValue)
                  }
                  isTextarea
                  className="text-sm italic text-slate-500 dark:text-slate-400 mt-1"
                  placeholder="Enter one-sentence summary..."
                />
              </div>
              {section.start_time &&
                section.end_time &&
                section.start_time !== "N/A" && (
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
            <div className="space-y-6">
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="flex items-center font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  <ListChecks className="w-4 h-4 mr-3 text-indigo-500" />
                  Key Points
                </h4>
                <ul className="list-none pl-7 space-y-2">
                  {section.summary_points?.map((point, i) => (
                    <li
                      key={`summary-${section.id}-${i}`}
                      className="flex items-start"
                    >
                      <span className="mr-2 text-indigo-500">▪</span>
                      <EditableField
                        isEditing={isEditMode}
                        value={point}
                        onChange={(newValue) =>
                          onItemChange(
                            section.id,
                            "summary_points",
                            i,
                            newValue
                          )
                        }
                        onDelete={() =>
                          onDeleteItem(section.id, "summary_points", i)
                        }
                        isTextarea
                        className="flex-1 font-normal text-slate-700 text-sm"
                      />
                    </li>
                  ))}
                </ul>
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-7"
                    onClick={() => onAddItem(section.id, "summary_points")}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Key Point
                  </Button>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="flex items-center text-md font-semibold mb-3 text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 mr-3 text-teal-500" />
                  Actionable Advice
                </h4>
                <ul className="list-none pl-7 space-y-1">
                  {section.actionable_advice?.map((advice, i) => (
                    <li
                      key={`advice-${section.id}-${i}`}
                      className="flex items-start text-slate-600 dark:text-slate-400"
                    >
                      <span className="mr-2 text-teal-500">▪</span>
                      <EditableField
                        isEditing={isEditMode}
                        value={advice}
                        onChange={(newValue) =>
                          onItemChange(
                            section.id,
                            "actionable_advice",
                            i,
                            newValue
                          )
                        }
                        onDelete={() =>
                          onDeleteItem(section.id, "actionable_advice", i)
                        }
                        isTextarea
                        className="flex-1"
                      />
                    </li>
                  ))}
                </ul>
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-7"
                    onClick={() => onAddItem(section.id, "actionable_advice")}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Advice
                  </Button>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="flex items-center text-md font-semibold mb-3 text-slate-700 dark:text-slate-300">
                  <MessageSquareQuote className="w-4 h-4 mr-3 text-blue-500" />
                  Notable Quotes
                </h4>
                <div className="space-y-3 pl-5">
                  {section.notable_quotes?.map((quote, i) => (
                    <blockquote
                      key={`quote-${section.id}-${i}`}
                      className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic text-slate-800 dark:text-slate-200"
                    >
                      <EditableField
                        isEditing={isEditMode}
                        value={quote}
                        onChange={(newValue) =>
                          onItemChange(
                            section.id,
                            "notable_quotes",
                            i,
                            newValue
                          )
                        }
                        onDelete={() =>
                          onDeleteItem(section.id, "notable_quotes", i)
                        }
                        isTextarea
                      />
                    </blockquote>
                  ))}
                </div>
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-5"
                    onClick={() => onAddItem(section.id, "notable_quotes")}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Quote
                  </Button>
                )}
              </div>

              {section.questions_and_answers &&
                section.questions_and_answers.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="q-and-a" className="border-b-0">
                        <AccordionTrigger className="hover:no-underline p-0">
                          <h4 className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300">
                            <BookText className="w-4 h-4 mr-3 text-green-500" />
                            Q&A Section
                          </h4>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-0">
                          <div className="space-y-4 pl-7">
                            {section.questions_and_answers.map((qa, i) => (
                              <div key={`qa-${section.id}-${i}`}>
                                <EditableField
                                  isEditing={isEditMode}
                                  value={qa.question}
                                  onChange={(newValue) =>
                                    onQaChange(
                                      section.id,
                                      i,
                                      "question",
                                      newValue
                                    )
                                  }
                                  placeholder="Enter question..."
                                  className="font-semibold text-slate-800 dark:text-slate-200"
                                  onDelete={
                                    isEditMode
                                      ? () =>
                                          onDeleteItem(
                                            section.id,
                                            "questions_and_answers",
                                            i
                                          )
                                      : undefined
                                  }
                                />
                                <EditableField
                                  isEditing={isEditMode}
                                  value={qa.answer}
                                  onChange={(newValue) =>
                                    onQaChange(
                                      section.id,
                                      i,
                                      "answer",
                                      newValue
                                    )
                                  }
                                  isTextarea
                                  placeholder="Enter answer..."
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
                              onClick={() =>
                                onAddItem(section.id, "questions_and_answers")
                              }
                            >
                              <PlusCircle className="h-4 w-4 mr-2" /> Add Q&A
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
