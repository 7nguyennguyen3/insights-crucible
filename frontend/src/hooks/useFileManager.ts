import { useCallback } from "react";
import { TabType, FileDuration, AnalysisPersona, ModelChoice, CostDetails, UiStatus } from "@/types";
import { useFileDropzone } from "./useFileDropzone";
import { useFileProcessing } from "./useFileProcessing";
import { useFileUpload } from "./useFileUpload";
import { useBulkProcessing } from "./useBulkProcessing";

interface UseFileManagerProps {
  user: any;
  selectedFiles: File[];
  fileDurations: FileDuration[];
  addSelectedFiles: (files: File[]) => void;
  removeSelectedFile: (file: File) => void;
  setStatus: (status: UiStatus) => void;
  setError: (error: string | null) => void;
  incrementFilesUploaded: () => void;
  updateUploadProgress: (fileName: string, progress: number) => void;
  resetState: (tab?: TabType) => void;
}

export const useFileManager = ({
  user,
  selectedFiles,
  fileDurations,
  addSelectedFiles,
  removeSelectedFile,
  setStatus,
  setError,
  incrementFilesUploaded,
  updateUploadProgress,
  resetState,
}: UseFileManagerProps) => {
  // File dropzone functionality
  const { getRootProps, getInputProps, isDragActive } = useFileDropzone({
    user,
    onFilesAccepted: (files) => {
      addSelectedFiles(files);
      setStatus("files-selected");
    },
    onError: setError,
  });

  // File processing functionality
  const { processFiles } = useFileProcessing();

  // File upload functionality  
  const { uploadFile } = useFileUpload({
    user,
    onUploadProgress: updateUploadProgress,
    onFileUploaded: incrementFilesUploaded,
  });

  // Bulk processing functionality
  const { bulkProcess } = useBulkProcessing({
    fileDurations,
    setStatus,
    setError,
  });

  // File removal with state cleanup
  const removeFile = useCallback(
    (fileToRemove: File) => {
      removeSelectedFile(fileToRemove);
      if (selectedFiles.length === 1) {
        resetState();
      }
    },
    [removeSelectedFile, selectedFiles.length, resetState]
  );

  // Combined upload and process operation
  const bulkUploadAndProcess = useCallback(
    async (
      filesToUpload: File[],
      costDetails: CostDetails | null,
      analysisPersona: AnalysisPersona,
      modelChoice: ModelChoice,
      uploadToastId: string | number | null
    ) => {
      setStatus("uploading");
      setError(null);

      try {
        // Upload all files
        const uploadPromises = filesToUpload.map((file) => {
          const currentFileDuration =
            fileDurations.find((d) => d.name === file.name)?.duration || 0;
          return uploadFile(file, currentFileDuration);
        });

        const uploadedItems = await Promise.all(uploadPromises);

        // Process the uploaded files
        await bulkProcess(uploadedItems, costDetails, analysisPersona, modelChoice, uploadToastId);
      } catch (err: any) {
        console.error("Bulk upload and process failed:", err);
        setError("Upload and process failed");
        setStatus("failed");
      }
    },
    [setStatus, setError, fileDurations, uploadFile, bulkProcess]
  );

  return {
    dropzoneProps: { getRootProps, getInputProps },
    isDragActive,
    removeFile,
    processFiles,
    bulkUploadAndProcess,
  };
};