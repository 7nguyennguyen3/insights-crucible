"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface EditableFieldProps {
  isEditing: boolean;
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  isTextarea?: boolean;
  placeholder?: string;
  onDelete?: () => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  isEditing,
  value,
  onChange,
  className,
  isTextarea = false,
  placeholder,
  onDelete,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
  };

  // --- THIS IS THE FIX ---
  // This stops the click from "bubbling up" to the AccordionTrigger
  // when the user is trying to edit the text.
  const handleWrapperClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
    }
  };

  if (isEditing) {
    const editClasses = `flex-1 bg-slate-100 dark:bg-slate-800 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`;

    return (
      <div
        className="flex items-center gap-2 w-full"
        onClick={handleWrapperClick} // Add the click handler here
      >
        {isTextarea ? (
          <Textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={editClasses}
            rows={3}
          />
        ) : (
          <Input
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={editClasses}
          />
        )}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50"
            aria-label="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Display mode
  return (
    <div className={className}>
      {value || (
        <span className="text-slate-400">{placeholder || "Empty"}</span>
      )}
    </div>
  );
};
