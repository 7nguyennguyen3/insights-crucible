import { useCallback } from "react";
import { FileDuration } from "@/types";
import { getAudioDuration } from "@/lib/engine/engineHelpers";

export const useFileProcessing = () => {
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

  return {
    processFiles,
  };
};