import { TabType, CostDetails } from "@/types";

interface CostBreakdownProps {
  costDetails: CostDetails | null;
  activeTab: TabType;
  selectedFiles: File[];
  profile: any;
}

export const CostBreakdown = ({ 
  costDetails, 
  activeTab, 
  selectedFiles, 
  profile 
}: CostBreakdownProps) => {
  if (!costDetails) return null;

  const renderFileBreakdown = () => {
    if (activeTab !== "upload" || costDetails.breakdown.fileBaseCosts.length <= 1) {
      return null;
    }

    return (
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
    );
  };

  const renderSingleItemBreakdown = () => {
    if (activeTab === "upload" && costDetails.breakdown.fileBaseCosts.length > 1) {
      return null;
    }

    return (
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
    );
  };

  return (
    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
      <div className="text-sm space-y-1">
        <h4 className="font-semibold mb-2">Cost Breakdown:</h4>
        {renderFileBreakdown()}
        {renderSingleItemBreakdown()}
      </div>

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