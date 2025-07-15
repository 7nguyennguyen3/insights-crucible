"use client";

import { ContextualBriefing, Viewpoint } from "@/app/_global/interface";
import { Button } from "@/components/ui/button";
// NEW: Import Accordion components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookCheck,
  BookX,
  Library,
  Scale,
  Sparkles,
  Info,
  Link as LinkIcon,
  PlusCircle,
} from "lucide-react";
import { EditableField } from "./EditableField";

// Interface and Type definitions remain the same
interface ContextualBriefingDisplayProps {
  briefing: ContextualBriefing;
  claimText: string;
  isEditMode: boolean;
  onFieldChange: (field: keyof ContextualBriefing, value: string) => void;
  onListItemChange: (
    field: "key_nuances_and_conditions",
    index: number,
    value: string
  ) => void;
  onViewpointChange: (
    field: "supporting_viewpoints" | "challenging_viewpoints",
    index: number,
    prop: keyof Viewpoint,
    value: string
  ) => void;
  onAddItem: (
    field:
      | "key_nuances_and_conditions"
      | "supporting_viewpoints"
      | "challenging_viewpoints"
  ) => void;
  onDeleteItem: (
    field:
      | "key_nuances_and_conditions"
      | "supporting_viewpoints"
      | "challenging_viewpoints",
    index: number
  ) => void;
}

// Sub-components (SectionHeader, ViewpointCard) remain the same
const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <h5 className="flex items-center text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">
    {icon}
    <span className="ml-3">{title}</span>
  </h5>
);

const ViewpointCard = ({
  vp,
  field,
  index,
  isEditMode,
  onViewpointChange,
  onDeleteItem,
}: {
  vp: Viewpoint;
  field: "supporting_viewpoints" | "challenging_viewpoints";
  index: number;
  isEditMode: boolean;
  onViewpointChange: ContextualBriefingDisplayProps["onViewpointChange"];
  onDeleteItem: ContextualBriefingDisplayProps["onDeleteItem"];
}) => (
  <div className="p-4 rounded-lg border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
    <EditableField
      isEditing={isEditMode}
      value={vp.perspective}
      onChange={(newValue) =>
        onViewpointChange(field, index, "perspective", newValue)
      }
      isTextarea
      className="italic text-slate-700 dark:text-slate-300"
      onDelete={isEditMode ? () => onDeleteItem(field, index) : undefined}
    />
    <div className="flex items-center mt-3 text-xs text-slate-500 dark:text-slate-400">
      <LinkIcon className="h-3 w-3 mr-2" />
      <EditableField
        isEditing={isEditMode}
        value={vp.source}
        onChange={(newValue) =>
          onViewpointChange(field, index, "source", newValue)
        }
        placeholder="Source"
        className="font-medium"
      />
      {vp.url && (
        <>
          <span className="mx-2">|</span>
          <a
            href={vp.url.startsWith("http") ? vp.url : `https://${vp.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline min-w-0"
          >
            <EditableField
              isEditing={isEditMode}
              value={vp.url}
              onChange={(newValue) =>
                onViewpointChange(field, index, "url", newValue)
              }
              placeholder="URL"
              className="break-words"
            />
          </a>
        </>
      )}
    </div>
  </div>
);

// --- Main Component (Redesigned as a single, collapsible Accordion) ---
export const ContextualBriefingDisplay: React.FC<
  ContextualBriefingDisplayProps
> = ({
  briefing,
  claimText,
  isEditMode,
  onFieldChange,
  onListItemChange,
  onViewpointChange,
  onAddItem,
  onDeleteItem,
}) => {
  if (!briefing || Object.keys(briefing).length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="contextual-briefing" className="border-b-0">
        <AccordionTrigger className="hover:no-underline">
          {/* The main title is now the AccordionTrigger */}
          <h3 className="flex items-center text-xl font-bold text-slate-800 dark:text-slate-100">
            <Library className="w-6 h-6 mr-3 text-purple-500" />
            Contextual Briefing
          </h3>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-6">
          {/* Subtitle with the claim being investigated */}
          {claimText && (
            <p className="text-sm text-slate-600 dark:text-slate-400 border-l-4 border-purple-200 dark:border-purple-800 pl-4">
              Investigating the claim: "{claimText}"
            </p>
          )}

          {/* Always-Visible Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <SectionHeader
                icon={<Sparkles className="w-5 h-5 text-purple-400" />}
                title="Overall Summary"
              />
              <EditableField
                isEditing={isEditMode}
                value={briefing.overall_summary || ""}
                onChange={(newValue) =>
                  onFieldChange("overall_summary", newValue)
                }
                isTextarea
                className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
              />
            </div>
            <div>
              <SectionHeader
                icon={<Scale className="w-5 h-5 text-purple-400" />}
                title="Broader Context"
              />
              <EditableField
                isEditing={isEditMode}
                value={briefing.broader_context || ""}
                onChange={(newValue) =>
                  onFieldChange("broader_context", newValue)
                }
                isTextarea
                className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
              />
            </div>
          </div>

          {/* Tabbed Interface for Details */}
          <Tabs
            defaultValue="nuances"
            className="w-full pt-6 border-t border-slate-200 dark:border-slate-700"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="nuances">Key Nuances</TabsTrigger>
              <TabsTrigger value="supporting">Supporting</TabsTrigger>
              <TabsTrigger value="challenging">Challenging</TabsTrigger>
            </TabsList>

            <TabsContent value="nuances" className="mt-4">
              <ul className="list-none space-y-3">
                {briefing.key_nuances_and_conditions?.map((nuance, i) => (
                  <li key={i} className="flex items-start">
                    <Info className="h-4 w-4 mr-3 mt-1 text-purple-400 flex-shrink-0" />
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
                      className="flex-1 text-sm text-slate-600 dark:text-slate-400"
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
                  className="mt-4"
                  onClick={() => onAddItem("key_nuances_and_conditions")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Nuance
                </Button>
              )}
            </TabsContent>

            <TabsContent value="supporting" className="mt-4">
              <div className="space-y-4">
                {briefing.supporting_viewpoints?.map((vp, i) => (
                  <ViewpointCard
                    key={i}
                    vp={vp}
                    field="supporting_viewpoints"
                    index={i}
                    isEditMode={isEditMode}
                    onViewpointChange={onViewpointChange}
                    onDeleteItem={onDeleteItem}
                  />
                ))}
              </div>
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => onAddItem("supporting_viewpoints")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Supporting
                  Viewpoint
                </Button>
              )}
            </TabsContent>

            <TabsContent value="challenging" className="mt-4">
              <div className="space-y-4">
                {briefing.challenging_viewpoints?.map((vp, i) => (
                  <ViewpointCard
                    key={i}
                    vp={vp}
                    field="challenging_viewpoints"
                    index={i}
                    isEditMode={isEditMode}
                    onViewpointChange={onViewpointChange}
                    onDeleteItem={onDeleteItem}
                  />
                ))}
              </div>
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => onAddItem("challenging_viewpoints")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Challenging
                  Viewpoint
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
