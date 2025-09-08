import { Textarea } from "@/components/ui/textarea";
import { UI_MESSAGES } from "@/lib/engine/engineConstants";

interface PasteTabProps {
  transcript: string;
  canInteract: boolean;
  user: any;
  onTranscriptChange: (transcript: string) => void;
}

export const PasteTab = ({
  transcript,
  canInteract,
  user,
  onTranscriptChange,
}: PasteTabProps) => {
  return (
    <div className="pt-4">
      <Textarea
        placeholder={
          user
            ? UI_MESSAGES.TRANSCRIPT_PLACEHOLDER_AUTHENTICATED
            : UI_MESSAGES.TRANSCRIPT_PLACEHOLDER_UNAUTHENTICATED
        }
        className="min-h-[200px] max-h-[400px] text-base border-2 focus-visible:ring-blue-500"
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        disabled={!canInteract}
      />
    </div>
  );
};