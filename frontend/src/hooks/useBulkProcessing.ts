import { useCallback } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { AnalysisPersona, ModelChoice, CostDetails, FileDuration, UiStatus } from "@/types";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

interface UseBulkProcessingProps {
  fileDurations: FileDuration[];
  setStatus: (status: UiStatus) => void;
  setError: (error: string | null) => void;
}

export const useBulkProcessing = ({ fileDurations, setStatus, setError }: UseBulkProcessingProps) => {
  const bulkProcess = useCallback(
    async (
      uploadedItems: Array<{
        storagePath: string;
        client_provided_id: string;
        duration_seconds: number;
      }>,
      costDetails: CostDetails | null,
      analysisPersona: AnalysisPersona,
      modelChoice: ModelChoice,
      uploadToastId: string | number | null
    ) => {
      setStatus("processing-batch");

      try {
        const processResponse = await apiClient.post("/process-bulk", {
          totalCost: costDetails?.totalCost,
          items: uploadedItems,
          config: { analysis_persona: analysisPersona },
          model_choice: modelChoice,
          source_type: "upload",
          file_metadata: fileDurations,
        });

        if (!processResponse.data.batch_id) {
          throw new Error(UI_MESSAGES.NO_BATCH_ID);
        }

        setStatus("idle");
      } catch (err: any) {
        console.error("Bulk processing failed:", err);

        if (uploadToastId) {
          toast.error(UI_MESSAGES.PROCESS_FAILED, {
            id: uploadToastId,
            description: UI_MESSAGES.PROCESS_FAILED_DESCRIPTION,
          });
        }

        setError(UI_MESSAGES.UPLOAD_ERROR);
        setStatus("failed");
      }
    },
    [fileDurations, setStatus, setError]
  );

  return {
    bulkProcess,
  };
};