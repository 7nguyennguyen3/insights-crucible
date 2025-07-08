"use client";

import React, { useRef } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

// --- Layout & View Components ---

// --- Interfaces ---
import {
  JobData,
  GeneralAnalysisSection,
  ConsultantAnalysisSection,
} from "@/app/_global/interface";
import {
  AnalysisPageLayout,
  AnalysisPageLayoutRef,
} from "@/app/components/analysis/AnalysisPageLayout";
import { AnalysisHeader } from "@/app/components/analysis/AnalysisHeader";
import { AnalysisActionButtons } from "@/app/components/analysis/AnalysisActionButtons";
import { ConsultantReportView } from "@/app/components/analysis/ConsultantReportView";
import { GeneralReportView } from "@/app/components/analysis/GeneralReportView";
import { ExecutiveSynthesisView } from "@/app/components/analysis/synthesis-display/ExecutiveSynthesisView";
import { useMarkdownExport } from "@/hooks/useMarkdownExport";

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

  // --- Dynamic Markdown Export ---

  // --- Render States ---
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

  const persona = data.request_data?.config?.analysis_persona || "general";

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
          onSave={emptyFunction}
          onCancel={emptyFunction}
        />
      }
    >
      {data.synthesis_results && (
        <div className="mb-12">
          <ExecutiveSynthesisView synthesis={data.synthesis_results} />
          <div className="my-12">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
              Detailed Section Analysis
            </h2>
          </div>
        </div>
      )}
      {persona === "consultant" ? (
        <ConsultantReportView
          results={data.results as ConsultantAnalysisSection[]}
          isEditMode={false}
          onFieldChange={emptyFunction}
          onAddItem={emptyFunction}
          onDeleteItem={emptyFunction}
          onItemChange={emptyFunction}
          onContextualBriefingChange={emptyFunction}
          onContextualBriefingListItemChange={emptyFunction}
          onContextualBriefingViewpointChange={emptyFunction}
          onContextualBriefingAddItem={emptyFunction}
          onContextualBriefingDeleteItem={emptyFunction}
        />
      ) : (
        <GeneralReportView
          results={data.results as GeneralAnalysisSection[]}
          argument_structure={data.argument_structure}
          isEditMode={false}
          onFieldChange={emptyFunction}
          onAddItem={emptyFunction}
          onDeleteItem={emptyFunction}
          onItemChange={emptyFunction}
          onQaChange={emptyFunction}
          onContextualBriefingChange={emptyFunction}
          onContextualBriefingListItemChange={emptyFunction}
          onContextualBriefingViewpointChange={emptyFunction}
          onContextualBriefingAddItem={emptyFunction}
          onContextualBriefingDeleteItem={emptyFunction}
        />
      )}
    </AnalysisPageLayout>
  );
};

export default PublicSharePage;
