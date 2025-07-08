import { Lightbulb, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableField } from "../EditableField";

interface UnifyingInsightsCardProps {
  insights: string[];
  isEditMode: boolean;
  onInsightChange: (index: number, value: string) => void;
  onAddInsight: () => void;
  onDeleteInsight: (index: number) => void;
}

export const UnifyingInsightsCard: React.FC<UnifyingInsightsCardProps> = ({
  insights,
  isEditMode,
  onInsightChange,
  onAddInsight,
  onDeleteInsight,
}) => {
  if (!insights && !isEditMode) {
    return null;
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-900/70 rounded-lg shadow-md">
      <h3 className="flex items-center text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
        <Lightbulb className="w-5 h-5 mr-3 text-amber-500" />
        Unifying Insights
      </h3>
      <div className="space-y-4">
        {(insights || []).map((insight, index) => (
          <div
            key={index}
            className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <EditableField
                isEditing={isEditMode}
                value={insight}
                onChange={(newValue) => onInsightChange(index, newValue)}
                onDelete={() => onDeleteInsight(index)}
                isTextarea
              />
            </div>
          </div>
        ))}
      </div>
      {isEditMode && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onAddInsight}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Add Insight
        </Button>
      )}
    </div>
  );
};
