import { useCallback } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { 
  TabType, 
  CostDetails, 
  VideoDetails,
  FileDuration,
  CostCalculationResponse,
  AnalysisPersona
} from "@/types/engine";
import { extractErrorMessage } from "@/lib/engine/engineHelpers";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

interface UseCostCalculatorProps {
  setStatus: (status: any) => void;
  setError: (error: string | null) => void;
  setCostDetails: (details: CostDetails | null) => void;
  setTranscriptId: (id: string | null) => void;
  setFileDurations: (durations: FileDuration[]) => void;
}

interface UseCostCalculatorReturn {
  calculateCost: (
    activeTab: TabType,
    youtubeUrl: string,
    videoDetails: VideoDetails | null,
    transcript: string,
    selectedFiles: File[],
    processFiles: (files: File[]) => Promise<FileDuration[]>
  ) => Promise<void>;
  processTextAnalysis: (
    transcript: string,
    analysisPersona: AnalysisPersona,
    costDetails: CostDetails | null,
    activeTab: TabType,
    resetState: (tab?: TabType) => void,
    router: any
  ) => Promise<void>;
}

export const useCostCalculator = ({
  setStatus,
  setError,
  setCostDetails,
  setTranscriptId,
  setFileDurations,
}: UseCostCalculatorProps): UseCostCalculatorReturn => {

  const calculateYouTubeCost = useCallback(async (
    youtubeUrl: string
  ) => {
    try {
      const response = await apiClient.post("/check-analysis", {
        youtubeUrl,
        config: {},
      });
      
      setCostDetails(response.data);
      if (response.data.transcript_id) {
        setTranscriptId(response.data.transcript_id);
      }
      setStatus("cost-calculated");
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, "An unexpected error occurred.");
      toast.error(UI_MESSAGES.CHECK_FAILED, { description: errorMsg });
      setError(errorMsg);
      setStatus("failed");
    }
  }, [setCostDetails, setTranscriptId, setStatus, setError]);

  const calculateUploadCost = useCallback(async (
    selectedFiles: File[],
    processFiles: (files: File[]) => Promise<FileDuration[]>
  ) => {
    try {
      const durationsWithNames = await processFiles(selectedFiles);
      setFileDurations(durationsWithNames);
      
      const payload = {
        durations: durationsWithNames.map((d) => d.duration),
        config: {},
      };
      
      const response = await apiClient.post("/check-analysis", payload);
      setCostDetails(response.data);
      setStatus("cost-calculated");
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, "An unexpected error occurred.");
      toast.error(UI_MESSAGES.CHECK_FAILED, { description: errorMsg });
      setError(errorMsg);
      setStatus("failed");
    }
  }, [setCostDetails, setFileDurations, setStatus, setError]);

  const calculateTextCost = useCallback(async (
    transcript: string
  ) => {
    try {
      const payload = { 
        character_count: transcript.length, 
        config: {} 
      };
      
      const response = await apiClient.post("/check-analysis", payload);
      setCostDetails(response.data);
      setStatus("cost-calculated");
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err, "An unexpected error occurred.");
      toast.error(UI_MESSAGES.CHECK_FAILED, { description: errorMsg });
      setError(errorMsg);
      setStatus("failed");
    }
  }, [setCostDetails, setStatus, setError]);

  const calculateCost = useCallback(async (
    activeTab: TabType,
    youtubeUrl: string,
    videoDetails: VideoDetails | null,
    transcript: string,
    selectedFiles: File[],
    processFiles: (files: File[]) => Promise<FileDuration[]>
  ) => {
    setStatus("checking");
    setError(null);
    setCostDetails(null);

    switch (activeTab) {
      case "youtube":
        if (!videoDetails) return;
        await calculateYouTubeCost(youtubeUrl);
        break;
        
      case "upload":
        if (selectedFiles.length === 0) return;
        await calculateUploadCost(selectedFiles, processFiles);
        break;
        
      case "paste":
        if (transcript.trim() === "") return;
        await calculateTextCost(transcript);
        break;
        
      default:
        setError("Invalid tab selection");
        setStatus("failed");
    }
  }, [
    setStatus,
    setError,
    setCostDetails,
    calculateYouTubeCost,
    calculateUploadCost,
    calculateTextCost,
  ]);

  const processTextAnalysis = useCallback(async (
    transcript: string,
    analysisPersona: AnalysisPersona,
    costDetails: CostDetails | null,
    activeTab: TabType,
    resetState: (tab?: TabType) => void,
    router: any
  ) => {
    setStatus("processing-batch");
    setError(null);
    
    try {
      const response = await apiClient.post("/process", {
        totalCost: costDetails?.totalCost,
        transcript,
        config: { analysis_persona: analysisPersona },
        model_choice: "universal",
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
  }, [setStatus, setError]);

  return {
    calculateCost,
    processTextAnalysis,
  };
};