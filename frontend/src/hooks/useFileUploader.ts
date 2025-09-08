import { useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";
import apiClient from "@/lib/apiClient";
import {
  FileDuration,
  AnalysisPersona,
  ModelChoice,
  CostDetails,
  UploadProgress,
  TabType,
} from "@/types/engine";
import {
  getAudioDuration,
  createStoragePath,
  extractErrorMessage,
} from "@/lib/engine/engineHelpers";
import {
  ACCEPTED_FILE_TYPES,
  FILE_VALIDATION_ERROR,
  UI_MESSAGES,
} from "@/lib/engine/engineConstants";

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
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        setError(FILE_VALIDATION_ERROR);
        return;
      }
      setError(null);
      addSelectedFiles(acceptedFiles);
      setStatus("files-selected");
    },
    [addSelectedFiles, setError, setStatus]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
    disabled: !user,
  });

  const removeFile = useCallback(
    (fileToRemove: File) => {
      removeSelectedFile(fileToRemove);
      if (selectedFiles.length === 1) {
        resetState();
      }
    },
    [removeSelectedFile, selectedFiles.length, resetState]
  );

  const processFiles = useCallback(
    async (files: File[]): Promise<FileDuration[]> => {
      const durationPromises = files.map(async (file) => {
        try {
          const duration = await getAudioDuration(file);
          return { name: file.name, duration };
        } catch (error) {
          console.error(`Error getting duration for ${file.name}:`, error);
          return { name: file.name, duration: 0 };
        }
      });

      return Promise.all(durationPromises);
    },
    []
  );

  const uploadFile = useCallback(
    (
      file: File,
      fileDuration: number
    ): Promise<{
      storagePath: string;
      client_provided_id: string;
      duration_seconds: number;
    }> => {
      return new Promise((resolve, reject) => {
        if (!user) {
          return reject(new Error(UI_MESSAGES.SIGN_IN_REQUIRED));
        }

        const filePath = createStoragePath(user.uid, file.name);
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percentCompleted = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            updateUploadProgress(file.name, percentCompleted);
          },
          (error) => {
            console.error(`Upload failed for ${file.name}:`, error);
            reject(new Error(`Upload failed for ${file.name}.`));
          },
          () => {
            incrementFilesUploaded();
            resolve({
              storagePath: filePath,
              client_provided_id: file.name,
              duration_seconds: fileDuration,
            });
          }
        );
      });
    },
    [user, updateUploadProgress, incrementFilesUploaded]
  );

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
        const uploadPromises = filesToUpload.map((file) => {
          const currentFileDuration =
            fileDurations.find((d) => d.name === file.name)?.duration || 0;
          return uploadFile(file, currentFileDuration);
        });

        const uploadedItems = await Promise.all(uploadPromises);

        setStatus("processing-batch");

        const processResponse = await apiClient.post("/process-bulk", {
          totalCost: costDetails?.totalCost,
          items: uploadedItems,
          config: { analysis_persona: analysisPersona },
          model_choice: modelChoice,
        });

        if (!processResponse.data.batch_id) {
          throw new Error(UI_MESSAGES.NO_BATCH_ID);
        }

        setStatus("idle");
      } catch (err: any) {
        console.error("Bulk upload and process failed:", err);

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
    [setStatus, setError, fileDurations, uploadFile]
  );

  return {
    dropzoneProps: { getRootProps, getInputProps },
    isDragActive,
    removeFile,
    bulkUploadAndProcess,
    processFiles,
  };
};
