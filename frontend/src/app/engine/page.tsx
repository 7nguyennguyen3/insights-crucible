"use client";

import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ADD_ON_COSTS } from "@/lib/billing";
import { storage } from "@/lib/firebaseClient";
import { ref, uploadBytesResumable } from "firebase/storage";
// --- ADDED ---
import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Clock,
  FileText,
  Globe,
  Lightbulb,
  Loader2,
  LogIn,
  Mic2,
  Newspaper,
  Sparkles,
  Terminal,
  Twitter,
  UploadCloud,
  XCircle,
  Youtube, // Added YouTube icon
} from "lucide-react";
import { UploadProgressToast } from "../components/UploadProgressToast";

type VideoDetails = {
  title: string;
  thumbnailUrl: string;
  duration: string; // To hold the ISO 8601 duration string
};

// Data Types
type FeatureConfig = {
  run_contextual_briefing: boolean;
  run_x_thread_generation: boolean;
  run_blog_post_generation: boolean;
};

type ModelChoice = "universal" | "slam-1";
type AnalysisPersona = "general" | "consultant";

type AddOn = {
  name: string;
  cost: number;
  perFileCost?: number;
};

type CostDetails = {
  totalCost: number;
  breakdown: {
    totalBaseCost: number;
    fileBaseCosts: { fileName?: string; duration: number; cost: number }[];
    addOns: AddOn[];
    totalAddOnCost: number;
  };
  usage: number;
  limitPerCredit: number;
  unit: string;
};

type UiStatus =
  | "idle"
  | "files-selected"
  | "fetching-metadata"
  | "metadata-fetched"
  | "checking"
  | "cost-calculated"
  | "uploading"
  | "processing-batch"
  | "failed";

const featureOptions = [
  {
    id: "run_contextual_briefing",
    icon: Lightbulb,
    title: "5-Angle Perspective",
    description: "Performs a deep, contextual analysis on a key claim.",
    color: "text-amber-500",
  },
  {
    id: "run_x_thread_generation",
    icon: Twitter,
    title: "Generate X/Twitter Thread",
    description: "Creates a ready-to-post thread summarizing the content.",
    color: "text-sky-500",
  },
  {
    id: "run_blog_post_generation",
    icon: Newspaper,
    title: "Generate Blog Post",
    description: "Synthesizes all sections into a full article.",
    color: "text-green-500",
  },
];

