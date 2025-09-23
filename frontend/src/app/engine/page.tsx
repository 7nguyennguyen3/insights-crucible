"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn, CheckCircle } from "lucide-react";

// Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputTabsSection } from "@/components/engine/InputTabsSection";
import { AnalysisPersonaSection } from "@/components/engine/AnalysisPersonaSection";
import { LaunchpadSection } from "@/components/engine/LaunchpadSection";
import { UploadProgressToast } from "../components/UploadProgressToast";
// Modern design system imports
import {
  backgroundVariants,
  containerVariants,
  spacingVariants,
  typographyVariants,
  textGradients,
  gridPatterns,
} from "@/styles/variants";

// Hooks
import { useAuthStore } from "@/store/authStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEngineState } from "@/hooks/useEngineState";
import { useYouTubeProcessor } from "@/hooks/useYouTubeProcessor";
import { useFileUploader } from "@/hooks/useFileUploader";
import { useCostCalculator } from "@/hooks/useCostCalculator";

// Utilities
import {
  isReadyForAnalysis,
  isWorking,
  canUserInteract,
} from "@/lib/engine/engineHelpers";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

const EnginePage = () => {
  const { user, loading: authLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const router = useRouter();

  // Central state management
  const { state, actions } = useEngineState();

  // Specialized processors
  const youtubeProcessor = useYouTubeProcessor({
    setStatus: actions.setStatus,
    setError: actions.setError,
    setVideoDetails: actions.setVideoDetails,
    setIsFetchingYouTube: actions.setIsFetchingYouTube,
    setCostDetails: actions.setCostDetails,
    setTranscriptId: actions.setTranscriptId,
    resetState: actions.resetState,
  });

  const fileUploader = useFileUploader({
    user,
    selectedFiles: state.upload.selectedFiles,
    fileDurations: state.upload.fileDurations,
    setSelectedFiles: actions.setSelectedFiles,
    addSelectedFiles: actions.addSelectedFiles,
    removeSelectedFile: actions.removeSelectedFile,
    setFileDurations: actions.setFileDurations,
    setStatus: actions.setStatus,
    setError: actions.setError,
    setFilesUploaded: actions.setFilesUploaded,
    incrementFilesUploaded: actions.incrementFilesUploaded,
    updateUploadProgress: actions.updateUploadProgress,
    setFilesInFlight: actions.setFilesInFlight,
    setUploadToastId: actions.setUploadToastId,
    resetState: actions.resetState,
  });

  const costCalculator = useCostCalculator({
    setStatus: actions.setStatus,
    setError: actions.setError,
    setCostDetails: actions.setCostDetails,
    setTranscriptId: actions.setTranscriptId,
    setFileDurations: actions.setFileDurations,
  });

  // Computed values
  const isSystemWorking = isWorking(state.status, state.youtube.isFetching);
  const canInteract = canUserInteract(isSystemWorking, user);
  const readyForAnalysis = isReadyForAnalysis(
    state.activeTab,
    state.transcript,
    state.upload.selectedFiles,
    state.youtube.videoDetails
  );
  const isChecking = state.status === "checking";
  const isFetchingMetadata = state.status === "fetching-metadata";

  // Effect for upload progress toasts
  useEffect(() => {
    const { uploadToastId, filesInFlight, uploadProgress, filesUploaded } =
      state.upload;

    if (!uploadToastId || filesInFlight.length === 0) return;

    console.log("Toast update triggered:", {
      filesUploaded,
      totalFiles: filesInFlight.length,
      progress: uploadProgress,
    });

    const isComplete = filesUploaded === filesInFlight.length;

    // Update the existing toast with current progress
    toast.custom(
      () => (
        <UploadProgressToast
          files={filesInFlight}
          progress={uploadProgress}
          filesUploaded={filesUploaded}
        />
      ),
      {
        id: uploadToastId,
        duration: isComplete ? 3000 : Infinity,
      }
    );

    // Show completion notification after a brief delay
    if (isComplete) {
      setTimeout(() => {
        toast.custom(
          () => (
            <div className="w-80 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {UI_MESSAGES.UPLOAD_COMPLETE}
                </h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {UI_MESSAGES.UPLOAD_COMPLETE_DESCRIPTION}
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  router.push("/dashboard");
                  toast.dismiss(`${uploadToastId}-complete`);
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          ),
          {
            id: `${uploadToastId}-complete`,
            duration: 10000,
          }
        );
        // Clean up the upload progress state
        actions.setUploadToastId(null);
        actions.setFilesInFlight([]);
      }, 1000);
    }
  }, [state.upload, router, actions]);

  // Handlers
  const handleTabChange = (tab: any) => {
    actions.resetState(tab);
  };

  const handleTranscriptChange = (transcript: string) => {
    actions.setTranscript(transcript);
    actions.setStatus("idle");
    actions.setVideoDetails(null); // Clear video details if user manually edits
  };

  // Feature config removed - no longer needed

  const handleCostCalculation = () => {
    costCalculator.calculateCost(
      state.activeTab,
      state.youtube.url,
      state.youtube.videoDetails,
      state.transcript,
      state.upload.selectedFiles,
      fileUploader.processFiles
    );
  };

  const handleProcessConfirmation = () => {
    if (state.youtube.transcriptId) {
      // YouTube processing
      youtubeProcessor.processYouTubeVideo(
        state.youtube.transcriptId,
        state.costDetails,
        state.analysisPersona,
        state.modelChoice,
        state.activeTab,
        state.youtube.url,
        state.youtube.videoDetails,
        router
      );
    } else if (state.activeTab === "paste") {
      // Text processing
      costCalculator.processTextAnalysis(
        state.transcript,
        state.analysisPersona,
        state.costDetails,
        state.activeTab,
        actions.resetState,
        router
      );
    } else {
      // File upload processing
      const filesToUpload = [...state.upload.selectedFiles];
      actions.setFilesInFlight(filesToUpload);
      actions.setFilesUploaded(0);

      // Initialize progress for all files at 0%
      const initialProgress: { [fileName: string]: number } = {};
      filesToUpload.forEach((file) => {
        initialProgress[file.name] = 0;
      });
      actions.setUploadProgress(initialProgress);

      const toastId = toast.custom(
        () => (
          <UploadProgressToast
            files={filesToUpload}
            progress={initialProgress}
            filesUploaded={0}
          />
        ),
        { duration: Infinity }
      );

      actions.setUploadToastId(toastId);
      fileUploader.bulkUploadAndProcess(
        filesToUpload,
        state.costDetails,
        state.analysisPersona,
        state.modelChoice,
        state.upload.uploadToastId
      );
    }
  };

  const handleStartOver = () => {
    actions.resetState(state.activeTab);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200`}
    >
      <div
        className={`${spacingVariants.heroPadding} ${containerVariants.section}`}
      >
        <header className="text-center mb-16">
          <h1 className={`${typographyVariants.heroTitle} mb-6`}>
            <span className={textGradients.warmHero}>Transform Content</span>
            <br />
            <span className={textGradients.accent}>Into Learning</span>
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed text-slate-700 dark:text-slate-300 max-w-4xl mx-auto">
            Turn any podcast, video, or text into structured learning materials
            with
            <strong className="text-slate-900 dark:text-slate-100">
              {" "}
              AI-powered analysis and insights.
            </strong>
          </p>
        </header>

        {!user && (
          <Alert className="mb-8 max-w-4xl mx-auto bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Welcome!</AlertTitle>
            <AlertDescription className="flex">
              Please{" "}
              <Link href="/auth" className="font-bold underline">
                sign in
              </Link>{" "}
              to analyze your content.
            </AlertDescription>
          </Alert>
        )}

        <div className="w-full flex justify-center items-center">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full max-w-5xl">
            <div className="lg:col-span-2 space-y-8">
              <InputTabsSection
                activeTab={state.activeTab}
                user={user}
                canInteract={canInteract}
                youtubeUrl={state.youtube.url}
                videoDetails={state.youtube.videoDetails}
                isFetchingMetadata={isFetchingMetadata}
                onUrlChange={actions.setYouTubeUrl}
                onFetchMetadata={() =>
                  youtubeProcessor.fetchYouTubeMetadata(state.youtube.url)
                }
                transcript={state.transcript}
                onTranscriptChange={handleTranscriptChange}
                selectedFiles={state.upload.selectedFiles}
                modelChoice={state.modelChoice}
                isDragActive={fileUploader.isDragActive}
                dropzoneProps={fileUploader.dropzoneProps}
                onModelChange={actions.setModelChoice}
                onRemoveFile={fileUploader.removeFile}
                onTabChange={handleTabChange}
              />

              <AnalysisPersonaSection
                analysisPersona={state.analysisPersona}
                canInteract={canInteract}
                onPersonaChange={actions.setAnalysisPersona}
              />
            </div>

            <div className="lg:col-span-1 lg:sticky top-24 space-y-6">
              <LaunchpadSection
                activeTab={state.activeTab}
                videoDetails={state.youtube.videoDetails}
                selectedFiles={state.upload.selectedFiles}
                analysisPersona={state.analysisPersona}
                status={state.status}
                costDetails={state.costDetails}
                error={state.error}
                filesUploaded={state.upload.filesUploaded}
                profile={profile}
                canInteract={canInteract}
                isReadyForAnalysis={readyForAnalysis}
                isChecking={isChecking}
                onCalculateCost={handleCostCalculation}
                onProcessConfirmation={handleProcessConfirmation}
                onStartOver={handleStartOver}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EnginePage;
