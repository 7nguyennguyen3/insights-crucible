import { Layers, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditableField } from "../EditableField";

interface OverarchingThemesCardProps {
  themes: string[];
  isEditMode: boolean;
  onThemeChange: (index: number, value: string) => void;
  onAddTheme: () => void;
  onDeleteTheme: (index: number) => void;
}

export const OverarchingThemesCard: React.FC<OverarchingThemesCardProps> = ({
  themes,
  isEditMode,
  onThemeChange,
  onAddTheme,
  onDeleteTheme,
}) => (
  <div className="p-6 bg-white dark:bg-slate-900/70 rounded-lg shadow-md">
    <h3 className="flex items-center text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
      <Layers className="w-5 h-5 mr-3 text-indigo-500" />
      Overarching Themes
    </h3>
    <div className="flex flex-wrap gap-3">
      {themes.map((theme, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="text-sm p-2 h-auto whitespace-normal items-start"
        >
          <EditableField
            isEditing={isEditMode}
            value={theme}
            onChange={(newValue) => onThemeChange(index, newValue)}
            onDelete={() => onDeleteTheme(index)}
            className="flex-grow mr-2"
          />
        </Badge>
      ))}
    </div>
    {isEditMode && (
      <Button variant="outline" size="sm" className="mt-4" onClick={onAddTheme}>
        <PlusCircle className="h-4 w-4 mr-2" /> Add Theme
      </Button>
    )}
  </div>
);
