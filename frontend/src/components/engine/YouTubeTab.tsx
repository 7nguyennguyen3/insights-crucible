import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VideoDetailsCard } from "./VideoDetailsCard";
import { VideoDetails } from "@/types/engine";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

interface YouTubeTabProps {
  youtubeUrl: string;
  videoDetails: VideoDetails | null;
  isFetchingMetadata: boolean;
  canInteract: boolean;
  user: any;
  onUrlChange: (url: string) => void;
  onFetchMetadata: () => void;
}

export const YouTubeTab = ({
  youtubeUrl,
  videoDetails,
  isFetchingMetadata,
  canInteract,
  user,
  onUrlChange,
  onFetchMetadata,
}: YouTubeTabProps) => {
  return (
    <div className="pt-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Textarea
          id="youtube-url"
          placeholder={
            user
              ? UI_MESSAGES.YOUTUBE_PLACEHOLDER_AUTHENTICATED
              : UI_MESSAGES.YOUTUBE_PLACEHOLDER_UNAUTHENTICATED
          }
          value={youtubeUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={!canInteract}
          className="flex-grow"
          rows={1}
        />
        <Button
          onClick={onFetchMetadata}
          disabled={
            !canInteract ||
            !youtubeUrl.trim() ||
            isFetchingMetadata
          }
        >
          {isFetchingMetadata ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Fetch Video"
          )}
        </Button>
      </div>
      {videoDetails && (
        <VideoDetailsCard videoDetails={videoDetails} />
      )}
    </div>
  );
};