// components/layout/AnalysisPageLayout.tsx

"use client";

import { Utterance } from "@/app/_global/interface"; // Import from your single, unified interface file
import { FullTranscriptDisplay } from "@/app/components/analysis/FullTranscriptDisplay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";

interface AnalysisPageLayoutProps {
  isLoading: boolean;
  jobTitle?: string;
  transcript?: Utterance[];
  header: React.ReactNode;
  actionButtons: React.ReactNode;
  children: React.ReactNode; // This will hold the specific report view
}

export interface AnalysisPageLayoutRef {
  openTranscriptDialog: () => void;
}

export const AnalysisPageLayout = forwardRef<
  AnalysisPageLayoutRef,
  AnalysisPageLayoutProps
>(
  (
    { isLoading, jobTitle, transcript, header, actionButtons, children },
    ref
  ) => {
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
    const [hasCopiedTranscript, setHasCopiedTranscript] = useState(false);

    useImperativeHandle(ref, () => ({
      openTranscriptDialog: () => setIsTranscriptOpen(true),
    }));

    const handleCopyTranscript = () => {
      if (!transcript || transcript.length === 0) {
        toast.error("No transcript available to copy.");
        return;
      }
      // Your existing copy logic...
      let transcriptString = `## Full Transcript for ${
        jobTitle || "Analysis"
      }\n\n`;
      transcript.forEach((utterance: Utterance) => {
        transcriptString += `**${utterance.speaker}:** ${utterance.text}\n\n`;
      });
      navigator.clipboard.writeText(transcriptString);
      setHasCopiedTranscript(true);
      toast.success("Transcript copied to clipboard!");
      setTimeout(() => setHasCopiedTranscript(false), 2500);
    };

    if (isLoading) {
      // Your existing loading skeleton UI...
      return <div>Loading...</div>;
    }

    return (
      <>
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen w-full p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-12">
            <header className="mb-10">
              <div className="flex justify-between items-center flex-wrap gap-4">
                {header}
                {actionButtons}
              </div>
            </header>

            {/* This is where the specific view (General or Consultant) will be rendered */}
            <main>{children}</main>
          </div>
        </div>

        <Dialog open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
          {/* Your existing Dialog component for showing the transcript */}
          <DialogContent className="w-[95vw] max-w-[95vw] md:w-full md:max-w-5xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl">Full Transcript</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-4 -mr-6">
              {transcript && <FullTranscriptDisplay transcript={transcript} />}
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button
                onClick={handleCopyTranscript}
                disabled={!transcript || transcript.length === 0}
              >
                {hasCopiedTranscript ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {hasCopiedTranscript ? "Copied!" : "Copy Transcript"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

AnalysisPageLayout.displayName = "AnalysisPageLayout";
