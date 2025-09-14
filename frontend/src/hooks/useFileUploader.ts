// Legacy hook - refactored to use composed utilities
import { useFileManager } from "./useFileManager";
import {
  FileDuration,
  AnalysisPersona,
  ModelChoice,
  CostDetails,
  TabType,
} from "@/types";

interface UseFileUploaderProps {
  user: any;
  selectedFiles: File[];
  fileDurations: FileDuration[];
  setSelectedFiles: (files: File[]) => void;
  addSelectedFiles: (files: File[]) => void;
  removeSelectedFile: (file: File) => void;
  setFileDurations: (durations: FileDuration[]) => void;
  setStatus: (status: any) => void;
  setError: (error: string | null) => void;
  setFilesUploaded: (count: number) => void;
  incrementFilesUploaded: () => void;
  updateUploadProgress: (fileName: string, progress: number) => void;
  setFilesInFlight: (files: File[]) => void;
  setUploadToastId: (id: string | number | null) => void;
  resetState: (tab?: TabType) => void;
}

interface UseFileUploaderReturn {
  dropzoneProps: any;
  isDragActive: boolean;
  removeFile: (fileToRemove: File) => void;
  bulkUploadAndProcess: (
    filesToUpload: File[],
    costDetails: CostDetails | null,
    analysisPersona: AnalysisPersona,
    modelChoice: ModelChoice,
    uploadToastId: string | number | null
  ) => Promise<void>;
  processFiles: (files: File[]) => Promise<FileDuration[]>;
}

export const useFileUploader = ({
  user,
  selectedFiles,
  fileDurations,
  setSelectedFiles,
  addSelectedFiles,
  removeSelectedFile,
  setFileDurations,
  setStatus,
  setError,
  setFilesUploaded,
  incrementFilesUploaded,
  updateUploadProgress,
  setFilesInFlight,
  setUploadToastId,
  resetState,
}: UseFileUploaderProps): UseFileUploaderReturn => {
  
  // Use the composed file manager hook
  const fileManager = useFileManager({
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
  });

  return {
    dropzoneProps: fileManager.dropzoneProps,
    isDragActive: fileManager.isDragActive,
    removeFile: fileManager.removeFile,
    bulkUploadAndProcess: fileManager.bulkUploadAndProcess,
    processFiles: fileManager.processFiles,
  };
};
