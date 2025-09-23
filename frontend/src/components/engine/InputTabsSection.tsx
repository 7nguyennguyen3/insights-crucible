import { FileText, UploadCloud } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YouTubeTab } from "./YouTubeTab";
import { PasteTab } from "./PasteTab";
import { UploadTab } from "./UploadTab";
import { TabType, VideoDetails, ModelChoice } from "@/types/engine";

interface InputTabsSectionProps {
  activeTab: TabType;
  user: any;
  canInteract: boolean;
  
  // YouTube props
  youtubeUrl: string;
  videoDetails: VideoDetails | null;
  isFetchingMetadata: boolean;
  onUrlChange: (url: string) => void;
  onFetchMetadata: () => void;
  
  // Paste props
  transcript: string;
  onTranscriptChange: (transcript: string) => void;
  
  // Upload props
  selectedFiles: File[];
  modelChoice: ModelChoice;
  isDragActive: boolean;
  dropzoneProps: any;
  onModelChange: (choice: ModelChoice) => void;
  onRemoveFile: (file: File) => void;
  
  onTabChange: (tab: TabType) => void;
}

export const InputTabsSection = ({
  activeTab,
  user,
  canInteract,
  youtubeUrl,
  videoDetails,
  isFetchingMetadata,
  onUrlChange,
  onFetchMetadata,
  transcript,
  onTranscriptChange,
  selectedFiles,
  modelChoice,
  isDragActive,
  dropzoneProps,
  onModelChange,
  onRemoveFile,
  onTabChange,
}: InputTabsSectionProps) => {
  return (
    <Card className="shadow-lg dark:bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-2xl">Choose Input</CardTitle>
        <CardDescription>
          Start with a YouTube URL, paste a transcript, or upload files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          className="w-full"
          onValueChange={(value) => onTabChange(value as TabType)}
        >
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 h-auto sm:h-9 w-full sm:w-fit">
            <TabsTrigger value="youtube" disabled={!user} className="h-10 sm:h-auto">
              <FaYoutube className="w-4 h-4 mr-2" />
              YouTube URL
            </TabsTrigger>
            <TabsTrigger value="paste" disabled={!user} className="h-10 sm:h-auto">
              <FileText className="w-4 h-4 mr-2" />
              Paste Transcript
            </TabsTrigger>
            <TabsTrigger value="upload" disabled={!user} className="h-10 sm:h-auto">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Files
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="youtube">
            <YouTubeTab
              youtubeUrl={youtubeUrl}
              videoDetails={videoDetails}
              isFetchingMetadata={isFetchingMetadata}
              canInteract={canInteract}
              user={user}
              onUrlChange={onUrlChange}
              onFetchMetadata={onFetchMetadata}
            />
          </TabsContent>
          
          <TabsContent value="paste">
            <PasteTab
              transcript={transcript}
              canInteract={canInteract}
              user={user}
              onTranscriptChange={onTranscriptChange}
            />
          </TabsContent>
          
          <TabsContent value="upload">
            <UploadTab
              selectedFiles={selectedFiles}
              modelChoice={modelChoice}
              canInteract={canInteract}
              user={user}
              isDragActive={isDragActive}
              dropzoneProps={dropzoneProps}
              onModelChange={onModelChange}
              onRemoveFile={onRemoveFile}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};