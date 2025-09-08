import { UploadCloud, Globe, Mic2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ModelChoice } from "@/types/engine";
import { MODEL_OPTIONS, UI_MESSAGES } from "@/lib/engine/engineConstants";
import { formatFileSize } from "@/lib/engine/engineHelpers";

interface UploadTabProps {
  selectedFiles: File[];
  modelChoice: ModelChoice;
  canInteract: boolean;
  user: any;
  isDragActive: boolean;
  dropzoneProps: any;
  onModelChange: (choice: ModelChoice) => void;
  onRemoveFile: (file: File) => void;
}

export const UploadTab = ({
  selectedFiles,
  modelChoice,
  canInteract,
  user,
  isDragActive,
  dropzoneProps,
  onModelChange,
  onRemoveFile,
}: UploadTabProps) => {
  const { getRootProps, getInputProps } = dropzoneProps;

  return (
    <div className="pt-4">
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
              ? UI_MESSAGES.UPLOAD_PLACEHOLDER_AUTHENTICATED
              : UI_MESSAGES.UPLOAD_PLACEHOLDER_UNAUTHENTICATED}
          </p>
          <p className="text-xs mt-4 text-slate-800 font-semibold">
            {UI_MESSAGES.PRIVACY_NOTE}
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">{UI_MESSAGES.SELECTED_FILES}</h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {selectedFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-md"
                >
                  <div className="flex flex-col flex-1 pr-2">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                    onClick={() => onRemoveFile(file)}
                  >
                    <XCircle className="w-5 h-5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <RadioGroup
          value={modelChoice}
          onValueChange={(value: ModelChoice) => onModelChange(value)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          disabled={!canInteract}
        >
          <Label className="flex items-center space-x-3 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
            <RadioGroupItem value="universal" id="universal" />
            <div className="flex-1">
              <p className="font-semibold">{MODEL_OPTIONS.UNIVERSAL.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {MODEL_OPTIONS.UNIVERSAL.description}
              </p>
            </div>
            <Globe className="w-5 h-5 text-slate-500" />
          </Label>
          <Label className="flex items-center space-x-3 p-4 rounded-lg border bg-white dark:bg-slate-900 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
            <RadioGroupItem value="slam-1" id="slam-1" />
            <div className="flex-1">
              <p className="font-semibold">{MODEL_OPTIONS.SLAM_1.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {MODEL_OPTIONS.SLAM_1.description}
              </p>
            </div>
            <Mic2 className="w-5 h-5 text-slate-500" />
          </Label>
        </RadioGroup>
      </div>
    </div>
  );
};