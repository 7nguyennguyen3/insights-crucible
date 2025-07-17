// app/components/XThreadDisplay.tsx

"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import React from "react";
import { FaTwitter } from "react-icons/fa6";
import { EditableField } from "./EditableField";

interface XThreadDisplayProps {
  thread: string[];
  isEditMode: boolean;
  onChange: (index: number, newValue: string) => void;
  onAddItem: () => void;
  onDeleteItem: (index: number) => void;
}

export const XThreadDisplay: React.FC<XThreadDisplayProps> = ({
  thread,
  isEditMode,
  onChange,
  onAddItem,
  onDeleteItem,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="x-thread" className="border-b-0">
          <AccordionTrigger className="p-6 text-left hover:no-underline">
            <div className="flex items-center space-x-3 w-full">
              <div className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                <FaTwitter className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                Generated X (Twitter) Thread
              </h3>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6 pt-0">
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-[3px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
              {thread.map((tweet, index) => (
                <div key={index} className="relative flex items-start gap-4">
                  <div className="absolute -left-[27px] top-2.5 h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                  <EditableField
                    isEditing={isEditMode}
                    value={tweet}
                    onChange={(newValue) => onChange(index, newValue)}
                    onDelete={() => onDeleteItem(index)}
                    isTextarea
                    className="flex-1 text-base text-slate-700 dark:text-slate-300 leading-relaxed"
                  />
                </div>
              ))}
            </div>
            {isEditMode && (
              <Button
                onClick={onAddItem}
                variant="outline"
                size="sm"
                className="mt-6 ml-1"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Tweet
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
