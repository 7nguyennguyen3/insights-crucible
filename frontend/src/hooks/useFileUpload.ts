import { useCallback } from "react";
import { ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";
import { createStoragePath } from "@/lib/engine/engineHelpers";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

interface UseFileUploadProps {
  user: any;
  onUploadProgress: (fileName: string, progress: number) => void;
  onFileUploaded: () => void;
}

export const useFileUpload = ({
  user,
  onUploadProgress,
  onFileUploaded,
}: UseFileUploadProps) => {
  const uploadFile = useCallback(
    async (
      file: File,
      fileDuration: number
    ): Promise<{
      storagePath: string;
      client_provided_id: string;
      duration_seconds: number;
    }> => {
      if (!user) {
        throw new Error(UI_MESSAGES.SIGN_IN_REQUIRED);
      }

      // Upload the file directly to Firebase Storage
      return new Promise((resolve, reject) => {
        const filePath = createStoragePath(user.uid, file.name);
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const uploadPercent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            console.log(
              `Upload progress for ${file.name}: ${uploadPercent}%`
            );
            onUploadProgress(file.name, uploadPercent);
          },
          (error) => {
            console.error(`Upload failed for ${file.name}:`, error);
            reject(new Error(`Upload failed for ${file.name}.`));
          },
          () => {
            onFileUploaded();
            resolve({
              storagePath: filePath,
              client_provided_id: file.name,
              duration_seconds: fileDuration,
            });
          }
        );
      });
    },
    [user, onUploadProgress, onFileUploaded]
  );

  return {
    uploadFile,
  };
};
