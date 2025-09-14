// API-related types consolidated from types/engine.ts

export type ModelChoice = "universal" | "slam-1";

// State interfaces for hooks
export interface YouTubeState {
  url: string;
  videoDetails: import('./ui').VideoDetails | null;
  isFetching: boolean;
  transcriptId: string | null;
}

export interface UploadState {
  selectedFiles: File[];
  fileDurations: import('./ui').FileDuration[];
  filesUploaded: number;
  uploadProgress: import('./ui').UploadProgress;
  filesInFlight: File[];
  uploadToastId: string | number | null;
}

export interface EngineState {
  activeTab: import('./ui').TabType;
  transcript: string;
  modelChoice: ModelChoice;
  analysisPersona: import('./analysis').AnalysisPersona;
  status: import('./ui').UiStatus;
  error: string | null;
  costDetails: import('./ui').CostDetails | null;
  youtube: YouTubeState;
  upload: UploadState;
}

// API Response types
export interface YouTubeMetadataResponse {
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
}

export interface CostCalculationResponse {
  totalCost: number;
  breakdown: {
    totalBaseCost: number;
    fileBaseCosts: { fileName?: string; duration: number; cost: number }[];
  };
  usage: number;
  limitPerCredit: number;
  unit: string;
  transcript_id?: string;
}

export interface ProcessResponse {
  job_id?: string;
  batch_id?: string;
}

// Error types
export interface ApiError {
  response?: {
    data?: {
      error?: string;
      detail?: string;
    };
  };
}