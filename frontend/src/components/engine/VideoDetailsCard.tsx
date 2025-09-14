import Image from "next/image";
import { Clock, CheckCircle, User } from "lucide-react";
import { VideoDetails } from "@/types/engine";
import { parseAndFormatDuration } from "@/lib/engine/engineHelpers";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

interface VideoDetailsCardProps {
  videoDetails: VideoDetails;
  className?: string;
}

export const VideoDetailsCard = ({ videoDetails, className = "" }: VideoDetailsCardProps) => {
  return (
    <div className={`mb-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-4 ${className}`}>
      <Image
        src={videoDetails.thumbnailUrl}
        alt={videoDetails.title}
        width={120}
        height={90}
        className="rounded-md object-cover flex-shrink-0"
      />
      <div className="flex-1">
        <h4 className="font-semibold text-lg leading-tight mb-1">
          {videoDetails.title}
        </h4>
        <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
          <User className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span>
            {videoDetails.channelName}
          </span>
        </div>
        <div className="flex items-center text-sm font-bold text-slate-500 dark:text-slate-400">
          <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span>
            {parseAndFormatDuration(videoDetails.duration)}
          </span>
        </div>
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          <CheckCircle className="inline w-4 h-4 mr-1" />
          {UI_MESSAGES.TRANSCRIPT_LOADED}
        </p>
      </div>
    </div>
  );
};