import { UiStatus } from "@/types";

interface UploadProgressProps {
  status: UiStatus;
  filesUploaded: number;
  totalFiles: number;
}

export const UploadProgress = ({ status, filesUploaded, totalFiles }: UploadProgressProps) => {
  if (status !== "uploading") return null;

  const progressPercentage = (filesUploaded / totalFiles) * 100;

  return (
    <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
};