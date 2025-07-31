import { Zap } from "lucide-react";
import { EditableField } from "../EditableField";

interface NarrativeArcCardProps {
  narrative: string;
  isEditMode: boolean;
  onNarrativeChange: (value: string) => void;
}

export const NarrativeArcCard: React.FC<NarrativeArcCardProps> = ({
  narrative,
  isEditMode,
  onNarrativeChange,
}) => (
  <div className="p-6 bg-white dark:bg-slate-900/70 rounded-lg">
    <h3 className="flex items-center text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200">
      <Zap className="w-5 h-5 mr-3 text-yellow-500" />
      Strategic Narrative Arc
    </h3>
    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
      <EditableField
        isEditing={isEditMode}
        value={narrative}
        onChange={onNarrativeChange}
        isTextarea
        placeholder="Enter the strategic narrative..."
        className="w-full"
      />
    </div>
  </div>
);