const parseAndFormatDuration = (isoDuration: string) => {
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

const EnginePage = () => {
  const { user, loading: authLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const router = useRouter();

  // --- MODIFIED --- Default tab is now youtube
  const [activeTab, setActiveTab] = useState("youtube");
  const [transcript, setTranscript] = useState("");
  const [fileDurations, setFileDurations] = useState<
    { name: string; duration: number }[]
  >([]);
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig>({
    run_contextual_briefing: false,
    run_x_thread_generation: false,
    run_blog_post_generation: false,
  });
  const [modelChoice, setModelChoice] = useState<ModelChoice>("universal");
  const [analysisPersona, setAnalysisPersona] =
    useState<AnalysisPersona>("general");

  const [status, setStatus] = useState<UiStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filesUploaded, setFilesUploaded] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<{
    [fileName: string]: number;
  }>({});

  const [uploadToastId, setUploadToastId] = useState<string | number | null>(
    null
  );
  const [filesInFlight, setFilesInFlight] = useState<File[]>([]);
  const [costDetails, setCostDetails] = useState<CostDetails | null>(null);

  // --- ADDED --- You already added these states
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [isFetchingYouTube, setIsFetchingYouTube] = useState(false);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadToastId || filesInFlight.length === 0) return;
    const isComplete = filesUploaded === filesInFlight.length;
    toast.custom(
      () => (
        <UploadProgressToast
          files={filesInFlight}
          progress={uploadProgress}
          filesUploaded={filesUploaded}
        />
      ),
      {
        id: uploadToastId,
        duration: isComplete ? 5000 : Infinity,
      }
    );

    if (isComplete) {
      toast.custom(
        () => (
          <div className="w-80 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Upload Complete
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Your files have been submitted and are now being processed.
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                router.push("/dashboard");
                toast.dismiss(uploadToastId);
              }}
            >
              Go to Dashboard
            </Button>
          </div>
        ),
        {
          id: uploadToastId,
          duration: 10000,
        }
      );
      setUploadToastId(null);
      setFilesInFlight([]);
    }
  }, [uploadProgress, filesUploaded, uploadToastId, filesInFlight, router]);

  const getAudioDuration = (file: File): Promise<number> => {
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

  const resetState = (tab?: string) => {
    setTranscript("");
    setSelectedFiles([]);
    setFileDurations([]);
    setStatus("idle");
    setError(null);
    setFilesUploaded(0);
    setModelChoice("universal");
    setCostDetails(null);
    setTranscriptId(null);
    setYoutubeUrl("");
    setVideoDetails(null);
    if (tab) setActiveTab(tab);
  };

  const handleFetchYouTubeMetadata = async () => {
    if (!youtubeUrl.trim()) return;

    setStatus("fetching-metadata");
    setError(null);
    setVideoDetails(null);

    try {
      const response = await apiClient.post("/youtube/metadata", {
        youtubeUrl,
      });
      setVideoDetails(response.data);
      setStatus("metadata-fetched"); // Move to the next state
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Failed to fetch video details.";
      toast.error("Fetch Failed", { description: errorMsg });
      setError(errorMsg);
      setStatus("failed");
    }
  };

  const handleYouTubeProcess = async () => {
    setStatus("processing-batch");
    setError(null);
    try {
      const response = await apiClient.post("/process", {
        totalCost: costDetails?.totalCost,
        transcript_id: transcriptId,
        config: { ...featureConfig, analysis_persona: analysisPersona },
        model_choice: modelChoice,
      });

      if (response.data.job_id) {
        toast.success("Analysis started successfully!", {
          description: "You can track its progress on your dashboard.",
          action: {
            label: "Go to Dashboard",
            onClick: () => router.push("/dashboard"),
          },
        });
        resetState(activeTab);
      } else {
        throw new Error("Did not receive a job ID from the server.");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || "Failed to start processing job.";
      toast.error("Submission Failed", { description: errorMsg });
      setError(errorMsg);
      setStatus("failed");
    }
  };

  const handleTextProcess = async () => {
    setStatus("processing-batch");
    setError(null);
    try {
      const response = await apiClient.post("/process", {
        totalCost: costDetails?.totalCost,
        transcript,
        config: { ...featureConfig, analysis_persona: analysisPersona },
        model_choice: "universal",
      });
      if (response.data.job_id) {
        toast.success("Analysis started successfully!", {
          description: "You can track its progress on your dashboard.",
          action: {
            label: "Go to Dashboard",
            onClick: () => router.push("/dashboard"),
          },
        });
        resetState(activeTab);
      } else {
        throw new Error("Did not receive a job ID from the server.");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || "Failed to start processing job.";
      toast.error("Submission Failed", { description: errorMsg });
      setError(errorMsg);
      setStatus("failed");
    }
  };

  const handleCostCalculation = async () => {
    if (activeTab === "youtube") {
      if (!videoDetails) return; // Don't run if metadata hasn't been fetched
      setStatus("checking");
      setError(null);

      try {
        const response = await apiClient.post("/check-analysis", {
          youtubeUrl,
          config: featureConfig,
        });
        setCostDetails(response.data);
        setTranscriptId(response.data.transcript_id); // Save the transcript ID
        setStatus("cost-calculated");
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail || "An unexpected error occurred.";
        toast.error("Check Failed", { description: errorMsg });
        setError(errorMsg);
        setStatus("failed");
      }
      return; // Stop the function here for the YouTube case
    }

    if (!isReadyForAnalysis) return;
    setStatus("checking");
    setError(null);
    setCostDetails(null);
    try {
      let payload = {};
      // --- MODIFIED --- Logic now primarily relies on the paste tab or upload tab
      if (activeTab === "upload") {
        const durationPromises = selectedFiles.map(async (file) => {
          const duration = await getAudioDuration(file);
          return { name: file.name, duration: duration };
        });
        const durationsWithNames = await Promise.all(durationPromises);
        setFileDurations(durationsWithNames);
        payload = {
          durations: durationsWithNames.map((d) => d.duration),
          config: featureConfig,
        };
      } else {
        payload = { character_count: transcript.length, config: featureConfig };
      }
      const response = await apiClient.post("/check-analysis", payload);
      setCostDetails(response.data);
      setStatus("cost-calculated");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "An unexpected error occurred.";
      toast.error("Check Failed", { description: errorMsg });
      setError(errorMsg);
      setStatus("failed");
    }
  };

  const handleBulkUploadAndProcess = async (filesToUpload: File[]) => {
    setStatus("uploading");
    setError(null);
    try {
      const uploadPromises = filesToUpload.map((file, index) => {
        return new Promise<{
          storagePath: string;
          client_provided_id: string;
          duration_seconds: number;
        }>((resolve, reject) => {
          if (!user) {
            return reject(new Error("You must be signed in to upload files."));
          }
          const filePath = `uploads/${user.uid}/${Date.now()}-${file.name}`;
          const storageRef = ref(storage, filePath);
          const uploadTask = uploadBytesResumable(storageRef, file);
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const percentCompleted = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: percentCompleted,
              }));
            },
            (error) => {
              console.error(`Upload failed for ${file.name}:`, error);
              reject(new Error(`Upload failed for ${file.name}.`));
            },
            () => {
              setFilesUploaded((prev) => prev + 1);
              const currentFileDuration =
                fileDurations.find((d) => d.name === file.name)?.duration || 0;
              resolve({
                storagePath: filePath,
                client_provided_id: file.name,
                duration_seconds: currentFileDuration,
              });
            }
          );
        });
      });
      const uploadedItems = await Promise.all(uploadPromises);
      setStatus("processing-batch");
      const processResponse = await apiClient.post("/process-bulk", {
        totalCost: costDetails?.totalCost,
        items: uploadedItems,
        config: { ...featureConfig, analysis_persona: analysisPersona },
        model_choice: modelChoice,
      });
      if (!processResponse.data.batch_id) {
        throw new Error("Did not receive a batch ID from the server.");
      }
      setStatus("idle");
    } catch (err: any) {
      console.error("Bulk upload and process failed:", err);
      if (uploadToastId) {
        toast.error("Process Failed", {
          id: uploadToastId,
          description: "One or more files failed to upload or process.",
        });
      }
      setError("An error occurred during the upload or processing.");
      setStatus("failed");
    }
  };

  const handleProcessConfirmation = () => {
    if (transcriptId) {
      handleYouTubeProcess();
    } else if (activeTab === "paste") {
      handleTextProcess();
    } else {
      const filesToUpload = [...selectedFiles];
      setFilesInFlight(filesToUpload);
      setFilesUploaded(0);
      setUploadProgress({});
      const toastId = toast.custom(
        () => (
          <UploadProgressToast
            files={filesToUpload}
            progress={{}}
            filesUploaded={0}
          />
        ),
        { duration: Infinity }
      );
      setUploadToastId(toastId);
      handleBulkUploadAndProcess(filesToUpload);
      resetState(activeTab);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        setError(
          "One or more files were invalid. Please upload only MP3, MP4, M4A, or WAV files."
        );
        return;
      }
      setError(null);
      setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
      setStatus("files-selected");
    },
    []
  );

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
    setFileDurations((prev) =>
      prev.filter((item) => item.name !== fileToRemove.name)
    );
    if (selectedFiles.length === 1) {
      resetState(activeTab);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/mp4": [".m4a", ".mp4"],
    },
    multiple: true,
    disabled: !user,
  });

  const isWorking =
    status === "processing-batch" ||
    status === "uploading" ||
    status === "checking" ||
    isFetchingYouTube; // Added fetching youtube status
  const canInteract = !isWorking && !!user;

  const isChecking = status === "checking";

  // --- MODIFIED --- `isReadyForAnalysis` now focuses on the "paste" or "upload" tabs being ready.
  // The YouTube tab is just a way to populate the paste tab.
  const isReadyForAnalysis =
    (activeTab === "paste" && transcript.trim() !== "") ||
    (activeTab === "upload" && selectedFiles.length > 0) ||
    (activeTab === "youtube" && !!videoDetails);

  const selectedFeatureCount =
    Object.values(featureConfig).filter(Boolean).length;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Insights Crucible
          </h1>
          <p className="mt-3 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Unlock structured summaries, key concepts, and content ideas from
            your audio, video, or text.
          </p>
        </header>

        {!user && (
          <Alert className="mb-8 max-w-4xl mx-auto bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Welcome!</AlertTitle>
            <AlertDescription className="flex">
              Please{" "}
              <Link href="/auth" className="font-bold underline">
                sign in
              </Link>{" "}
              to analyze your content.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-2xl">Choose Input</CardTitle>
                <CardDescription>
                  Start with a YouTube URL, paste a transcript, or upload files.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  className="w-full"
                  onValueChange={resetState}
                >
                  {/* --- MODIFIED --- TabsList is now 3 columns */}
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="youtube" disabled={!user}>
                      <Youtube className="w-4 h-4 mr-2" />
                      YouTube URL
                    </TabsTrigger>
                    <TabsTrigger value="paste" disabled={!user}>
                      <FileText className="w-4 h-4 mr-2" />
                      Paste Transcript
                    </TabsTrigger>
                    <TabsTrigger value="upload" disabled={!user}>
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Upload Files
                    </TabsTrigger>
                  </TabsList>
                  {/* --- ADDED --- New TabsContent for YouTube */}
                  <TabsContent value="youtube" className="pt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Textarea
                        id="youtube-url"
                        placeholder={
                          user
                            ? "https://www.youtube.com/watch?v=..."
                            : "Please sign in to enable."
                        }
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        disabled={!canInteract}
                        className="flex-grow"
                        rows={1}
                      />
                      <Button
                        onClick={handleFetchYouTubeMetadata} // Use the new metadata function
                        disabled={
                          !canInteract ||
                          !youtubeUrl.trim() ||
                          status === "fetching-metadata"
                        }
                      >
                        {status === "fetching-metadata" ? ( // Show loader for this state
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Fetch Video" // Update label
                        )}
                      </Button>
                    </div>
                    {videoDetails && (
                      <div className="mb-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-4">
                        <Image
                          src={videoDetails.thumbnailUrl}
                          alt={videoDetails.title}
                          width={120}
                          height={90}
                          className="rounded-md object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg leading-tight mb-1">
                            {videoDetails.title}
                          </h4>
                          <div
                            className="flex items-center text-sm font-bold
                           text-slate-500 dark:text-slate-400"
                          >
                            <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span>
                              {parseAndFormatDuration(videoDetails.duration)}
                            </span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                            <CheckCircle className="inline w-4 h-4 mr-1" />
                            Transcript loaded. Ready for analysis.
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="paste" className="pt-4">
                    {/* --- ADDED --- Video details preview in the paste tab */}

                    <Textarea
                      placeholder={
                        user
                          ? "Paste your full transcript here, or fetch one from a YouTube URL..."
                          : "Please sign in to enable."
                      }
                      className="min-h-[200px] max-h-[400px] text-base border-2 focus-visible:ring-blue-500"
                      value={transcript}
                      onChange={(e) => {
                        setTranscript(e.target.value);
                        setStatus("idle");
                        setVideoDetails(null); // Clear video details if user manually edits
                      }}
                      disabled={!canInteract}
                    />
                  </TabsContent>

                  <TabsContent value="upload" className="pt-4">
                    {/* Your existing upload UI - no changes needed here */}
                    <div className="space-y-4">
                      <div
                        {...getRootProps()}
                        className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-colors ${
                          !canInteract
                            ? "cursor-not-allowed bg-slate-100 dark:bg-slate-800/30 text-slate-400"
                            : "cursor-pointer"
                        } ${
                          isDragActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-300 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <UploadCloud className="w-10 h-10 mb-3 text-slate-500" />
                        <p className="text-lg font-semibold">
                          Drag & drop files, or click to select
                        </p>
                        <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
                          {canInteract
                            ? "MP3, MP4, M4A, WAV supported"
                            : "Please sign in to upload."}
                        </p>

                        <p className="text-xs mt-4 text-slate-800 font-semibold">
                          Files are deleted immediately after analysis for your
                          privacy.
                        </p>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Selected Files:</h4>
                          <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {selectedFiles.map((file, index) => (
                              <li
                                key={index}
                                className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-md"
                              >
                                <p className="text-sm truncate pr-2">
                                  {file.name}
                                </p>
                                <button
                                  className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                                  onClick={() => removeFile(file)}
                                >
                                  <XCircle className="w-5 h-5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <RadioGroup
                        defaultValue="universal"
                        value={modelChoice}
                        onValueChange={(value: ModelChoice) =>
                          setModelChoice(value)
                        }
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        disabled={!canInteract}
                      >
                        <Label className="flex items-center space-x-3 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                          <RadioGroupItem value="universal" id="universal" />
                          <div className="flex-1">
                            <p className="font-semibold">Universal</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              For all languages & use cases.
                            </p>
                          </div>
                          <Globe className="w-5 h-5 text-slate-500" />
                        </Label>
                        <Label className="flex items-center space-x-3 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
                          <RadioGroupItem value="slam-1" id="slam-1" />
                          <div className="flex-1">
                            <p className="font-semibold">Slam-1</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Highest accuracy for English.
                            </p>
                          </div>
                          <Mic2 className="w-5 h-5 text-slate-500" />
                        </Label>
                      </RadioGroup>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Other cards remain unchanged */}
            <Card className="shadow-lg border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                  <span>Choose Analysis Type</span>
                </CardTitle>
                <CardDescription>
                  This is a key step. Your choice here will determine the entire
                  format and voice of your generated report.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={analysisPersona}
                  onValueChange={(value: "general" | "consultant") =>
                    setAnalysisPersona(value)
                  }
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  disabled={!canInteract}
                >
                  <Label
                    htmlFor="general"
                    className="flex flex-col items-start space-x-3 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 mr-3 text-slate-600 dark:text-slate-400" />
                        <p className="font-semibold">General Report</p>
                      </div>
                      <RadioGroupItem value="general" id="general" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pl-8">
                      A comprehensive, chronological breakdown. Extracts key
                      points, quotes, and action items, making it perfect for
                      detailed notes or creating a factual record.
                    </p>
                  </Label>

                  <Label
                    htmlFor="consultant"
                    className="flex flex-col items-start space-x-3 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Briefcase className="w-5 h-5 mr-3 text-slate-600 dark:text-slate-400" />
                        <p className="font-semibold">Consultant Workbench</p>
                      </div>
                      <RadioGroupItem value="consultant" id="consultant" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pl-8">
                      Transforms insights into a compelling narrative. Organizes
                      ideas into thematic, presentation-ready slides with
                      strategic recommendations. Ideal for client reports and
                      persuasive storytelling.
                    </p>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="shadow-lg dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Select Add-on Features
                </CardTitle>
                <CardDescription>
                  Choose which additional insights you want to generate.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <TooltipProvider>
                  <div className="flex flex-col">
                    {featureOptions.map((feature, index) => {
                      const isPaidFeature =
                        feature.id === "run_contextual_briefing";
                      const isFeatureDisabled =
                        isPaidFeature && profile?.plan === "free";

                      const featureElement = (
                        <div
                          className={`flex items-center justify-between p-4 transition-colors ${
                            isFeatureDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          } ${
                            index < featureOptions.length - 1
                              ? "border-b border-slate-200 dark:border-slate-800"
                              : ""
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <feature.icon
                              className={`w-6 h-6 flex-shrink-0 ${feature.color}`}
                            />
                            <Label
                              htmlFor={feature.id}
                              className={`font-semibold text-base ${
                                isFeatureDisabled
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              {feature.title}
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                +{" "}
                                {
                                  ADD_ON_COSTS[
                                    feature.id as keyof typeof ADD_ON_COSTS
                                  ]
                                }{" "}
                                credits
                              </span>
                            </Label>
                          </div>
                          <Switch
                            id={feature.id}
                            checked={
                              featureConfig[feature.id as keyof FeatureConfig]
                            }
                            onCheckedChange={(c) => {
                              if (isFeatureDisabled) return;
                              setFeatureConfig((p) => ({
                                ...p,
                                [feature.id]: c,
                              }));
                              setStatus("idle");
                            }}
                            disabled={!canInteract || isFeatureDisabled}
                          />
                        </div>
                      );

                      return (
                        <Tooltip key={feature.id} delayDuration={200}>
                          <TooltipTrigger asChild>
                            {isFeatureDisabled ? (
                              <Link href="/pricing">{featureElement}</Link>
                            ) : (
                              featureElement
                            )}
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start">
                            <p>
                              {isFeatureDisabled
                                ? "This is a premium feature. Click to upgrade."
                                : feature.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 lg:sticky top-24 space-y-6">
            <Card className="shadow-2xl dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-2xl">Launchpad</CardTitle>
                <CardDescription>
                  Review your selections and run the analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Your Selections:</h4>
                <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 text-sm space-y-1">
                  <li>
                    Source: {/* --- MODIFIED --- Source display logic */}
                    {videoDetails
                      ? "YouTube Video"
                      : activeTab === "paste"
                        ? "Pasted Text"
                        : `${selectedFiles.length} File(s)`}
                  </li>
                  <li>
                    Persona:{" "}
                    {analysisPersona === "general"
                      ? "General Report"
                      : "Consultant Workbench"}
                  </li>
                  <li>Add-ons: {selectedFeatureCount} selected</li>
                </ul>

                {status === "cost-calculated" && costDetails && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-sm space-y-1">
                      <h4 className="font-semibold mb-2">Cost Breakdown:</h4>
                      {activeTab === "upload" &&
                      costDetails.breakdown.fileBaseCosts.length > 1 ? (
                        <>
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            Base Analysis (per file):
                          </p>
                          {costDetails.breakdown.fileBaseCosts.map(
                            (fileCost, index) => {
                              const fileName =
                                selectedFiles[index]?.name ||
                                `File ${index + 1}`;
                              const durationMinutes = Math.ceil(
                                fileCost.duration / 60
                              );
                              return (
                                <div
                                  key={`file-base-${index}`}
                                  className="flex justify-between pl-4"
                                >
                                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[calc(100%-80px)]">
                                    {fileName} ({durationMinutes} min)
                                  </span>
                                  <span className="font-medium text-right">
                                    {fileCost.cost.toFixed(2)} credits
                                  </span>
                                </div>
                              );
                            }
                          )}
                          <div className="flex justify-between font-semibold mt-2">
                            <span>Total Base Cost:</span>
                            <span>
                              {costDetails.breakdown.totalBaseCost.toFixed(2)}{" "}
                              credits
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="font-medium">Base Analysis</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {costDetails.breakdown.totalBaseCost === 0.5
                                ? "Small job discount"
                                : costDetails.unit === "audio"
                                  ? `(${Math.ceil(costDetails.usage / 60)} min / ${(costDetails.limitPerCredit / 60).toFixed(0)} min per credit)`
                                  : `(${(costDetails.usage / 1000).toFixed(0)}k chars / ${(costDetails.limitPerCredit / 1000).toFixed(0)}k chars per credit)`}
                            </span>
                          </div>
                          <span className="font-medium">
                            {costDetails.breakdown.totalBaseCost.toFixed(2)}{" "}
                            credits
                          </span>
                        </div>
                      )}
                      {costDetails.breakdown.addOns.length > 0 && (
                        <>
                          <p
                            className={`font-medium ${activeTab === "upload" && selectedFiles.length > 1 ? "mt-4" : ""} text-slate-700 dark:text-slate-300`}
                          >
                            Add-on Features:
                          </p>
                          {costDetails.breakdown.addOns.map((addOn: AddOn) => (
                            <div
                              className="flex justify-between pl-4"
                              key={addOn.name}
                            >
                              <div className="flex flex-col">
                                <span>{addOn.name}</span>
                                {activeTab === "upload" &&
                                  selectedFiles.length > 1 &&
                                  addOn.perFileCost !== undefined && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      ({selectedFiles.length} files x{" "}
                                      {addOn.perFileCost.toFixed(2)}{" "}
                                      credits/file)
                                    </span>
                                  )}
                              </div>
                              <span className="font-medium">
                                + {addOn.cost.toFixed(2)} credits
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold mt-2">
                            <span>Total Add-on Cost:</span>
                            <span>
                              {costDetails.breakdown.totalAddOnCost.toFixed(2)}{" "}
                              credits
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Total Estimated Cost
                      </p>
                      <p className="text-3xl font-bold text-amber-500">
                        {costDetails.totalCost.toFixed(2)}
                        <span className="text-lg font-medium"> Credits</span>
                      </p>
                      {profile && profile.analyses_remaining !== undefined && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          You have {profile.analyses_remaining.toFixed(2)}{" "}
                          credits remaining.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {status === "uploading" && (
                  <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${(filesUploaded / selectedFiles.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                )}
                {error && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex-col space-y-2">
                {status === "cost-calculated" ||
                status === "processing-batch" ? (
                  <>
                    <Button
                      size="lg"
                      className={`w-full ${
                        status === "processing-batch"
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                      onClick={handleProcessConfirmation}
                      disabled={status === "processing-batch"}
                    >
                      {status === "processing-batch" ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Starting Analysis…
                        </>
                      ) : (
                        <>
                          Confirm & Run Analysis
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>

                    {/* ← Inserted helper text here */}
                    {status === "processing-batch" && (
                      <p className="mt-1 text-sm text-slate-500">
                        ⏳ Queuing your analysis—this only takes a moment.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleCostCalculation}
                      disabled={
                        !canInteract || !isReadyForAnalysis || isChecking
                      }
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Estimating…
                        </>
                      ) : (
                        "Check Cost"
                      )}
                    </Button>

                    {isChecking && (
                      <p className="mt-1 text-sm text-slate-500">
                        ⏳ Just a sec while we get this ready…
                      </p>
                    )}
                    {status === "failed" && (
                      <Button
                        size="lg"
                        className="w-full"
                        variant="secondary"
                        onClick={() => resetState(activeTab)}
                      >
                        Start Over
                      </Button>
                    )}
                  </>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EnginePage;
