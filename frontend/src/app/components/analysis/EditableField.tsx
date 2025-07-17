"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// -- NEW: Import ReactMarkdown and its GFM plugin
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
        onClick={handleWrapperClick}
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

  // --- NEW DISPLAY MODE LOGIC ---
  // When not editing, render the value using ReactMarkdown to process formatting.
  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Override the default <p> tag to avoid extra margins in a tweet
          p: ({ node, ...props }) => <span {...props} />,
        }}
      >
        {value || placeholder || ""}
      </ReactMarkdown>
    </div>
  );
};
