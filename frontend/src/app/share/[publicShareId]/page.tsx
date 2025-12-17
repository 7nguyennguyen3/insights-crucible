"use client";

import React, { useRef, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import apiClient from "@/lib/apiClient";
import { Loader2, ChevronUp } from "lucide-react";
import { JobData } from "@/app/_global/interface";
import { useMarkdownExport } from "@/hooks/useMarkdownExport";
import { useSaveAnalysis } from "@/hooks/useSaveAnalysis";
import { UnifiedQuizDisplay } from "@/components/analysis/UnifiedQuizDisplay";
import { Button } from "@/components/ui/button";

// Utils
import { getStructuredTranscript } from "@/lib/utils/transcriptParser";

// --- Layout & View Components ---
import {
  AnalysisPageLayout,
  AnalysisPageLayoutRef,
} from "@/app/components/analysis/AnalysisPageLayout";
import { AnalysisHeader } from "@/app/components/analysis/AnalysisHeader";
import { AnalysisActionButtons } from "@/app/components/analysis/AnalysisActionButtons";
import { SlideDeckDisplay } from "@/app/components/analysis/SlideDeckDisplay";
import DeepDiveView from "@/app/components/analysis/DeepDiveView";
import { PodcasterAnalysisView } from "@/app/components/podcaster/PodcasterAnalysisView";
import { ExecutiveSynthesisView } from "@/app/components/analysis/synthesis-display/ExecutiveSynthesisView";
import { ArgumentStructureCard } from "@/app/components/analysis/ArgumentStructureCard";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

const PublicSharePage = () => {
  const params = useParams();
  const publicShareId = params.publicShareId as string;
  const layoutRef = useRef<AnalysisPageLayoutRef>(null);

  // Fetch the data for the public analysis
  const { data, error, isLoading } = useSWR<JobData>(
    publicShareId ? `/public/analysis/${publicShareId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { exportToMarkdown } = useMarkdownExport(data || null);

  // Save analysis hook
  const { saveAnalysis, isLoading: isSavingAnalysis } = useSaveAnalysis({
    onSuccess: (response) => {
      // Hook will handle the success toast and navigation
    },
    onError: (error) => {
      // Hook will handle the error toast
    },
  });

  // Get structured transcript, parsing raw transcript if structured version not available
  const structuredTranscript = getStructuredTranscript(data);

  // Enhanced debug logging for transcript issues

  // Scroll to top button state and logic
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
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

    window.addEventListener("scroll", throttledHandleScroll);
    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Track view when the page loads
  useEffect(() => {
    if (publicShareId && data) {
      // Track the view (fire and forget)
      apiClient.post(`/library/view/${publicShareId}`).catch((error) => {
        console.warn("Could not track view:", error);
      });
    }
  }, [publicShareId, data]);

  const isEditMode = false;
  const emptyFunction = () => {};
  const emptyAsyncFunction = async () => {}; // For handlers that might be async

  // Handle save analysis
  const handleSaveAnalysis = () => {
    if (publicShareId && data) {
      saveAnalysis({
        publicShareId,
        customTitle: undefined, // Let the backend generate a default title
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>Could not load analysis. The link may be invalid or expired.</p>
      </div>
    );
  }

  const persona = data.request_data?.config?.analysis_persona || "deep_dive";

  return (
    <>
      <AnalysisPageLayout
        ref={layoutRef}
        isLoading={false}
        jobTitle={data.job_title}
        transcript={structuredTranscript}
        header={
          <AnalysisHeader
            isPublicPage={true}
            jobTitle={data.job_title}
            jobId={""}
            isEditMode={isEditMode}
            onTitleChange={emptyFunction}
          />
        }
        actionButtons={
          <AnalysisActionButtons
            isPublicPage={true}
            hasData={!!data}
            hasTranscript={!!structuredTranscript?.length}
            onShowTranscript={() => layoutRef.current?.openTranscriptDialog()}
            onExportMarkdown={exportToMarkdown}
            isEditMode={isEditMode}
            onEdit={emptyFunction}
            onSave={emptyAsyncFunction}
            onCancel={emptyFunction}
            onShare={emptyFunction}
            onExportDocx={emptyFunction}
            onExportPdf={emptyFunction}
            onSaveAnalysis={handleSaveAnalysis}
            isSavingAnalysis={isSavingAnalysis}
          />
        }
      >
        <div id="analysis-report-content">
          {/* Podcaster View - Show Notes */}
          {data?.request_data?.config?.analysis_persona === "podcaster" && data.show_notes && (
            <PodcasterAnalysisView
              showNotes={data.show_notes}
              sectionAnalyses={data.section_analyses}
            />
          )}

          {/* Deep Dive View */}
          {data?.request_data?.config?.analysis_persona === "deep_dive" && (
            <>
              {/* Learning Assessment - Quiz Questions */}
              {data.generated_quiz_questions &&
                (data.generated_quiz_questions.questions?.length > 0 ||
                  (data.generated_quiz_questions.open_ended_questions?.length ||
                    0) > 0) && (
                  <div className="mb-12">
                    {/* Learning Philosophy Note */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                        The difficulty is where the learning happens. These
                        questions help your brain actively process and connect
                        information.
                      </p>
                      <blockquote className="text-sm text-gray-700 dark:text-gray-300 border-l-2 border-gray-400 dark:border-gray-500 pl-3 italic">
                        "Difficulties in learning are desirable when they trigger
                        processes that support learning and remembering." — Robert
                        Bjork
                      </blockquote>
                    </div>

                    <UnifiedQuizDisplay
                      multipleChoiceQuestions={
                        data.generated_quiz_questions.questions || []
                      }
                      openEndedQuestions={
                        data.generated_quiz_questions.open_ended_questions || []
                      }
                      mcqEstimatedTimeMinutes={
                        data.generated_quiz_questions.questions?.length
                          ? data.generated_quiz_questions.questions.length * 1
                          : undefined
                      }
                      oeEstimatedTimeMinutes={
                        data.generated_quiz_questions.quiz_metadata
                          ?.total_open_ended_questions
                          ? data.generated_quiz_questions.quiz_metadata
                              .total_open_ended_questions * 4
                          : undefined
                      }
                      isEditMode={false}
                      onMcqQuestionChange={emptyFunction}
                      onMcqAddQuestion={emptyFunction}
                      onMcqDeleteQuestion={emptyFunction}
                      onOeQuestionChange={emptyFunction}
                      onOeAddQuestion={emptyFunction}
                      onOeDeleteQuestion={emptyFunction}
                      userId="" // Empty for public users
                      jobId={publicShareId}
                      existingQuizResults={null}
                      existingOpenEndedResults={null}
                    />
                  </div>
                )}

              {/* Analysis Sections */}
              <div className="my-12">
                <h2
                  className="text-2xl font-bold text-slate-700
              dark:text-slate-300 mb-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2"
                >
                  Analysis Sections
                </h2>
              </div>

              {/* Deep Dive View */}
              <DeepDiveView
                results={data.results}
                isEditMode={false}
                onFieldChange={emptyFunction}
                onTakeawayChange={emptyFunction}
                onAddTakeaway={emptyFunction}
                onDeleteTakeaway={emptyFunction}
              />
            </>
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
    </>
  );
};

export default PublicSharePage;
