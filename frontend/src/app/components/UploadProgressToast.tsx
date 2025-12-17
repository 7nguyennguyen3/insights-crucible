import { Loader2, CheckCircle, FileArchive } from "lucide-react";

interface UploadProgressToastProps {
  files: File[];
  progress: { [fileName: string]: number };
  filesUploaded: number;
}

export const UploadProgressToast = ({
  files,
  progress,
  filesUploaded,
}: UploadProgressToastProps) => {
  const isComplete = filesUploaded === files.length;

  // Helper to determine stage based on progress
  const getStage = (percent: number) => {
    if (percent < 50) return "Compressing...";
    if (percent < 100) return "Uploading...";
    return "Complete";
  };

  return (
    <div className="w-80 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center mb-2">
        {isComplete ? (
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
        ) : (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        )}
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          {isComplete
            ? "Upload Complete"
            : `Processing ${files.length} file(s)...`}
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {isComplete
          ? "Your files are now being analyzed."
          : "Compressing and uploading your files. Please keep this tab open."}
      </p>
      <div className="space-y-3">
        {files.map((file) => {
          const fileProgress = progress[file.name] || 0;
          const stage = getStage(fileProgress);
          const showCompressing = fileProgress < 50;

          return (
            <div key={file.name}>
              <div className="flex justify-between text-xs mb-1">
                <div className="flex items-center gap-1 truncate pr-4">
                  {showCompressing && <FileArchive className="w-3 h-3 text-purple-500 flex-shrink-0" />}
                  <p className="truncate text-slate-600 dark:text-slate-300">
                    {file.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-500">{stage}</span>
                  <span className="font-medium">{fileProgress}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-600">
                <div
                  className={`h-1.5 rounded-full transition-all duration-150 ${
                    showCompressing ? "bg-purple-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${fileProgress}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
