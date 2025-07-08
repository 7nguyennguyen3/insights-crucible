"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, FileText, Share2, Pencil, Save, FileDown } from "lucide-react";

interface AnalysisActionButtonsProps {
  isPublicPage: boolean;
  hasTranscript: boolean;
  hasData: boolean;
  onShowTranscript: () => void;
  onExportMarkdown: () => void;
  onShare?: () => void;
  isEditMode: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onExportToPowerPoint?: () => void;
}

export const AnalysisActionButtons: React.FC<AnalysisActionButtonsProps> = ({
  isPublicPage,
  hasTranscript,
  hasData,
  onShowTranscript,
  onExportMarkdown,
  onShare,
  isEditMode,
  onEdit,
  onSave,
  onCancel,
  onExportToPowerPoint,
}) => {
  if (isPublicPage) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onShowTranscript}
          disabled={!hasTranscript}
        >
          <FileText className="h-4 w-4 mr-2" />
          Show Transcript
        </Button>
        {/* Button is present in the public view */}
        <Button
          variant="outline"
          onClick={onExportMarkdown}
          disabled={!hasData}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy as Markdown
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {isEditMode ? (
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </>
      ) : (
        <>
          <Button onClick={onEdit} disabled={!hasData}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Analysis
          </Button>

          {onExportToPowerPoint && (
            <Button
              variant="outline"
              onClick={onExportToPowerPoint}
              disabled={!hasData}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {onShare && (
            <Button variant="outline" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}

          {/* Button is NOW ALSO present in the private (non-public) view */}
          <Button
            variant="outline"
            onClick={onExportMarkdown}
            disabled={!hasData}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy as Markdown
          </Button>

          <Button
            variant="outline"
            onClick={onShowTranscript}
            disabled={!hasTranscript}
          >
            <FileText className="h-4 w-4 mr-2" />
            Show Transcript
          </Button>
        </>
      )}
    </div>
  );
};
