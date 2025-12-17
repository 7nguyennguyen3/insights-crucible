import { useCallback } from "react";
import { ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";
import { createStoragePath } from "@/lib/engine/engineHelpers";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";
import { compressAudioFile, CompressionProgress } from "@/lib/audioCompression";

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

      // Compress file if needed (files > 50MB)
      const originalFileName = file.name;
      let fileToUpload = file;

      try {
        const isVideo = file.type.startsWith("video/");

        // Show compression/extraction progress (0-50% of total progress)
        fileToUpload = await compressAudioFile(file, {
          targetBitrate: 128, // 128 kbps MP3
          minFileSizeForCompression: isVideo ? 0 : 50 * 1024 * 1024, // Always extract from video, compress audio >50MB
          onProgress: (compressionProgress: CompressionProgress) => {
            // Map compression progress to 0-50% of upload progress
            const progressPercent = Math.floor(compressionProgress.percent / 2);
            const action = isVideo ? "Extracting audio from" : "Compressing";
            console.log(
              `${action} ${file.name}: ${compressionProgress.stage} - ${progressPercent}%`
            );
            onUploadProgress(file.name, progressPercent);
          },
        });

        if (fileToUpload !== file) {
          console.log(`File compressed: ${file.name} → ${fileToUpload.name}`);
          console.log(
            `Size reduction: ${(((file.size - fileToUpload.size) / file.size) * 100).toFixed(1)}%`
          );
        }
      } catch (compressionError) {
        console.error(
          "Compression failed, uploading original file:",
          compressionError
        );
        fileToUpload = file;
      }

      // Upload the file (compressed or original)
      return new Promise((resolve, reject) => {
        const filePath = createStoragePath(user.uid, fileToUpload.name);
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Upload progress maps to 50-100% of total progress
            const uploadPercent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            const totalPercent = 50 + Math.floor(uploadPercent / 2);
            console.log(
              `Upload progress for ${fileToUpload.name}: ${uploadPercent}% (total: ${totalPercent}%)`
            );
            onUploadProgress(originalFileName, totalPercent);
          },
          (error) => {
            console.error(`Upload failed for ${fileToUpload.name}:`, error);
            reject(new Error(`Upload failed for ${fileToUpload.name}.`));
          },
          () => {
            onFileUploaded();
            resolve({
              storagePath: filePath,
              client_provided_id: originalFileName,
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
