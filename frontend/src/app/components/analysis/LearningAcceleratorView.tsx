"use client";

import {
  LearningAcceleratorSection,
  LessonConcept,
  NotableQuote,
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
  GraduationCap,
  Info,
  Lightbulb,
  MessageSquareQuote,
  PlusCircle,
  Target,
  Clock,
} from "lucide-react";
import React from "react";
import { EditableField } from "./EditableField";
import { secondsToHHMMSS } from "@/app/utils/convertTime";

type ItemField = "key_points" | "verifiable_claims";
type LessonField = keyof LessonConcept;
type QuoteField = keyof NotableQuote;

interface LearningAcceleratorViewProps {
  results: LearningAcceleratorSection[];
  isEditMode?: boolean;
  onAddItem?: (
    sectionId: string,
    field: ItemField
  ) => void;
  onDeleteItem?: (
    sectionId: string,
    field: ItemField,
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
    field: keyof LearningAcceleratorSection,
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
  onLessonChange?: (
    sectionId: string,
    index: number,
    field: LessonField,
    value: string | string[]
  ) => void;
  onAddLesson?: (sectionId: string) => void;
  onDeleteLesson?: (sectionId: string, index: number) => void;
  onQuoteChange?: (
    sectionId: string,
    index: number,
    field: QuoteField,
    value: string
  ) => void;
  onAddQuote?: (sectionId: string) => void;
  onDeleteQuote?: (sectionId: string, index: number) => void;
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

export const LearningAcceleratorView: React.FC<LearningAcceleratorViewProps> = ({
  results,
  isEditMode = false,
  onAddItem = () => {},
  onDeleteItem = () => {},
  onItemChange = () => {},
  onFieldChange = () => {},
  onEntityChange = () => {},
  onAddEntity = () => {},
  onDeleteEntity = () => {},
  onLessonChange = () => {},
  onAddLesson = () => {},
  onDeleteLesson = () => {},
  onQuoteChange = () => {},
  onAddQuote = () => {},
  onDeleteQuote = () => {},
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
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
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
              {/* Key Points Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="flex items-center font-semibold mb-3 text-slate-700 dark:text-slate-300">
                  <Target className="w-4 h-4 mr-3 text-emerald-500" />
                  Key Points
                </h4>
                <ul className="list-none pl-7 space-y-2">
                  {section.key_points?.map((point, i) => (
                    <li
                      key={`key-point-${section.id}-${i}`}
                      className="flex items-start"
                    >
                      <span className="mr-2 text-emerald-500">▪</span>
                      <EditableField
                        isEditing={isEditMode}
                        value={point}
                        onChange={(newValue) =>
                          onItemChange(
                            section.id,
                            "key_points",
                            i,
                            newValue
                          )
                        }
                        onDelete={() =>
                          onDeleteItem(section.id, "key_points", i)
                        }
                        isTextarea
                        className="flex-1 font-normal text-slate-700 dark:text-slate-300 text-sm"
                      />
                    </li>
                  ))}
                </ul>
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-7"
                    onClick={() => onAddItem(section.id, "key_points")}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Key Point
                  </Button>
                )}
              </div>

              {/* Lessons and Concepts Section - Primary Focus */}
              <div className="pt-4 border-t-2 border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 -mx-2">
                <h4 className="flex items-center text-lg font-bold mb-4 text-purple-700 dark:text-purple-300">
                  <GraduationCap className="w-5 h-5 mr-3 text-purple-600" />
                  Key Lessons & Concepts
                </h4>
                <div className="space-y-5 pl-2">
                  {section.lessons_and_concepts?.map((lesson, i) => (
                    <div key={`lesson-${section.id}-${i}`} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-purple-100 dark:border-purple-800/30">
                      <div className="mb-3">
                        <EditableField
                          isEditing={isEditMode}
                          value={lesson.lesson}
                          onChange={(newValue) =>
                            onLessonChange(section.id, i, "lesson", newValue)
                          }
                          onDelete={isEditMode ? () => onDeleteLesson(section.id, i) : undefined}
                          isTextarea
                          placeholder="Enter lesson or concept..."
                          className="font-semibold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <MessageSquareQuote className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Supporting Quote</span>
                        </div>
                        <blockquote className="border-l-4 border-blue-400 pl-4 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg py-2">
                          <EditableField
                            isEditing={isEditMode}
                            value={lesson.supporting_quote}
                            onChange={(newValue) =>
                              onLessonChange(section.id, i, "supporting_quote", newValue)
                            }
                            isTextarea
                            placeholder="Enter supporting quote..."
                            className="italic text-slate-600 dark:text-slate-400 text-sm"
                          />
                        </blockquote>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center mb-2">
                          <Clock className="w-3 h-3 mr-2 text-amber-500" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Timestamp</span>
                        </div>
                        <EditableField
                          isEditing={isEditMode}
                          value={lesson.timestamp}
                          onChange={(newValue) =>
                            onLessonChange(section.id, i, "timestamp", newValue)
                          }
                          placeholder="Enter timestamp..."
                          className="text-sm font-mono text-slate-600 dark:text-slate-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <Lightbulb className="w-3 h-3 mr-2 text-orange-500" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Real-life Examples</span>
                        </div>
                        <ul className="space-y-1">
                          {lesson.real_life_examples?.map((example, exampleIndex) => (
                            <li key={`example-${section.id}-${i}-${exampleIndex}`} className="flex items-start">
                              <span className="mr-2 text-orange-500 text-xs">•</span>
                              <EditableField
                                isEditing={isEditMode}
                                value={example}
                                onChange={(newValue) => {
                                  const newExamples = [...lesson.real_life_examples];
                                  newExamples[exampleIndex] = newValue;
                                  onLessonChange(section.id, i, "real_life_examples", newExamples);
                                }}
                                isTextarea
                                className="flex-1 text-slate-600 dark:text-slate-400 text-sm"
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-7"
                    onClick={() => onAddLesson(section.id)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Lesson
                  </Button>
                )}
              </div>

              {/* Notable Quotes Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="flex items-center text-md font-semibold mb-3 text-slate-700 dark:text-slate-300">
                  <MessageSquareQuote className="w-4 h-4 mr-3 text-blue-500" />
                  Notable Quotes
                </h4>
                <div className="space-y-3 pl-5">
                  {section.notable_quotes?.map((quote, i) => (
                    <div key={`quote-${section.id}-${i}`} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <blockquote className="border-l-4 border-blue-300 dark:border-blue-600 pl-4 mb-2">
                        <EditableField
                          isEditing={isEditMode}
                          value={quote.quote}
                          onChange={(newValue) =>
                            onQuoteChange(section.id, i, "quote", newValue)
                          }
                          onDelete={isEditMode ? () => onDeleteQuote(section.id, i) : undefined}
                          isTextarea
                          className="italic text-slate-800 dark:text-slate-200"
                        />
                      </blockquote>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <EditableField
                          isEditing={isEditMode}
                          value={quote.context}
                          onChange={(newValue) =>
                            onQuoteChange(section.id, i, "context", newValue)
                          }
                          placeholder="Enter context..."
                          className="mb-1"
                        />
                        {quote.timestamp && (
                          <EditableField
                            isEditing={isEditMode}
                            value={quote.timestamp}
                            onChange={(newValue) =>
                              onQuoteChange(section.id, i, "timestamp", newValue)
                            }
                            placeholder="Enter timestamp..."
                            className="font-mono"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-5"
                    onClick={() => onAddQuote(section.id)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Quote
                  </Button>
                )}
              </div>

              {/* Key Concepts (Entities) Section */}
              {section.entities && section.entities.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="key-concepts" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline p-0">
                        <h4 className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300">
                          <Info className="w-4 h-4 mr-3 text-sky-500" />
                          Key Concepts {section.entities.length > 4 && <span className="text-xs text-amber-600 ml-2">(Top 4 shown)</span>}
                        </h4>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-0">
                        <div className="space-y-4 pl-7">
                          {section.entities.slice(0, 4).map((entity, i) => (
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

              {/* Verifiable Claims Section */}
              {section.verifiable_claims && section.verifiable_claims.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="verifiable-claims" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline p-0">
                        <h4 className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300">
                          <BookText className="w-4 h-4 mr-3 text-green-500" />
                          Verifiable Claims
                        </h4>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-0">
                        <ul className="list-none pl-7 space-y-2">
                          {section.verifiable_claims.map((claim, i) => (
                            <li
                              key={`claim-${section.id}-${i}`}
                              className="flex items-start"
                            >
                              <span className="mr-2 text-green-500">▪</span>
                              <EditableField
                                isEditing={isEditMode}
                                value={claim}
                                onChange={(newValue) =>
                                  onItemChange(
                                    section.id,
                                    "verifiable_claims",
                                    i,
                                    newValue
                                  )
                                }
                                onDelete={() =>
                                  onDeleteItem(section.id, "verifiable_claims", i)
                                }
                                isTextarea
                                className="flex-1 text-slate-600 dark:text-slate-400 text-sm"
                              />
                            </li>
                          ))}
                        </ul>
                        {isEditMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 ml-7"
                            onClick={() => onAddItem(section.id, "verifiable_claims")}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" /> Add Claim
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