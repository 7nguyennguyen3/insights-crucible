"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, FileText, Share2, Pencil, Save, FileDown, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onExportPdf: () => void;
  onExportDocx: () => void;
  onSaveAnalysis?: () => void;
  isSavingAnalysis?: boolean;
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
  onExportDocx,
  onExportPdf,
  onSaveAnalysis,
  isSavingAnalysis,
}) => {
  if (isPublicPage) {
    return (
      <div className="flex items-center gap-2">
        {/* Save to Dashboard Button */}
        {onSaveAnalysis && (
          <Button
            variant="default"
            onClick={onSaveAnalysis}
            disabled={!hasData || isSavingAnalysis}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Heart className="h-4 w-4 mr-2" />
            {isSavingAnalysis ? "Saving..." : "Save to Dashboard (0.5 credits)"}
          </Button>
        )}

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
              Public Sharing
            </Button>
          )}

          {/* Button is NOW ALSO present in the private (non-public) view */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!hasData}>
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportMarkdown}>
                <Copy className="h-4 w-4 mr-2" />
                Copy as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportDocx}>
                <FileText className="h-4 w-4 mr-2" />
                Download as Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Download as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
