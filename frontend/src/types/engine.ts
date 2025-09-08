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

export type ModelChoice = "universal" | "slam-1";

export type AnalysisPersona = "learning_accelerator" | "deep_analysis";

export interface VideoDetails {
  title: string;
  thumbnailUrl: string;
  duration: string; // ISO 8601 duration string
}

// FeatureConfig removed - legacy add-on features no longer supported

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

// FeatureOption removed - legacy add-on features no longer supported

// State interfaces for hooks
export interface YouTubeState {
  url: string;
  videoDetails: VideoDetails | null;
  isFetching: boolean;
  transcriptId: string | null;
}

export interface UploadState {
  selectedFiles: File[];
  fileDurations: FileDuration[];
  filesUploaded: number;
  uploadProgress: UploadProgress;
  filesInFlight: File[];
  uploadToastId: string | number | null;
}

export interface EngineState {
  activeTab: TabType;
  transcript: string;
  modelChoice: ModelChoice;
  analysisPersona: AnalysisPersona;
  status: UiStatus;
  error: string | null;
  costDetails: CostDetails | null;
  youtube: YouTubeState;
  upload: UploadState;
}

// API Response types
export interface YouTubeMetadataResponse {
  title: string;
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