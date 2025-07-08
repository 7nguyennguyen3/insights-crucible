import { GitCompareArrows, PlusCircle } from "lucide-react";
import { Contradiction } from "@/app/_global/interface";
import { Button } from "@/components/ui/button";
import { EditableField } from "../EditableField";

interface KeyContradictionsCardProps {
  contradictions: Contradiction[];
  isEditMode: boolean;
  onContradictionChange: (
    index: number,
    prop: keyof Contradiction,
    value: string
  ) => void;
  onAddContradiction: () => void;
  onDeleteContradiction: (index: number) => void;
}

export const KeyContradictionsCard: React.FC<KeyContradictionsCardProps> = ({
  contradictions,
  isEditMode,
  onContradictionChange,
  onAddContradiction,
  onDeleteContradiction,
}) => (
  <div className="p-6 bg-white dark:bg-slate-900/70 rounded-lg shadow-md">
    <h3 className="flex items-center text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
      <GitCompareArrows className="w-5 h-5 mr-3 text-red-500" />
      Key Contradictions
    </h3>
    <div className="space-y-6">
      {contradictions.map((item, index) => (
        <div
          key={index}
          className="border-t border-slate-200 dark:border-slate-700 pt-4"
        >
          <div className="grid md:grid-cols-2 gap-4 items-start">
            <div className="italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded">
              <EditableField
                isEditing={isEditMode}
                value={item.point_a}
                onChange={(v) => onContradictionChange(index, "point_a", v)}
                isTextarea
              />
            </div>
            <div className="italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded">
              <EditableField
                isEditing={isEditMode}
                value={item.point_b}
                onChange={(v) => onContradictionChange(index, "point_b", v)}
                isTextarea
              />
            </div>
          </div>
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border-l-4 border-red-400">
            <div className="text-sm text-red-800 dark:text-red-200">
              <span className="font-semibold">Analysis:</span>
              <EditableField
                isEditing={isEditMode}
                value={item.analysis}
                onChange={(v) => onContradictionChange(index, "analysis", v)}
                onDelete={() => onDeleteContradiction(index)}
                isTextarea
              />
            </div>
          </div>
        </div>
      ))}
    </div>
    {isEditMode && (
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={onAddContradiction}
      >
        <PlusCircle className="h-4 w-4 mr-2" /> Add Contradiction
      </Button>
    )}
  </div>
);
