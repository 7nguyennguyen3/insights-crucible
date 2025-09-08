import { TabType, UiStatus, VideoDetails } from "@/types/engine";

/**
 * Parses ISO 8601 duration string and formats it for display
 * @param isoDuration - ISO 8601 duration string (e.g., "PT1H23M45S")
 * @returns Formatted duration string (e.g., "1:23:45" or "23:45")
 */
export const parseAndFormatDuration = (isoDuration: string): string => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);

  if (!matches) return "0:00";

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  // Seconds are always padded to two digits.
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    // Hours are the leading unit, so they are not padded.
    const hh = String(hours);
    // Minutes are not the leading unit, so they get padded.
    const mm = String(minutes).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  } else {
    // Minutes are the leading unit, so they are not padded.
    const mm = String(minutes);
    return `${mm}:${ss}`;
  }
};

/**
 * Gets audio duration from a file object
 * @param file - The audio file to analyze
 * @returns Promise resolving to duration in seconds
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);
    
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read file duration."));
    };
    
    audio.src = objectUrl;
  });
};

/**
 * Determines if the current state is ready for analysis
 * @param activeTab - Current active tab
 * @param transcript - Text transcript content
 * @param selectedFiles - Array of selected files
 * @param videoDetails - YouTube video details
 * @returns boolean indicating if ready for analysis
 */
export const isReadyForAnalysis = (
  activeTab: TabType,
  transcript: string,
  selectedFiles: File[],
  videoDetails: VideoDetails | null
): boolean => {
  switch (activeTab) {
    case "paste":
      return transcript.trim() !== "";
    case "upload":
      return selectedFiles.length > 0;
    case "youtube":
      return !!videoDetails;
    default:
      return false;
  }
};

/**
 * Determines if the system is currently working (processing, uploading, etc.)
 * @param status - Current UI status
 * @param isFetchingYouTube - YouTube fetching state
 * @returns boolean indicating if system is working
 */
export const isWorking = (status: UiStatus, isFetchingYouTube: boolean): boolean => {
  const workingStatuses: UiStatus[] = [
    "processing-batch",
    "uploading",
    "checking",
    "fetching-metadata"
  ];
  
  return workingStatuses.includes(status) || isFetchingYouTube;
};



/**
 * Validates a YouTube URL
 * @param url - YouTube URL to validate
 * @returns boolean indicating if URL is valid
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&.*)?$/i;
  return youtubeRegex.test(url.trim());
};

/**
 * Extracts error message from API error response
 * @param error - Error object from API call
 * @param fallbackMessage - Default message if no specific error found
 * @returns Formatted error message
 */
export const extractErrorMessage = (error: any, fallbackMessage: string): string => {
  return error.response?.data?.error || 
         error.response?.data?.detail || 
         fallbackMessage;
};

/**
 * Formats file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Determines the display name for the source based on current state
 * @param activeTab - Current active tab
 * @param videoDetails - YouTube video details
 * @param selectedFilesCount - Number of selected files
 * @returns Display name for the source
 */
export const getSourceDisplayName = (
  activeTab: TabType,
  videoDetails: VideoDetails | null,
  selectedFilesCount: number
): string => {
  if (videoDetails) {
    return "YouTube Video";
  }
  
  switch (activeTab) {
    case "paste":
      return "Pasted Text";
    case "upload":
      return `${selectedFilesCount} File(s)`;
    case "youtube":
      return "YouTube URL";
    default:
      return "Unknown Source";
  }
};

/**
 * Creates a file path for Firebase Storage
 * @param userId - User's unique identifier
 * @param fileName - Original file name
 * @returns Formatted storage path
 */
export const createStoragePath = (userId: string, fileName: string): string => {
  return `uploads/${userId}/${Date.now()}-${fileName}`;
};

/**
 * Validates if user can interact with the interface
 * @param isWorking - Whether system is currently processing
 * @param user - User object (null if not authenticated)
 * @returns boolean indicating if user can interact
 */
export const canUserInteract = (isWorking: boolean, user: any): boolean => {
  return !isWorking && !!user;
};

/**
 * Calculates upload progress percentage
 * @param filesUploaded - Number of files successfully uploaded
 * @param totalFiles - Total number of files to upload
 * @returns Progress percentage (0-100)
 */
export const calculateUploadProgress = (filesUploaded: number, totalFiles: number): number => {
  if (totalFiles === 0) return 0;
  return Math.round((filesUploaded / totalFiles) * 100);
};