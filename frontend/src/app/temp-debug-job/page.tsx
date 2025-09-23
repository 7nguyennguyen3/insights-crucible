"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JsonViewer } from "@/components/ui/json-viewer";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { 
  Loader2, 
  Copy, 
  Check, 
  AlertCircle,
  Database,
  Search,
  Eye
} from "lucide-react";

export default function TempDebugJobPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [jobId, setJobId] = useState("");
  const [jobData, setJobData] = useState<any>(null);
  const [gradingJobId, setGradingJobId] = useState("");
  const [collectionData, setCollectionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollectionLoading, setIsCollectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [hasCopiedSimplified, setHasCopiedSimplified] = useState(false);
  const [hasCollectionCopied, setHasCollectionCopied] = useState(false);

  const fetchJobData = async () => {
    if (!jobId.trim()) {
      setError("Please enter a Job ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setJobData(null);

    try {
      const response = await fetch(`/api/temp-debug-job/${jobId.trim()}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setJobData(data);
      toast.success("Job data fetched successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch job data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollectionData = async () => {
    if (!gradingJobId.trim()) {
      setCollectionError("Please enter a grading job ID");
      return;
    }

    setIsCollectionLoading(true);
    setCollectionError(null);
    setCollectionData(null);

    try {
      const response = await fetch(`/api/temp-debug-collection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ gradingJobId: gradingJobId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setCollectionData(data);
      toast.success("Grading job data fetched successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch grading job data";
      setCollectionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCollectionLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!jobData) return;

    try {
      // Remove 'words' field from structured_transcript if it exists, but keep full transcript
      const cleanedData = {
        ...jobData,
        main_document: jobData.main_document ? {
          ...jobData.main_document,
          data: jobData.main_document.data ? {
            ...jobData.main_document.data,
            structured_transcript: jobData.main_document.data.structured_transcript?.map((item: any) => {
              const { words, ...itemWithoutWords } = item;
              return itemWithoutWords;
            }) || jobData.main_document.data.structured_transcript
          } : jobData.main_document.data
        } : jobData.main_document
      };

      await navigator.clipboard.writeText(JSON.stringify(cleanedData, null, 2));
      setHasCopied(true);
      toast.success("Full JSON copied to clipboard (words field removed from transcript)");
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copySimplifiedToClipboard = async () => {
    if (!jobData) return;

    try {
      // Create a simplified version with only first 5 transcript items and remove 'words' field
      const simplifiedData = {
        ...jobData,
        main_document: jobData.main_document ? {
          ...jobData.main_document,
          data: jobData.main_document.data ? {
            ...jobData.main_document.data,
            transcript: jobData.main_document.data.transcript && Array.isArray(jobData.main_document.data.transcript)
              ? jobData.main_document.data.transcript.slice(0, 5)
              : jobData.main_document.data.transcript,
            structured_transcript: jobData.main_document.data.structured_transcript?.slice(0, 5).map((item: any) => {
              const { words, ...itemWithoutWords } = item;
              return itemWithoutWords;
            }) || jobData.main_document.data.structured_transcript
          } : jobData.main_document.data
        } : jobData.main_document
      };

      await navigator.clipboard.writeText(JSON.stringify(simplifiedData, null, 2));
      setHasCopiedSimplified(true);
      toast.success("Simplified JSON copied to clipboard (words field removed from transcript)");
      setTimeout(() => setHasCopiedSimplified(false), 2000);
    } catch (err) {
      toast.error("Failed to copy simplified JSON to clipboard");
    }
  };

  const copyCollectionToClipboard = async () => {
    if (!collectionData) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(collectionData, null, 2));
      setHasCollectionCopied(true);
      toast.success("Grading job JSON copied to clipboard");
      setTimeout(() => setHasCollectionCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              🔧 Temporary Debug Tool - Job Data Inspector
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Enter a Job ID to fetch and inspect the raw JSON data structure
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Fetch Job Data
            </CardTitle>
            <CardDescription>
              Enter a Job ID to retrieve the complete raw data structure from Firestore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Job ID
                </label>
                <Input
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  placeholder="Enter job ID (e.g., abc123def456...)"
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      fetchJobData();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={fetchJobData} 
                disabled={isLoading || !jobId.trim()}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Fetch
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grading Job Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Fetch Grading Job Data
            </CardTitle>
            <CardDescription>
              Enter a grading job ID to retrieve raw JSON data from your grading_jobs collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Grading Job ID
                </label>
                <Input
                  value={gradingJobId}
                  onChange={(e) => setGradingJobId(e.target.value)}
                  placeholder="0xb77Wwiw9sAaWRjbN7M"
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      fetchCollectionData();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={fetchCollectionData} 
                disabled={isCollectionLoading || !gradingJobId.trim()}
                className="min-w-[100px]"
              >
                {isCollectionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Fetch
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Job Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {collectionError && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Grading Job Error:</strong> {collectionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {jobData && (
          <div className="space-y-6">
            {/* Formatted JSON Viewer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Formatted Data Viewer
                </CardTitle>
                <CardDescription>
                  Interactive JSON viewer with collapsible sections for easier data exploration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JsonViewer data={jobData} />
              </CardContent>
            </Card>

            {/* Raw JSON Data */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-green-500" />
                      Raw Job Data
                    </CardTitle>
                    <CardDescription>
                      Job ID: <code className="text-sm bg-slate-100 dark:bg-slate-800 px-1 rounded">{jobData.main_document?.document_id}</code>
                      {jobData.main_document?.data?.job_title && (
                        <>
                          {" • "}
                          Title: <span className="font-medium">{jobData.main_document.data.job_title}</span>
                        </>
                      )}
                      <br />
                      Path: <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">{jobData.main_document?.path}</code>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy JSON
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={copySimplifiedToClipboard}
                      variant="outline"
                      size="sm"
                    >
                      {hasCopiedSimplified ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Simplified!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy JSON Simplified
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <pre className="text-sm text-slate-100 whitespace-pre-wrap break-all">
                    {JSON.stringify(jobData, null, 2)}
                  </pre>
                </div>
                <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  <strong>Total data size:</strong> {new Blob([JSON.stringify(jobData)]).size.toLocaleString()} bytes
                  {" • "}
                  <strong>Main document keys:</strong> {jobData.main_document?.data ? Object.keys(jobData.main_document.data).length : 0}
                  {jobData.subcollections?.results && (
                    <>
                      {" • "}
                      <strong>Results subcollection:</strong> {jobData.subcollections.results.document_count} documents
                    </>
                  )}
                  {jobData.subcollections?.open_ended_questions && (
                    <>
                      {" • "}
                      <strong>Open-ended questions subcollection:</strong> {jobData.subcollections.open_ended_questions.document_count} documents
                    </>
                  )}
                  {jobData.main_document?.data?.transcript && Array.isArray(jobData.main_document.data.transcript) && (
                    <>
                      {" • "}
                      <strong>Transcript:</strong> {jobData.main_document.data.transcript.length} items (truncated to first 5)
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grading Job Data Results Section */}
        {collectionData && (
          <div className="space-y-6">
            {/* Raw Grading Job JSON Data */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-500" />
                      Raw Grading Job Data
                    </CardTitle>
                    <CardDescription>
                      Path: <code className="text-sm bg-slate-100 dark:bg-slate-800 px-1 rounded">{collectionData.path}</code>
                      {collectionData.id && (
                        <>
                          {" • "}
                          Job ID: <span className="font-medium">{collectionData.id}</span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={copyCollectionToClipboard}
                    variant="outline"
                    size="sm"
                  >
                    {hasCollectionCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <pre className="text-sm text-slate-100 whitespace-pre-wrap break-all">
                    {JSON.stringify(collectionData, null, 2)}
                  </pre>
                </div>
                <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  <strong>Data size:</strong> {new Blob([JSON.stringify(collectionData)]).size.toLocaleString()} bytes
                  {" • "}
                  <strong>Keys:</strong> {Object.keys(collectionData).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}