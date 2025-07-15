"use client";

import React, { useRef } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2 } from "lucide-react";
import {
  AnalysisPageLayout,
  AnalysisPageLayoutRef,
} from "@/app/components/analysis/AnalysisPageLayout";
import { AnalysisActionButtons } from "@/app/components/analysis/AnalysisActionButtons";
import { ConsultantReportView } from "@/app/components/analysis/ConsultantReportView";
import { ContextualBriefingDisplay } from "@/app/components/analysis/ContextualBriefingDisplay";
import { AnalysisHeader } from "@/app/components/analysis/AnalysisHeader";
import { GeneralReportView } from "@/app/components/analysis/GeneralReportView";
import { SlideDeckDisplay } from "@/app/components/analysis/SlideDeckDisplay";
import { ExecutiveSynthesisView } from "@/app/components/analysis/synthesis-display/ExecutiveSynthesisView";

// Interfaces
import {
  ConsultantAnalysisSection,
  GeneralAnalysisSection,
} from "@/app/_global/interface";

// Custom Hooks
import { useJobData } from "@/hooks/useJobData";
import { useShareDialog } from "@/hooks/useShareDialog";
import { useMarkdownExport } from "@/hooks/useMarkdownExport";
import { useSimplePdfExport } from "@/hooks/useSimplePdfExport";
import { useDocxExport } from "@/hooks/useDocxExport";
import { ArgumentStructureCard } from "@/app/components/analysis/ArgumentStructureCard";
import { BlogPostDisplay } from "@/app/components/analysis/BlogPostDisplay";
import { XThreadDisplay } from "@/app/components/analysis/XThreadDisplay";

