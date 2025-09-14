import { useCallback } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import {
  VideoDetails,
  AnalysisPersona,
  ModelChoice,
  CostDetails,
  ApiError,
  TabType,
} from "@/types/engine";
import { extractErrorMessage } from "@/lib/engine/engineHelpers";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

interface UseYouTubeProcessorProps {
  setStatus: (status: any) => void;
  setError: (error: string | null) => void;
  setVideoDetails: (details: VideoDetails | null) => void;
  setIsFetchingYouTube: (fetching: boolean) => void;
  setCostDetails: (details: CostDetails | null) => void;
  setTranscriptId: (id: string | null) => void;
  resetState: (tab?: TabType) => void;
}

interface UseYouTubeProcessorReturn {
  fetchYouTubeMetadata: (youtubeUrl: string) => Promise<void>;
  processYouTubeVideo: (
    transcriptId: string,
    costDetails: CostDetails | null,
    analysisPersona: AnalysisPersona,
    modelChoice: ModelChoice,
    activeTab: TabType,
    youtubeUrl: string,
    videoDetails: VideoDetails | null,
    router: any
  ) => Promise<void>;
}

export const useYouTubeProcessor = ({
  setStatus,
  setError,
  setVideoDetails,
  setIsFetchingYouTube,
  setCostDetails,
  setTranscriptId,
  resetState,
}: UseYouTubeProcessorProps): UseYouTubeProcessorReturn => {
  const fetchYouTubeMetadata = useCallback(
    async (youtubeUrl: string) => {
      if (!youtubeUrl.trim()) return;

      setStatus("fetching-metadata");
      setError(null);
      setVideoDetails(null);
      setIsFetchingYouTube(true);

      try {
        const response = await apiClient.post("/youtube/metadata", {
          youtubeUrl,
        });

        setVideoDetails(response.data);
        setStatus("metadata-fetched");
      } catch (err: any) {
        const errorMsg = extractErrorMessage(
          err,
          UI_MESSAGES.YOUTUBE_FETCH_ERROR
        );
        toast.error(UI_MESSAGES.FETCH_FAILED, { description: errorMsg });
        setError(errorMsg);
        setStatus("failed");
      } finally {
        setIsFetchingYouTube(false);
      }
    },
    [setStatus, setError, setVideoDetails, setIsFetchingYouTube]
  );

  const processYouTubeVideo = useCallback(
    async (
      transcriptId: string,
      costDetails: CostDetails | null,
      analysisPersona: AnalysisPersona,
      modelChoice: ModelChoice,
      activeTab: TabType,
      youtubeUrl: string,
      videoDetails: VideoDetails | null,
      router: any
    ) => {
      setStatus("processing-batch");
      setError(null);

      try {
        const response = await apiClient.post("/process", {
          totalCost: costDetails?.totalCost,
          transcript_id: transcriptId,
          config: { analysis_persona: analysisPersona },
          model_choice: modelChoice,
          source_type: "youtube",
          youtube_url: youtubeUrl,
          youtube_video_title: videoDetails?.title || null,
          youtube_channel_name: videoDetails?.channelName || null,
          youtube_duration: videoDetails?.duration || null,
          youtube_thumbnail_url: videoDetails?.thumbnailUrl || null,
        });

        if (response.data.job_id) {
          toast.success(UI_MESSAGES.ANALYSIS_SUCCESS, {
            description: UI_MESSAGES.ANALYSIS_SUCCESS_DESCRIPTION,
            action: {
              label: "Go to Dashboard",
              onClick: () => router.push("/dashboard"),
            },
          });
          resetState(activeTab);
        } else {
          throw new Error(UI_MESSAGES.NO_JOB_ID);
        }
      } catch (err: any) {
        const errorMsg = extractErrorMessage(err, UI_MESSAGES.PROCESSING_ERROR);
        toast.error(UI_MESSAGES.SUBMISSION_FAILED, { description: errorMsg });
        setError(errorMsg);
        setStatus("failed");
      }
    },
    [setStatus, setError, resetState]
  );

  return {
    fetchYouTubeMetadata,
    processYouTubeVideo,
  };
};
