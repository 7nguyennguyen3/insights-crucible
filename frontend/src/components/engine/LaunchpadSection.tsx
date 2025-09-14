import { Terminal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  TabType, 
  VideoDetails, 
  CostDetails, 
  UiStatus,
  AnalysisPersona 
} from "@/types";
import { useDisplayNames } from "@/hooks/useDisplayNames";
import { CostBreakdown } from "./CostBreakdown";
import { LaunchpadActions } from "./LaunchpadActions";
import { UploadProgress } from "./UploadProgress";

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
  const { sourceDisplayName, personaDisplayName } = useDisplayNames(
    activeTab,
    videoDetails,
    selectedFiles.length,
    analysisPersona
  );

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

        <CostBreakdown 
          costDetails={costDetails}
          activeTab={activeTab}
          selectedFiles={selectedFiles}
          profile={profile}
        />
        
        <UploadProgress 
          status={status}
          filesUploaded={filesUploaded}
          totalFiles={selectedFiles.length}
        />

        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex-col space-y-2">
        <LaunchpadActions 
          status={status}
          activeTab={activeTab}
          canInteract={canInteract}
          isReadyForAnalysis={isReadyForAnalysis}
          isChecking={isChecking}
          onCalculateCost={onCalculateCost}
          onProcessConfirmation={onProcessConfirmation}
          onStartOver={onStartOver}
        />
      </CardFooter>
    </Card>
  );
};