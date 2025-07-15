import { Loader2, CheckCircle } from "lucide-react";

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
            : `Uploading ${files.length} file(s)...`}
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {isComplete
          ? "Your files are now being processed."
          : "Please keep this tab open until the upload finishes."}
      </p>
      <div className="space-y-3">
        {files.map((file) => (
          <div key={file.name}>
            <div className="flex justify-between text-xs mb-1">
              <p className="truncate pr-4 text-slate-600 dark:text-slate-300">
                {file.name}
              </p>
              <p className="font-medium">{progress[file.name] || 0}%</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-600">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-150"
                style={{ width: `${progress[file.name] || 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
