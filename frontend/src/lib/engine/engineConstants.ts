import { ModelChoice, AnalysisPersona, TabType } from "@/types/engine";

// Legacy feature options removed - focusing on core analysis types instead

export const DEFAULT_MODEL_CHOICE: ModelChoice = "universal";
export const DEFAULT_ANALYSIS_PERSONA: AnalysisPersona = "deep_dive";
export const DEFAULT_TAB: TabType = "youtube";

// File validation
export const ACCEPTED_FILE_TYPES = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/mp4": [".m4a", ".mp4"],
};

export const FILE_VALIDATION_ERROR =
  "One or more files were invalid. Please upload only MP3, MP4, M4A, or WAV files.";

// UI Messages
export const UI_MESSAGES = {
  YOUTUBE_PLACEHOLDER_AUTHENTICATED: "https://www.youtube.com/watch?v=...",
  YOUTUBE_PLACEHOLDER_UNAUTHENTICATED: "Please sign in to enable.",
  TRANSCRIPT_PLACEHOLDER_AUTHENTICATED:
    "Paste your full transcript here, or fetch one from a YouTube URL...",
  TRANSCRIPT_PLACEHOLDER_UNAUTHENTICATED: "Please sign in to enable.",
  UPLOAD_PLACEHOLDER_AUTHENTICATED: "MP3, MP4, M4A, WAV supported",
  UPLOAD_PLACEHOLDER_UNAUTHENTICATED: "Please sign in to upload.",

  CHECKING_YOUTUBE:
    "⏳ Getting your video ready... Please allow up to a minute.",
  CHECKING_GENERAL: "⏳ Just a sec while we get this ready…",
  PROCESSING_QUEUE: "⏳ Queuing your analysis—this only takes a moment.",

  PRIVACY_NOTE:
    "Files are deleted immediately after analysis for your privacy.",

  // Toast messages
  ANALYSIS_SUCCESS: "Analysis started successfully!",
  ANALYSIS_SUCCESS_DESCRIPTION: "You can track its progress on your dashboard.",
  FETCH_FAILED: "Fetch Failed",
  CHECK_FAILED: "Check Failed",
  SUBMISSION_FAILED: "Submission Failed",
  PROCESS_FAILED: "Process Failed",
  UPLOAD_COMPLETE: "Upload Complete",
  UPLOAD_COMPLETE_DESCRIPTION:
    "Your files have been submitted and are now being processed.",
  PROCESS_FAILED_DESCRIPTION: "One or more files failed to upload or process.",

  // Error messages
  NO_JOB_ID: "Did not receive a job ID from the server.",
  NO_BATCH_ID: "Did not receive a batch ID from the server.",
  YOUTUBE_FETCH_ERROR: "Failed to fetch video details.",
  PROCESSING_ERROR: "Failed to start processing job.",
  UPLOAD_ERROR: "An error occurred during the upload or processing.",
  DURATION_READ_ERROR: "Could not read file duration.",
  SIGN_IN_REQUIRED: "You must be signed in to upload files.",

  // Status messages
  TRANSCRIPT_LOADED: "Transcript loaded. Ready for analysis.",
  SELECTED_FILES: "Selected Files:",
} as const;

// Model options
export const MODEL_OPTIONS = {
  UNIVERSAL: {
    id: "universal" as ModelChoice,
    label: "Universal",
    description: "For all languages & use cases.",
  },
  SLAM_1: {
    id: "slam-1" as ModelChoice,
    label: "Slam-1",
    description: "Highest accuracy for English.",
  },
};

// Analysis persona options
export const ANALYSIS_PERSONA_OPTIONS = {
  DEEP_DIVE: {
    id: "deep_dive" as AnalysisPersona,
    title: "Deep Dive",
    description:
      "Get the most important information from your content. This analysis provides clear summaries, highlights key takeaways backed by direct quotes, and includes quizzes to help you learn.",
    category: "SIMPLIFIED LEARNING",
    features: [
      "Clear summaries",
      "Key takeaways with supporting quotes",
      "Multiple choice & open-ended quizzes",
    ],
  },
};

// Tab configuration
export const TAB_CONFIG = [
  {
    value: "youtube" as TabType,
    label: "YouTube URL",
    icon: "FaYoutube",
  },
  {
    value: "paste" as TabType,
    label: "Paste Transcript",
    icon: "FileText",
  },
  {
    value: "upload" as TabType,
    label: "Upload Files",
    icon: "UploadCloud",
  },
];

// Status-related configurations
export const WORKING_STATUSES = [
  "processing-batch",
  "uploading",
  "checking",
] as const;

export const SUCCESS_STATUSES = [
  "cost-calculated",
  "metadata-fetched",
] as const;

export const ERROR_STATUSES = ["failed"] as const;
