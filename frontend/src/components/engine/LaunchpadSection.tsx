import { ArrowRight, Loader2, Terminal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  TabType, 
  VideoDetails, 
  CostDetails, 
  UiStatus,
  AnalysisPersona 
} from "@/types/engine";
import { getSourceDisplayName } from "@/lib/engine/engineHelpers";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";
import {
  backgroundVariants,
  containerVariants,
  spacingVariants,
  typographyVariants,
  textGradients,
  elevationVariants,
} from "@/styles/variants";

interface LaunchpadSectionProps {
  // State
  activeTab: TabType;
  videoDetails: VideoDetails | null;
  selectedFiles: File[];
  analysisPersona: AnalysisPersona;
  status: UiStatus;
  costDetails: CostDetails | null;
  error: string | null;
  filesUploaded: number;
  profile: any;
  
  // Computed state
  canInteract: boolean;
  isReadyForAnalysis: boolean;
  isChecking: boolean;
  
  // Actions
  onCalculateCost: () => void;
  onProcessConfirmation: () => void;
  onStartOver: () => void;
}

export const LaunchpadSection = ({
  activeTab,
  videoDetails,
  selectedFiles,
  analysisPersona,
  status,
  costDetails,
  error,
  filesUploaded,
  profile,
  canInteract,
  isReadyForAnalysis,
  isChecking,
  onCalculateCost,
  onProcessConfirmation,
  onStartOver,
}: LaunchpadSectionProps) => {
  const sourceDisplayName = getSourceDisplayName(
    activeTab, 
    videoDetails, 
    selectedFiles.length
  );

  const personaDisplayName = analysisPersona === "learning_accelerator"
    ? "Learning Accelerator"
    : analysisPersona === "deep_analysis"
    ? "Deep Analysis"
    : "Learning Accelerator"; // fallback

  const renderCostBreakdown = () => {
    if (!costDetails) return null;

    return (
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="text-sm space-y-1">
          <h4 className="font-semibold mb-2">Cost Breakdown:</h4>
          
          {/* Multi-file upload breakdown */}
          {activeTab === "upload" && costDetails.breakdown.fileBaseCosts.length > 1 ? (
            <>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Analysis (per file):
              </p>
              {costDetails.breakdown.fileBaseCosts.map((fileCost, index) => {
                const fileName = selectedFiles[index]?.name || `File ${index + 1}`;
                const durationMinutes = Math.ceil(fileCost.duration / 60);
                
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
              })}
              <div className="flex justify-between font-semibold mt-2">
                <span>Total Cost:</span>
                <span>
                  {costDetails.breakdown.totalBaseCost.toFixed(2)} credits
                </span>
              </div>
            </>
          ) : (
            /* Single item breakdown */
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-medium">Analysis Cost</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {costDetails.breakdown.totalBaseCost === 0.5
                    ? "Small job discount"
                    : costDetails.unit === "audio"
                      ? `(${Math.ceil(costDetails.usage / 60)} min / ${(costDetails.limitPerCredit / 60).toFixed(0)} min per credit)`
                      : `(${(costDetails.usage / 1000).toFixed(0)}k chars / ${(costDetails.limitPerCredit / 1000).toFixed(0)}k chars per credit)`}
                </span>
              </div>
              <span className="font-medium">
                {costDetails.breakdown.totalBaseCost.toFixed(2)} credits
              </span>
            </div>
          )}
        </div>

        {/* Total cost display */}
        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Estimated Cost
          </p>
          <p className="text-3xl font-bold text-teal-500">
            {costDetails.totalCost.toFixed(2)}
            <span className="text-lg font-medium"> Credits</span>
          </p>
          {profile && profile.analyses_remaining !== undefined && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              You have {profile.analyses_remaining.toFixed(2)} credits remaining.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderUploadProgress = () => {
    if (status !== "uploading") return null;

    return (
      <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{
            width: `${(filesUploaded / selectedFiles.length) * 100}%`,
          }}
        />
      </div>
    );
  };

  const renderActionButtons = () => {
    const isProcessingStates = status === "cost-calculated" || status === "processing-batch";
    
    if (isProcessingStates) {
      return (
        <>
          <Button
            size="lg"
            className={`w-full ${
              status === "processing-batch"
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={onProcessConfirmation}
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

          {status === "processing-batch" && (
            <p className="mt-1 text-sm text-slate-500">
              {UI_MESSAGES.PROCESSING_QUEUE}
            </p>
          )}
        </>
      );
    }

    return (
      <>
        <Button
          size="lg"
          className="w-full"
          onClick={onCalculateCost}
          disabled={!canInteract || !isReadyForAnalysis || isChecking}
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
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            {activeTab === "youtube"
              ? UI_MESSAGES.CHECKING_YOUTUBE
              : UI_MESSAGES.CHECKING_GENERAL}
          </p>
        )}

        {status === "failed" && (
          <Button
            size="lg"
            className="w-full"
            variant="secondary"
            onClick={onStartOver}
          >
            Start Over
          </Button>
        )}
      </>
    );
  };

  return (
    <Card className="shadow-lg dark:bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-2xl">Launchpad</CardTitle>
        <CardDescription>
          Review your selections and run the analysis.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <h4 className="font-semibold">Your Selections:</h4>
        <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 text-sm space-y-1">
          <li>Source: {sourceDisplayName}</li>
          <li>Analysis Type: {personaDisplayName}</li>
        </ul>

        {renderCostBreakdown()}
        {renderUploadProgress()}

        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex-col space-y-2">
        {renderActionButtons()}
      </CardFooter>
    </Card>
  );
};