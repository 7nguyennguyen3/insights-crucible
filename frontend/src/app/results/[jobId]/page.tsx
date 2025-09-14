"use client";

import { useAuthStore } from "@/store/authStore";
import { useParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";

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
import { Check, Copy, Loader2, ChevronUp } from "lucide-react";

// Interfaces
import {
  // LearningAcceleratorSection, // TODO: Fix missing type
  DeepDiveSection,
} from "@/app/_global/interface";

// Custom Hooks
import { LearningAcceleratorView } from "@/app/components/analysis/LearningAcceleratorView";
import DeepDiveView from "@/app/components/analysis/DeepDiveView";
import { UnifiedQuizDisplay } from "@/components/analysis/UnifiedQuizDisplay";
import { useDocxExport } from "@/hooks/useDocxExport";
import { useJobData } from "@/hooks/useJobData";
import { OpenEndedResults } from "@/types/job";
import { useMarkdownExport } from "@/hooks/useMarkdownExport";
import { useShareDialog } from "@/hooks/useShareDialog";
import { useSimplePdfExport } from "@/hooks/useSimplePdfExport";

// Utils
import { getStructuredTranscript } from "@/lib/utils/transcriptParser";

const ResultsPage = () => {
  const { user, loading: authLoading } = useAuthStore();
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
    handleTakeawayChange,
    handleAddTakeaway,
    handleDeleteTakeaway,
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

  // Get structured transcript, parsing raw transcript if structured version not available
  const structuredTranscript = getStructuredTranscript(jobData);

  // Scroll to top button state and logic
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
    };

    // Throttle scroll events for performance
    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll);
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
        transcript={structuredTranscript}
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
            hasTranscript={!!structuredTranscript?.length}
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
          {/* Learning Assessment - Quiz Questions */}
          {(jobData.generated_quiz_questions &&
            (jobData.generated_quiz_questions.questions?.length > 0 || (jobData.generated_quiz_questions.open_ended_questions?.length || 0) > 0)) && (
            <div className="mb-12">
              {/* Learning Philosophy Note */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                  The difficulty is where the learning happens. These questions help your brain actively process and connect information.
                </p>
                <blockquote className="text-sm text-gray-700 dark:text-gray-300 border-l-2 border-gray-400 dark:border-gray-500 pl-3 italic">
                  "Difficulties in learning are desirable when they trigger processes that support learning and remembering." — Robert Bjork
                </blockquote>
              </div>

              <UnifiedQuizDisplay
                multipleChoiceQuestions={jobData.generated_quiz_questions.questions || []}
                openEndedQuestions={jobData.generated_quiz_questions.open_ended_questions || []}
                mcqEstimatedTimeMinutes={jobData.generated_quiz_questions.quiz_metadata?.estimated_time_minutes}
                oeEstimatedTimeMinutes={
                  jobData.generated_quiz_questions.quiz_metadata?.total_open_ended_questions 
                    ? jobData.generated_quiz_questions.quiz_metadata.total_open_ended_questions * 5 
                    : undefined
                }
                isEditMode={isEditMode}
                onMcqQuestionChange={handleQuizQuestionChange}
                onMcqAddQuestion={handleAddQuizQuestion}
                onMcqDeleteQuestion={handleDeleteQuizQuestion}
                userId={user?.uid || ""}
                jobId={jobId}
                existingQuizResults={jobData.quiz_results || null}
                existingOpenEndedResults={jobData.open_ended_results || null}
              />
            </div>
          )}


          {/* Analysis Sections */}
          <div className="my-12">
            <h2
              className="text-2xl font-bold text-slate-700 
            dark:text-slate-300 mb-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2"
            >
              {jobData?.request_data?.config?.analysis_persona === "deep_dive" ? "Analysis Sections" : "Learning Sections"}
            </h2>
          </div>

          {/* Conditional View based on Persona */}
          {jobData?.request_data?.config?.analysis_persona === "deep_dive" ? (
            <DeepDiveView
              results={jobData.results as DeepDiveSection[]}
              isEditMode={isEditMode}
              onFieldChange={handleFieldChange as any}
              onTakeawayChange={handleTakeawayChange as any}
              onAddTakeaway={handleAddTakeaway}
              onDeleteTakeaway={handleDeleteTakeaway}
            />
          ) : (
            <LearningAcceleratorView
              results={jobData.results as any[]}
              isEditMode={isEditMode}
              onFieldChange={handleFieldChange as any}
              onAddItem={handleAddItem as any}
              onDeleteItem={handleDeleteItem as any}
              onItemChange={handleItemChange as any}
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
          )}
        </div>
      </AnalysisPageLayout>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          variant="outline"
          className={`
            fixed bottom-6 right-6 z-50
            transition-all duration-300 ease-in-out
            shadow-xl hover:shadow-2xl
            bg-white/95 dark:bg-slate-800/95
            backdrop-blur-sm
            border border-slate-300/80 dark:border-slate-600/80
            hover:border-slate-400 dark:hover:border-slate-500
            hover:bg-white dark:hover:bg-slate-700
            hover:scale-110
            size-12 md:size-14
            rounded-full
            group
            ring-1 ring-slate-200/50 dark:ring-slate-700/50
          `}
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform duration-200" />
        </Button>
      )}

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