const ResultsPage = () => {
  const { loading: authLoading } = useAuthStore();
  const params = useParams();
  const jobId = params.jobId as string;
  const layoutRef = useRef<AnalysisPageLayoutRef>(null);

  // --- 1. Call your main data hook ---
  const {
    jobData,
    isLoading,
    error,
    isEditMode,
    setIsEditMode,
    originalData,
    mutate,
    handleSave,
    handleCancel,
    handleTitleChange,
    handleSynthesisChange,
    handleSynthesisListChange,
    handleSynthesisContradictionChange,
    handleSynthesisAddItem,
    handleSynthesisDeleteItem,
    handleFieldChange,
    handleAddItem,
    handleDeleteItem,
    handleItemChange,
    handleQaChange,
    handleContextualBriefingChange,
    handleContextualBriefingAddItem,
    handleContextualBriefingDeleteItem,
    handleContextualBriefingListItemChange,
    handleContextualBriefingViewpointChange,
    handleAddSlide,
    handleDeleteSlide,
    handleSlideTitleChange,
    handleAddBullet,
    handleDeleteBullet,
    handleSlideChange,
    handleArgumentStructureFieldChange,
    handleArgumentStructureListChange,
    handleArgumentStructureAddItem,
    handleArgumentStructureDeleteItem,
    handleBlogPostChange,
    handleXThreadAddItem,
    handleXThreadChange,
    handleXThreadDeleteItem,
  } = useJobData(jobId);

  // --- 2. Call your other hooks, passing in values from useJobData ---
  const { exportToMarkdown } = useMarkdownExport(jobData!);
  const { exportToPdf } = useSimplePdfExport(jobData!);
  const { exportToDocx } = useDocxExport(jobData!);
  const {
    isShareDialogOpen,
    setIsShareDialogOpen,
    shareUrl,
    isLinkLoading,
    hasCopied,
    handleCreateShareLink,
    handleRevokeShareLink,
    copyShareLinkToClipboard,
  } = useShareDialog(
    jobId,
    originalData?.isPublic,
    originalData?.publicShareId,
    mutate
  );

  // --- 3. Loading and Error states ---
  const persona = jobData?.request_data?.config?.analysis_persona || "general";

  if (authLoading || isLoading || !jobData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading analysis. Please try again.</div>;
  }

  const claimForBriefing = jobData.global_contextual_briefing?.claim_text;

  return (
    <>
      <AnalysisPageLayout
        ref={layoutRef}
        isLoading={isLoading}
        jobTitle={jobData?.job_title}
        transcript={jobData?.structured_transcript}
        header={
          <AnalysisHeader
            isPublicPage={false}
            jobId={jobId}
            jobTitle={jobData?.job_title}
            isEditMode={isEditMode}
            onTitleChange={handleTitleChange}
          />
        }
        actionButtons={
          <AnalysisActionButtons
            isPublicPage={false}
            hasData={!!jobData}
            hasTranscript={!!jobData?.structured_transcript?.length}
            onShowTranscript={() => layoutRef.current?.openTranscriptDialog()}
            onExportMarkdown={exportToMarkdown}
            onShare={() => setIsShareDialogOpen(true)}
            isEditMode={isEditMode}
            onEdit={() => setIsEditMode(true)}
            onSave={handleSave}
            onCancel={handleCancel}
            onExportPdf={exportToPdf}
            onExportDocx={exportToDocx}
          />
        }
      >
        <div id="analysis-report-content">
          {/* Step 1: Render the top-level card based on persona */}
          {persona === "consultant" && jobData.synthesis_results && (
            <div className="mb-12">
              <ExecutiveSynthesisView
                synthesis={jobData.synthesis_results}
                isEditMode={isEditMode}
                onSynthesisChange={handleSynthesisChange}
                onSynthesisListChange={handleSynthesisListChange}
                onSynthesisContradictionChange={
                  handleSynthesisContradictionChange
                }
                onSynthesisAddItem={handleSynthesisAddItem}
                onSynthesisDeleteItem={handleSynthesisDeleteItem}
              />
            </div>
          )}

          {persona === "general" && jobData.argument_structure && (
            <div className="mb-12">
              <ArgumentStructureCard
                structure={jobData.argument_structure}
                isEditMode={isEditMode}
                onFieldChange={handleArgumentStructureFieldChange}
                onListChange={handleArgumentStructureListChange}
                onAddItem={handleArgumentStructureAddItem}
                onDeleteItem={handleArgumentStructureDeleteItem}
              />
            </div>
          )}

          {/* Step 2: Render the Global Briefing right after the top-level card */}
          {jobData.global_contextual_briefing &&
            Object.keys(jobData.global_contextual_briefing).length > 0 && (
              <div className="mb-12 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800">
                <ContextualBriefingDisplay
                  briefing={jobData.global_contextual_briefing.briefing_data}
                  claimText={claimForBriefing || "the document's central claim"} // <-- PASS THE PROP
                  isEditMode={isEditMode}
                  onFieldChange={handleContextualBriefingChange}
                  onListItemChange={handleContextualBriefingListItemChange}
                  onViewpointChange={handleContextualBriefingViewpointChange}
                  onAddItem={handleContextualBriefingAddItem}
                  onDeleteItem={handleContextualBriefingDeleteItem}
                />
              </div>
            )}

          {/* Render Blog Post */}
          {jobData.generated_blog_post && (
            <div className="mb-12">
              <BlogPostDisplay
                content={jobData.generated_blog_post}
                isEditMode={isEditMode}
                onChange={handleBlogPostChange}
              />
            </div>
          )}

          {/* Render X/Twitter Thread */}
          {jobData.generated_overall_x_thread && (
            <div className="mb-12">
              <XThreadDisplay
                thread={jobData.generated_overall_x_thread}
                isEditMode={isEditMode}
                onChange={handleXThreadChange}
                onAddItem={handleXThreadAddItem}
                onDeleteItem={handleXThreadDeleteItem}
              />
            </div>
          )}
          {/* Step 3: Add the header for the detailed section list */}
          <div className="my-12">
            <h2
              className="text-2xl font-bold text-slate-700 
            dark:text-slate-300 mb-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2"
            >
              Detailed Section Analysis
            </h2>
          </div>
          {persona === "consultant" ? (
            <>
              <ConsultantReportView
                results={jobData.results as ConsultantAnalysisSection[]}
                isEditMode={isEditMode}
                onFieldChange={handleFieldChange as any}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                onItemChange={handleItemChange}
              />
              {jobData.generated_slide_outline && (
                <div className="mt-12">
                  <SlideDeckDisplay
                    slides={jobData.generated_slide_outline}
                    isEditMode={isEditMode}
                    onAddSlide={handleAddSlide}
                    onDeleteSlide={handleDeleteSlide}
                    onSlideTitleChange={handleSlideTitleChange}
                    onAddBullet={handleAddBullet}
                    onDeleteBullet={handleDeleteBullet}
                    onSlideChange={handleSlideChange}
                  />
                </div>
              )}
            </>
          ) : (
            <GeneralReportView
              results={jobData.results as GeneralAnalysisSection[]}
              isEditMode={isEditMode}
              onFieldChange={handleFieldChange as any}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onItemChange={handleItemChange}
              onQaChange={handleQaChange}
            />
          )}
        </div>
      </AnalysisPageLayout>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Analysis</DialogTitle>
            <DialogDescription>
              {shareUrl
                ? "Anyone with this link can view the analysis. Revoke access to make it private again."
                : "Generate a public link to share a read-only version of this analysis."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {shareUrl ? (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 p-2 border rounded-md bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                  <Button
                    onClick={copyShareLinkToClipboard}
                    size="icon"
                    variant="outline"
                  >
                    {hasCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleRevokeShareLink}
                  disabled={isLinkLoading}
                >
                  {isLinkLoading ? "Revoking..." : "Revoke Public Link"}
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={handleCreateShareLink}
                disabled={isLinkLoading}
              >
                {isLinkLoading ? "Generating..." : "Generate Public Link"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResultsPage;
