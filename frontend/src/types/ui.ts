// UI-related types consolidated from types/engine.ts

export interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  link: string;
  createdAt: any; // Firestore Timestamp
}

export type TabType = "youtube" | "paste" | "upload";

export type UiStatus =
  | "idle"
  | "files-selected"
  | "fetching-metadata"
  | "metadata-fetched"
  | "checking"
  | "cost-calculated"
  | "uploading"
  | "processing-batch"
  | "failed";

export interface VideoDetails {
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string; // ISO 8601 duration string
}

export interface CostDetails {
  totalCost: number;
  breakdown: {
    totalBaseCost: number;
    fileBaseCosts: { fileName?: string; duration: number; cost: number }[];
  };
  usage: number;
  limitPerCredit: number;
  unit: string;
}

export interface FileDuration {
  name: string;
  duration: number;
}

export interface UploadProgress {
  [fileName: string]: number;
}

// Bulk YouTube metadata types
export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
  success: boolean;
  error?: string;
}

export interface BulkVideoResponse {
  results: VideoMetadata[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

export type BulkFetchStatus = "idle" | "processing" | "completed" | "error";