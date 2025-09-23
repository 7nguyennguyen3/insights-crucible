"use client";

import React from "react";
import Link from "next/link";
import { Job, JobStatus } from "@/app/_global/interface";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  MoreVertical,
  Trash2,
  Pencil,
  Star,
  Move as MoveIcon,
  Folder as FolderIcon,
  LayoutDashboard,
  Youtube,
  FileAudio,
  User,
  Clock,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatDurationForDisplay } from "@/lib/utils/duration";
import { Folder } from "@/hooks/useFolders";

const getStatusProps = (status: JobStatus) => {
  switch (status) {
    case "COMPLETED":
      return {
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 border-green-300 dark:border-green-700",
        icon: <CheckCircle className="h-4 w-4" />,
      };
    case "PROCESSING":
      return {
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-blue-300 dark:border-blue-700",
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
      };
    case "FAILED":
      return {
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border-red-300 dark:border-red-700",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    default:
      return { variant: "outline", icon: <Loader2 className="w-4 h-4" /> };
  }
};

const getSourceTypeProps = (sourceType?: string) => {
  switch (sourceType) {
    case "youtube":
      return {
        icon: <Youtube className="h-4 w-4" />,
        label: "YouTube",
        color: "text-red-500",
      };
    case "upload":
      return {
        icon: <FileAudio className="h-4 w-4" />,
        label: "Audio File",
        color: "text-blue-500",
      };
    case "paste":
      return {
        icon: <FileText className="h-4 w-4" />,
        label: "Pasted Text",
        color: "text-green-500",
      };
    default:
      return {
        icon: <FileText className="w-5 h-5" />,
        label: "Analysis",
        color: "text-slate-500",
      };
  }
};

interface JobCardProps {
  job: Job;
  folders: Folder[];
  onRename: (job: Job) => void;
  onDelete: (job: Job) => void;
  onToggleStar: (job: Job) => void;
  onMove: (jobId: string, folderId: string | null) => void;
  // Selection props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (jobId: string, selected: boolean) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  folders,
  onRename,
  onDelete,
  onToggleStar,
  onMove,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}) => {
  const statusProps = getStatusProps(job.status);
  const sourceTypeProps = getSourceTypeProps(job.sourceType);
  const isProcessing = job.status === "PROCESSING";

  const handleCardClick = (e: React.MouseEvent) => {
    // Only handle selection if in selection mode and not clicking on buttons/interactive elements
    if (isSelectionMode && onSelect && e.target === e.currentTarget) {
      e.preventDefault();
      onSelect(job.id, !isSelected);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(job.id, checked);
    }
  };

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden transition-all duration-300 py-0 border-slate-200 dark:border-slate-800 hover:shadow-lg dark:bg-slate-900/50",
        isSelectionMode && "cursor-pointer",
        isSelected && "ring-2 ring-blue-500 border-blue-500"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="relative p-0 m-0">
        {/* Selection checkbox */}
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 shadow-sm"
            />
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {!isSelectionMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(job);
              }}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-all",
                  job.isStarred
                    ? "text-amber-500 fill-amber-400"
                    : "text-slate-500"
                )}
                strokeWidth={job.isStarred ? 2.5 : 1.5}
              />
              <span className="sr-only">Toggle Favorite</span>
            </Button>
          )}
          {!isSelectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRename(job)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <MoveIcon className="mr-2 h-4 w-4" />
                  <span>Move to...</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => onMove(job.id, null)}
                    disabled={!job.folderId}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Unfiled
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => onMove(job.id, folder.id)}
                      disabled={job.folderId === folder.id}
                    >
                      <FolderIcon className="mr-2 h-4 w-4" />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => onDelete(job)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="aspect-video w-full overflow-hidden relative">
          {job.sourceType === "youtube" && job.youtubeThumbnailUrl ? (
            <>
              <img
                src={job.youtubeThumbnailUrl}
                alt={job.youtubeVideoName || "YouTube video thumbnail"}
                className="object-cover w-full h-full"
              />
              {job.youtubeChannelName && (
                <div className="absolute bottom-2 left-2 bg-black/80 text-white text-sm px-2 py-1 rounded-md">
                  {job.youtubeChannelName}
                </div>
              )}
              {(job.youtubeDuration || job.durationSeconds) && (
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-sm px-2 py-1 rounded-md font-mono">
                  {formatDurationForDisplay(
                    job.youtubeDuration ?? job.durationSeconds
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <div
                  className={cn(
                    "w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600",
                    sourceTypeProps.color
                  )}
                >
                  {React.cloneElement(sourceTypeProps.icon, {
                    className: "w-6 h-6",
                  })}
                </div>
                <p className="font-medium text-sm">{sourceTypeProps.label}</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow p-4">
        <h3
          className="font-semibold text-lg leading-tight mb-2 text-slate-800 dark:text-slate-100 line-clamp-2"
          title={job.job_title}
        >
          {job.job_title}
        </h3>

        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date(job.createdAt).toLocaleDateString()}
          </p>
          <Badge
            variant="outline"
            className={cn("border-current text-xs", sourceTypeProps.color)}
          >
            {React.cloneElement(sourceTypeProps.icon, { className: "w-3 h-3" })}
            <span className="ml-1.5">{sourceTypeProps.label}</span>
          </Badge>
        </div>

        <div className="flex-grow space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-2 min-h-[3rem]">
          {job.sourceType === "youtube" ? (
            <>
              {job.youtubeVideoName && (
                <div className="flex items-center gap-2">
                  <Youtube className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate" title={job.youtubeVideoName}>
                    {job.youtubeVideoName}
                  </span>
                </div>
              )}
            </>
          ) : job.sourceType === "upload" ? (
            <>
              {job.audioFilename && (
                <div className="flex items-center gap-2">
                  <FileAudio className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate" title={job.audioFilename}>
                    {job.audioFilename}
                  </span>
                </div>
              )}
              {job.durationSeconds && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDurationForDisplay(job.durationSeconds)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate" title="Text-based analysis">
                Text-based analysis
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-4">
            {job.analysisPersona && (
              <Badge variant="secondary" className="text-xs">
                {job.analysisPersona
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                Analysis
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn("w-fit", statusProps.className)}
            >
              {statusProps.icon}
              <span className="ml-2">{job.status}</span>
            </Badge>
          </div>
          {isProcessing && job.progress && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <p className="truncate text-xs">{job.progress}</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-2">
        {job.status === "COMPLETED" && !isSelectionMode ? (
          <Link href={`/results/${job.id}`} className="w-full" passHref>
            <Button className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Results
            </Button>
          </Link>
        ) : (
          <Button className="w-full" disabled={isSelectionMode || job.status !== "COMPLETED"}>
            {job.status === "PROCESSING" && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {job.status === "FAILED" && (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            {job.status === "QUEUED" && <Loader2 className="w-4 h-4 mr-2" />}
            {job.status === "COMPLETED" && isSelectionMode ? "Selected" : job.status}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobCard;
