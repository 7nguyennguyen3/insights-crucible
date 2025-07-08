"use client";

import { ContextualBriefing, Viewpoint } from "@/app/_global/interface";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookCheck,
  BookX,
  Library,
  Scale,
  Sparkles,
  Link as LinkIcon,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { EditableField } from "./EditableField";
import { Button } from "@/components/ui/button";

type ViewpointField = "supporting_viewpoints" | "challenging_viewpoints";
type ViewpointProperty = keyof Viewpoint;

interface ContextualBriefingDisplayProps {
  briefing: ContextualBriefing;
  isEditMode: boolean; // <-- NEW
  // --- NEW EDIT HANDLERS ---
  onFieldChange: (field: keyof ContextualBriefing, value: string) => void;
  onListItemChange: (
    field: "key_nuances_and_conditions",
    index: number,
    value: string
  ) => void;
  onViewpointChange: (
    field: ViewpointField,
    index: number,
    prop: ViewpointProperty,
    value: string
  ) => void;
  onAddItem: (field: "key_nuances_and_conditions" | ViewpointField) => void;
  onDeleteItem: (
    field: "key_nuances_and_conditions" | ViewpointField,
    index: number
  ) => void;
}

const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <h5 className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
    {icon}
    {title}
  </h5>
);

export const ContextualBriefingDisplay: React.FC<
  ContextualBriefingDisplayProps
> = ({
  briefing,
  isEditMode,
  onFieldChange,
  onListItemChange,
  onViewpointChange,
  onAddItem,
  onDeleteItem,
}) => {
  return (
    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="contextual-briefing" className="border-b-0">
          <AccordionTrigger className="hover:no-underline p-0">
            <h4 className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300">
              <Library className="w-4 h-4 mr-3 text-purple-500" />
              5-Angle Contextual Briefing
            </h4>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-0 pl-7 space-y-6">
            {/* Overall Summary */}
            <div>
              <SectionHeader
                icon={<Sparkles className="w-4 h-4 mr-3 text-purple-400" />}
                title="Overall Summary"
              />
              <EditableField
                isEditing={isEditMode}
                value={briefing.overall_summary || ""}
                onChange={(newValue) =>
                  onFieldChange("overall_summary", newValue)
                }
                isTextarea
                className="text-sm text-slate-600 dark:text-slate-400"
              />
            </div>

            {/* Broader Context */}
            <div>
              <SectionHeader
                icon={<Scale className="w-4 h-4 mr-3 text-purple-400" />}
                title="Broader Context"
              />
              <EditableField
                isEditing={isEditMode}
                value={briefing.broader_context || ""}
                onChange={(newValue) =>
                  onFieldChange("broader_context", newValue)
                }
                isTextarea
                className="text-sm text-slate-600 dark:text-slate-400"
              />
            </div>

            {/* Key Nuances & Conditions */}
            <div>
              <SectionHeader
                icon={<Sparkles className="w-4 h-4 mr-3 text-purple-400" />}
                title="Key Nuances & Conditions"
              />
              <ul className="list-none space-y-2">
                {briefing.key_nuances_and_conditions?.map((nuance, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-purple-500">▪</span>
                    <EditableField
                      isEditing={isEditMode}
                      value={nuance}
                      onChange={(newValue) =>
                        onListItemChange(
                          "key_nuances_and_conditions",
                          i,
                          newValue
                        )
                      }
                      isTextarea
                      className="flex-1"
                      onDelete={
                        isEditMode
                          ? () => onDeleteItem("key_nuances_and_conditions", i)
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onAddItem("key_nuances_and_conditions")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Nuance
                </Button>
              )}
            </div>

            {/* Viewpoints */}
            {(briefing.supporting_viewpoints ||
              briefing.challenging_viewpoints) &&
              [
                {
                  title: "Supporting Viewpoints",
                  icon: <BookCheck className="w-4 h-4 mr-3 text-green-500" />,
                  data: briefing.supporting_viewpoints,
                  field: "supporting_viewpoints" as ViewpointField,
                },
                {
                  title: "Challenging Viewpoints",
                  icon: <BookX className="w-4 h-4 mr-3 text-red-500" />,
                  data: briefing.challenging_viewpoints,
                  field: "challenging_viewpoints" as ViewpointField,
                },
              ].map(({ title, icon, data, field }) => (
                <div key={field}>
                  <SectionHeader icon={icon} title={title} />
                  <div className="space-y-4">
                    {data?.map((vp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                      >
                        <EditableField
                          isEditing={isEditMode}
                          value={vp.perspective}
                          onChange={(newValue) =>
                            onViewpointChange(field, i, "perspective", newValue)
                          }
                          isTextarea
                          className="italic text-slate-700 dark:text-slate-300"
                          onDelete={
                            isEditMode
                              ? () => onDeleteItem(field, i)
                              : undefined
                          }
                        />
                        <div className="flex items-center mt-2">
                          <LinkIcon className="h-3 w-3 mr-2 text-slate-400" />
                          <EditableField
                            isEditing={isEditMode}
                            value={vp.source}
                            onChange={(newValue) =>
                              onViewpointChange(field, i, "source", newValue)
                            }
                            className="text-xs text-slate-500 dark:text-slate-400 font-medium"
                            placeholder="Source"
                          />
                          <span className="mx-2 text-slate-400">|</span>
                          <EditableField
                            isEditing={isEditMode}
                            value={vp.url}
                            onChange={(newValue) =>
                              onViewpointChange(field, i, "url", newValue)
                            }
                            className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
                            placeholder="URL"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {isEditMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => onAddItem(field)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" /> Add Viewpoint
                    </Button>
                  )}
                </div>
              ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
