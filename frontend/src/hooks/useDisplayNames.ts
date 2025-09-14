import { TabType, VideoDetails, AnalysisPersona } from "@/types";
import { getSourceDisplayName } from "@/lib/engine/engineHelpers";

export const useDisplayNames = (
  activeTab: TabType,
  videoDetails: VideoDetails | null,
  selectedFilesLength: number,
  analysisPersona: AnalysisPersona
) => {
  const sourceDisplayName = getSourceDisplayName(
    activeTab, 
    videoDetails, 
    selectedFilesLength
  );

  const personaDisplayName = analysisPersona === "deep_dive"
    ? "Deep Dive"
    : analysisPersona === "general"
    ? "General Analysis"
    : analysisPersona === "consultant"
    ? "Consultant Analysis"
    : "Deep Dive"; // fallback

  return {
    sourceDisplayName,
    personaDisplayName,
  };
};