"use client";

import React from "react";
import { ArgumentStructure } from "@/app/_global/interface";
import { Button } from "@/components/ui/button";
import { Library, PlusCircle, Scale } from "lucide-react";
import { EditableField } from "./EditableField";

interface ArgumentStructureCardProps {
  structure: ArgumentStructure;
  isEditMode: boolean;
  onFieldChange: (field: "main_thesis", value: string) => void;
  onListChange: (
    field: "supporting_arguments" | "counterarguments_mentioned",
    index: number,
    value: string
  ) => void;
  onAddItem: (
    field: "supporting_arguments" | "counterarguments_mentioned"
  ) => void;
  onDeleteItem: (
    field: "supporting_arguments" | "counterarguments_mentioned",
    index: number
  ) => void;
}

export const ArgumentStructureCard: React.FC<ArgumentStructureCardProps> = ({
  structure,
  isEditMode,
  onFieldChange,
  onListChange,
  onAddItem,
  onDeleteItem,
}) => {
  if (!structure && !isEditMode) {
    return null;
  }

  const data = structure || {
    main_thesis: "",
    supporting_arguments: [],
    counterarguments_mentioned: [],
  };

  return (
    <div className="mb-12 p-6 bg-white dark:bg-slate-900/70 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Argument & Thesis Breakdown
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        A high-level deconstruction of the document's logical framework.
      </p>

      {/* Main Thesis */}
      <div className="mb-6">
        <h3 className="flex items-center text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">
          <Library className="w-5 h-5 mr-3 text-purple-500" />
          Main Thesis
        </h3>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <EditableField
            isEditing={isEditMode}
            value={data.main_thesis}
            onChange={(value) => onFieldChange("main_thesis", value)}
            isTextarea
            placeholder="The core argument will be displayed here..."
            className="text-slate-700 dark:text-slate-300 leading-relaxed"
          />
        </div>
      </div>

      {/* Supporting & Counterarguments */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="flex items-center text-lg font-semibold mb-3">
            <Scale className="w-5 h-5 mr-3 text-green-500" />
            Supporting Arguments
          </h4>
          <div className="space-y-2">
            {data.supporting_arguments.map((arg, index) => (
              <EditableField
                key={`support-${index}`}
                isEditing={isEditMode}
                value={arg}
                onChange={(value) =>
                  onListChange("supporting_arguments", index, value)
                }
                onDelete={() => onDeleteItem("supporting_arguments", index)}
                isTextarea
                className="text-sm"
              />
            ))}
          </div>
          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onAddItem("supporting_arguments")}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Argument
            </Button>
          )}
        </div>
        <div>
          <h4 className="flex items-center text-lg font-semibold mb-3">
            <Scale className="w-5 h-5 mr-3 text-red-500" />
            Counterarguments
          </h4>
          <div className="space-y-2">
            {data.counterarguments_mentioned.map((arg, index) => (
              <EditableField
                key={`counter-${index}`}
                isEditing={isEditMode}
                value={arg}
                onChange={(value) =>
                  onListChange("counterarguments_mentioned", index, value)
                }
                onDelete={() =>
                  onDeleteItem("counterarguments_mentioned", index)
                }
                isTextarea
                className="text-sm"
              />
            ))}
          </div>
          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onAddItem("counterarguments_mentioned")}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Counterargument
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
