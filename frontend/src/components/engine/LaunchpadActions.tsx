import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabType, UiStatus } from "@/types";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

interface LaunchpadActionsProps {
  status: UiStatus;
  activeTab: TabType;
  canInteract: boolean;
  isReadyForAnalysis: boolean;
  isChecking: boolean;
  onCalculateCost: () => void;
  onProcessConfirmation: () => void;
  onStartOver: () => void;
}

export const LaunchpadActions = ({
  status,
  activeTab,
  canInteract,
  isReadyForAnalysis,
  isChecking,
  onCalculateCost,
  onProcessConfirmation,
  onStartOver,
}: LaunchpadActionsProps) => {
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