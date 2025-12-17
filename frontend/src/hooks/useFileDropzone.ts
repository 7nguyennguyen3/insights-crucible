import { useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { TabType } from "@/types";
import { ACCEPTED_FILE_TYPES, FILE_VALIDATION_ERROR, MAX_FILE_SIZE_BYTES } from "@/lib/engine/engineConstants";

interface UseFileDropzoneProps {
  user: any;
  onFilesAccepted: (files: File[]) => void;
  onError: (error: string | null) => void;
}

export const useFileDropzone = ({ user, onFilesAccepted, onError }: UseFileDropzoneProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        onError(FILE_VALIDATION_ERROR);
        return;
      }
      onError(null);
      onFilesAccepted(acceptedFiles);
    },
    [onFilesAccepted, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
    disabled: !user,
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
  };
};