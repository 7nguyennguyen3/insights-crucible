"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditableField } from "./EditableField";

interface AnalysisHeaderProps {
  jobId: string;
  jobTitle?: string;
  isPublicPage: boolean;
  isEditMode: boolean;
  onTitleChange: (newTitle: string) => void;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({
  jobTitle,
  jobId,
  isPublicPage,
  isEditMode,
  onTitleChange,
}) => {
  return (
    <div className="flex items-center gap-4 flex-1">
      {!isPublicPage && (
        <Link href="/dashboard" aria-label="Back to Dashboard">
          <div className="flex-shrink-0 w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
            <ArrowLeft className="h-6 w-6 text-slate-500" />
          </div>
        </Link>
      )}
      <div className="flex-1">
        <EditableField
          isEditing={isEditMode}
          value={jobTitle || ""}
          onChange={onTitleChange}
          placeholder="Enter analysis title..."
          className="font-bold text-2xl tracking-tight text-slate-900 dark:text-slate-50 w-full border-none focus:ring-0"
        />
        {!isPublicPage && (
          <p className="text-xs font-mono text-slate-400 mt-1">
            Job ID: {jobId}
          </p>
        )}
      </div>
    </div>
  );
};
