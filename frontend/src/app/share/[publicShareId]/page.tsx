"use client";

import React, { useRef } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import apiClient from "@/lib/apiClient";
import { Loader2 } from "lucide-react";
import {
  JobData,
} from "@/app/_global/interface";
import { useMarkdownExport } from "@/hooks/useMarkdownExport";

// --- Layout & View Components ---
import {
  AnalysisPageLayout,
  AnalysisPageLayoutRef,
} from "@/app/components/analysis/AnalysisPageLayout";
import { AnalysisHeader } from "@/app/components/analysis/AnalysisHeader";
import { AnalysisActionButtons } from "@/app/components/analysis/AnalysisActionButtons";
import { SlideDeckDisplay } from "@/app/components/analysis/SlideDeckDisplay";
import DeepDiveView from "@/app/components/analysis/DeepDiveView";
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

  const isEditMode = false;
  const emptyFunction = () => {};
  const emptyAsyncFunction = async () => {}; // For handlers that might be async

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
    <AnalysisPageLayout
      ref={layoutRef}
      isLoading={false}
      jobTitle={data.job_title}
      transcript={data.structured_transcript}
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
          hasTranscript={!!data.structured_transcript?.length}
          onShowTranscript={() => layoutRef.current?.openTranscriptDialog()}
          onExportMarkdown={exportToMarkdown}
          isEditMode={isEditMode}
          onEdit={emptyFunction}
          onSave={emptyAsyncFunction}
          onCancel={emptyFunction}
          onShare={emptyFunction}
          onExportDocx={emptyFunction}
          onExportPdf={emptyFunction}
        />
      }
    >
      <div id="analysis-report-content">
        {/* --- Header for detailed results --- */}
        <div className="my-12">
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
            Analysis Sections
          </h2>
        </div>

        {/* --- Deep Dive Analysis --- */}
        <DeepDiveView
          results={data.results as any}
          isEditMode={false}
          onFieldChange={emptyFunction}
          onTakeawayChange={emptyFunction}
          onAddTakeaway={emptyFunction}
          onDeleteTakeaway={emptyFunction}
        />

        {data.generated_slide_outline && (
          <div className="mt-12">
            <SlideDeckDisplay
              slides={data.generated_slide_outline}
              isEditMode={false}
              onAddSlide={emptyFunction}
              onDeleteSlide={emptyFunction}
              onSlideTitleChange={emptyFunction}
              onAddBullet={emptyFunction}
              onDeleteBullet={emptyFunction}
              onSlideChange={emptyFunction}
            />
          </div>
        )}
      </div>
    </AnalysisPageLayout>
  );
};

export default PublicSharePage;
