"use client";

import { useAuthStore } from "@/store/authStore";
import { useParams } from "next/navigation";
import { useRef } from "react";

// UI Components
import { AnalysisActionButtons } from "@/app/components/analysis/AnalysisActionButtons";
import { AnalysisHeader } from "@/app/components/analysis/AnalysisHeader";
import {
  AnalysisPageLayout,
  AnalysisPageLayoutRef,
} from "@/app/components/analysis/AnalysisPageLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Loader2 } from "lucide-react";

// Interfaces
import {
  LearningAcceleratorSection,
} from "@/app/_global/interface";

// Custom Hooks
import { LearningAcceleratorView } from "@/app/components/analysis/LearningAcceleratorView";
import { QuizQuestionsDisplay } from "@/app/components/analysis/QuizQuestionsDisplay";
import { useDocxExport } from "@/hooks/useDocxExport";
import { useJobData } from "@/hooks/useJobData";
import { useMarkdownExport } from "@/hooks/useMarkdownExport";
import { useShareDialog } from "@/hooks/useShareDialog";
import { useSimplePdfExport } from "@/hooks/useSimplePdfExport";

const ResultsPage = () => {
  const { loading: authLoading } = useAuthStore();
  const params = useParams();
  const jobId = params.jobId as string;
  const layoutRef = useRef<AnalysisPageLayoutRef>(null);

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
    handleAddEntity,
    handleDeleteEntity,
    handleEntityChange,
    handleLessonChange,
    handleAddLesson,
    handleDeleteLesson,
    handleQuoteChange,
    handleAddQuote,
    handleDeleteQuote,
    handleQuizQuestionChange,
    handleAddQuizQuestion,
    handleDeleteQuizQuestion,
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
          {/* Learning Accelerator Quiz Questions */}
          {(jobData.learning_synthesis?.quiz_questions || jobData.generated_quiz_questions?.questions) && (
            <div className="mb-12">
              <QuizQuestionsDisplay
                questions={jobData.learning_synthesis?.quiz_questions || jobData.generated_quiz_questions?.questions || []}
                estimatedTimeMinutes={jobData.generated_quiz_questions?.quiz_metadata?.estimated_time_minutes}
                totalQuestions={jobData.generated_quiz_questions?.quiz_metadata?.total_questions}
                isEditMode={isEditMode}
                onQuestionChange={handleQuizQuestionChange}
                onAddQuestion={handleAddQuizQuestion}
                onDeleteQuestion={handleDeleteQuizQuestion}
              />
            </div>
          )}

          {/* Learning Sections Header */}
          <div className="my-12">
            <h2
              className="text-2xl font-bold text-slate-700 
            dark:text-slate-300 mb-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2"
            >
              Learning Sections
            </h2>
          </div>

          {/* Learning Accelerator View */}
          <LearningAcceleratorView
            results={jobData.results as LearningAcceleratorSection[]}
            isEditMode={isEditMode}
            onFieldChange={handleFieldChange as any}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onItemChange={handleItemChange}
            onAddEntity={handleAddEntity}
            onDeleteEntity={handleDeleteEntity}
            onEntityChange={handleEntityChange}
            onLessonChange={handleLessonChange}
            onAddLesson={handleAddLesson}
            onDeleteLesson={handleDeleteLesson}
            onQuoteChange={handleQuoteChange}
            onAddQuote={handleAddQuote}
            onDeleteQuote={handleDeleteQuote}
          />
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
