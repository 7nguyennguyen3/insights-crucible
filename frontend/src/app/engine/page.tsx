"use client";

import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
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
import {
  ArrowRight,
  Briefcase, // <-- Added Icon
  DollarSign,
  FileText,
  Globe,
  Lightbulb,
  Loader2,
  LogIn,
  Mic2,
  Newspaper,
  Twitter,
  UploadCloud,
  XCircle,
  Terminal,
  Check,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { UploadProgressToast } from "../components/UploadProgressToast";
import { ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";

// Data Types
type FeatureConfig = {
  run_contextual_briefing: boolean;
  run_x_thread_generation: boolean;
  run_blog_post_generation: boolean;
};

type ModelChoice = "universal" | "slam-1";
type AnalysisPersona = "general" | "consultant"; // <-- New Type

type UiStatus =
  | "idle"
  | "files-selected"
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

const EnginePage = () => {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("paste");
  const [transcript, setTranscript] = useState("");
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig>({
    run_contextual_briefing: false,
    run_x_thread_generation: false,
    run_blog_post_generation: false,
  });
  const [modelChoice, setModelChoice] = useState<ModelChoice>("universal");

  // --- ADDED: New state for analysis persona selection ---
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

  const [costDetails, setCostDetails] = useState<any | null>(null);

  useEffect(() => {
    // If there's no active upload toast, do nothing
    if (!uploadToastId || filesInFlight.length === 0) return;

    const isComplete = filesUploaded === filesInFlight.length;

    // Re-render the toast with the latest progress using the same ID
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
        duration: isComplete ? 5000 : Infinity, // Keep open until complete
      }
    );

    // When all files are uploaded, show the final success message and clean up
    if (isComplete) {
      // Use toast.custom for the final message to get full styling control
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
                toast.dismiss(uploadToastId); // Dismiss toast on click
              }}
            >
              Go to Dashboard
            </Button>
          </div>
        ),
        {
          id: uploadToastId,
          duration: 10000, // Let it stay on screen for 10 seconds
        }
      );

      // Reset state for the next upload batch
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
    setStatus("idle");
    setError(null);
    setFilesUploaded(0);
    setModelChoice("universal");
    if (tab) setActiveTab(tab);
  };

  const handleTextProcess = async () => {
    setStatus("processing-batch");
    setError(null);
    try {
      const response = await apiClient.post("/process", {
        transcript,
        config: { ...featureConfig, analysis_persona: analysisPersona }, // <-- MODIFIED
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
    if (!isReadyForAnalysis) return;

    setStatus("checking");
    setError(null);
    setCostDetails(null);

    try {
      let payload = {};
      if (activeTab === "upload") {
        const durationPromises = selectedFiles.map(getAudioDuration);
        const durations = await Promise.all(durationPromises);
        // Send the array of durations, not the summed total
        payload = { durations: durations };
      } else {
        payload = { character_count: transcript.length };
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
    // All toast management is now handled by the useEffect hook.

    try {
      const uploadPromises = filesToUpload.map((file) => {
        return new Promise<{ storagePath: string; client_provided_id: string }>(
          (resolve, reject) => {
            if (!user) {
              console.error("Upload attempted without a logged-in user.");
              return reject(
                new Error("You must be signed in to upload files.")
              );
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
                // Update state, which will trigger our useEffect to update the toast
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
                // Update state, which also triggers the useEffect
                setFilesUploaded((prev) => prev + 1);
                resolve({
                  storagePath: filePath,
                  client_provided_id: file.name,
                });
              }
            );
          }
        );
      });

      const uploadedItems = await Promise.all(uploadPromises);

      // The useEffect will handle the "Upload Complete" toast.
      setStatus("processing-batch");

      const processResponse = await apiClient.post("/process-bulk", {
        items: uploadedItems,
        config: { ...featureConfig, analysis_persona: analysisPersona },
        model_choice: modelChoice,
      });

      if (!processResponse.data.batch_id) {
        throw new Error("Did not receive a batch ID from the server.");
      }
      setStatus("idle");
      // The success toast is now handled by the completion logic in our useEffect.
    } catch (err: any) {
      console.error("Bulk upload and process failed:", err);
      // If the process fails, update the toast to show an error.
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
    if (activeTab === "paste") {
      handleTextProcess();
    } else {
      const filesToUpload = [...selectedFiles];
      setFilesInFlight(filesToUpload); // Track the files for the useEffect

      // Reset progress state for the new batch
      setFilesUploaded(0);
      setUploadProgress({});

      // Create the initial toast and get its ID
      const toastId = toast.custom(
        () => (
          <UploadProgressToast
            files={filesToUpload}
            progress={{}} // Initial empty progress
            filesUploaded={0} // Initial zero files uploaded
          />
        ),
        { duration: Infinity } // Keep it open until we manually update/dismiss it
      );

      setUploadToastId(toastId); // Save the ID to state, which triggers our useEffect

      // Start the upload process in the background
      handleBulkUploadAndProcess(filesToUpload);

      // Immediately reset the main UI to unblock the user
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
    status === "checking";
  const canInteract = !isWorking && !!user;
  const isReadyForAnalysis =
    (activeTab === "paste" && transcript.trim() !== "") ||
    (activeTab === "upload" && selectedFiles.length > 0);
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
            <AlertDescription>
              Please{" "}
              <Link href="/auth/signin" className="font-bold underline">
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
                  Start by uploading files or pasting a transcript.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  className="w-full"
                  onValueChange={resetState}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="paste" disabled={!user}>
                      <FileText className="w-4 h-4 mr-2" />
                      Paste Transcript (Single)
                    </TabsTrigger>
                    <TabsTrigger value="upload" disabled={!user}>
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Upload Files (Bulk)
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="paste" className="pt-4">
                    <Textarea
                      placeholder={
                        user
                          ? "Paste your full transcript here..."
                          : "Please sign in to enable."
                      }
                      className="min-h-[200px] max-h-[400px] text-base border-2 focus-visible:ring-blue-500"
                      value={transcript}
                      onChange={(e) => {
                        setTranscript(e.target.value);
                        setStatus("idle");
                      }}
                      disabled={!canInteract}
                    />
                  </TabsContent>
                  <TabsContent value="upload" className="pt-4">
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

            {/* --- ADDED: New Card for Step 2 --- */}
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
                {/* All the inner content (RadioGroup, Labels, etc.) remains exactly the same. */}
                <RadioGroup
                  value={analysisPersona}
                  onValueChange={(value: "general" | "consultant") =>
                    setAnalysisPersona(value)
                  }
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  disabled={!canInteract}
                >
                  {/* --- General Report Option --- */}
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
                    {/* ✅ NEW DESCRIPTION */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pl-8">
                      A comprehensive, chronological breakdown. Extracts key
                      points, quotes, and action items, making it perfect for
                      detailed notes or creating a factual record.
                    </p>
                  </Label>

                  {/* --- Consultant Workbench Option --- */}
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
                    {/* ✅ NEW DESCRIPTION */}
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

            {/* --- MODIFIED: Renumbered to Step 3 --- */}
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
                    {featureOptions.map((feature, index) => (
                      <Tooltip key={feature.id} delayDuration={200}>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
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
                                className="font-semibold text-base cursor-pointer"
                              >
                                {feature.title}
                              </Label>
                            </div>
                            <Switch
                              id={feature.id}
                              checked={
                                featureConfig[feature.id as keyof FeatureConfig]
                              }
                              onCheckedChange={(c) => {
                                setFeatureConfig((p) => ({
                                  ...p,
                                  [feature.id]: c,
                                }));
                                setStatus("idle");
                              }}
                              disabled={!canInteract}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start">
                          <p>{feature.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar Column */}
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
                    Source:{" "}
                    {activeTab === "paste"
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
                    {/* The main result, big and clear */}
                    <div className="text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        This analysis will use
                      </p>
                      <p className="text-3xl font-bold text-amber-500">
                        {costDetails.calculatedCost}
                        <span className="text-lg font-medium">
                          {costDetails.calculatedCost > 1
                            ? " credits"
                            : " credit"}
                        </span>
                      </p>
                    </div>

                    {/* The "Why" - only shown if cost is > 1 */}
                    {costDetails.calculatedCost > 1 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 rounded-md p-2 text-center">
                        <p className="font-semibold">Here's the breakdown:</p>

                        {/* Special message for multiple files */}
                        {costDetails.unit === "audio" &&
                        selectedFiles.length > 1 ? (
                          <p>
                            Each of your{" "}
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {selectedFiles.length} files
                            </span>{" "}
                            costs a minimum of 1 credit. Longer files may cost
                            more.
                          </p>
                        ) : (
                          // The original message for single files or text
                          <p>
                            {`Your submission is `}
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {costDetails.unit === "audio"
                                ? `${Math.ceil(costDetails.usage / 60)} minutes`
                                : `${costDetails.usage.toLocaleString()} characters`}
                            </span>
                            {`. Our system uses 1 credit per `}
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {costDetails.unit === "audio"
                                ? `${costDetails.limitPerCredit / 60} minutes`
                                : `${costDetails.limitPerCredit.toLocaleString()} characters`}
                            </span>
                            {` (or part thereof).`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Bar for uploads */}
                {status === "uploading" && (
                  <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${
                          (filesUploaded / selectedFiles.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                )}

                {/* Error message display */}
                {error && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex-col space-y-2">
                {/* The button is now dynamic based on the UI status */}
                {status !== "cost-calculated" ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleCostCalculation}
                    disabled={!canInteract || !isReadyForAnalysis || isWorking}
                  >
                    {isWorking && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    {isWorking ? "Checking..." : "Check Requirements"}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleProcessConfirmation}
                  >
                    Confirm & Run Analysis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
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
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EnginePage;
