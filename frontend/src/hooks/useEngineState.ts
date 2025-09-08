import { useState, useCallback } from "react";
import {
  EngineState,
  TabType,
  ModelChoice,
  AnalysisPersona,
  UiStatus,
  CostDetails,
  VideoDetails,
  FileDuration,
  UploadProgress
} from "@/types/engine";
import {
  DEFAULT_MODEL_CHOICE,
  DEFAULT_ANALYSIS_PERSONA,
  DEFAULT_TAB
} from "@/lib/engine/engineConstants";

interface UseEngineStateReturn {
  state: EngineState;
  actions: {
    setActiveTab: (tab: TabType) => void;
    setTranscript: (transcript: string) => void;
    setModelChoice: (choice: ModelChoice) => void;
    setAnalysisPersona: (persona: AnalysisPersona) => void;
    setStatus: (status: UiStatus) => void;
    setError: (error: string | null) => void;
    setCostDetails: (details: CostDetails | null) => void;
    setYouTubeUrl: (url: string) => void;
    setVideoDetails: (details: VideoDetails | null) => void;
    setIsFetchingYouTube: (fetching: boolean) => void;
    setTranscriptId: (id: string | null) => void;
    setSelectedFiles: (files: File[]) => void;
    addSelectedFiles: (files: File[]) => void;
    removeSelectedFile: (file: File) => void;
    setFileDurations: (durations: FileDuration[]) => void;
    setFilesUploaded: (count: number) => void;
    incrementFilesUploaded: () => void;
    setUploadProgress: (progress: UploadProgress) => void;
    updateUploadProgress: (fileName: string, progress: number) => void;
    setFilesInFlight: (files: File[]) => void;
    setUploadToastId: (id: string | number | null) => void;
    resetState: (newTab?: TabType) => void;
    resetUploadState: () => void;
    resetYouTubeState: () => void;
  };
}

const initialYouTubeState = {
  url: "",
  videoDetails: null,
  isFetching: false,
  transcriptId: null,
};

const initialUploadState = {
  selectedFiles: [],
  fileDurations: [],
  filesUploaded: 0,
  uploadProgress: {},
  filesInFlight: [],
  uploadToastId: null,
};

const initialState: EngineState = {
  activeTab: DEFAULT_TAB,
  transcript: "",
  modelChoice: DEFAULT_MODEL_CHOICE,
  analysisPersona: DEFAULT_ANALYSIS_PERSONA,
  status: "idle",
  error: null,
  costDetails: null,
  youtube: initialYouTubeState,
  upload: initialUploadState,
};

export const useEngineState = (): UseEngineStateReturn => {
  const [state, setState] = useState<EngineState>(initialState);

  const setActiveTab = useCallback((tab: TabType) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const setTranscript = useCallback((transcript: string) => {
    setState(prev => ({ ...prev, transcript }));
  }, []);


  const setModelChoice = useCallback((choice: ModelChoice) => {
    setState(prev => ({ ...prev, modelChoice: choice }));
  }, []);

  const setAnalysisPersona = useCallback((persona: AnalysisPersona) => {
    setState(prev => ({ ...prev, analysisPersona: persona }));
  }, []);

  const setStatus = useCallback((status: UiStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setCostDetails = useCallback((details: CostDetails | null) => {
    setState(prev => ({ ...prev, costDetails: details }));
  }, []);

  // YouTube actions
  const setYouTubeUrl = useCallback((url: string) => {
    setState(prev => ({
      ...prev,
      youtube: { ...prev.youtube, url }
    }));
  }, []);

  const setVideoDetails = useCallback((details: VideoDetails | null) => {
    setState(prev => ({
      ...prev,
      youtube: { ...prev.youtube, videoDetails: details }
    }));
  }, []);

  const setIsFetchingYouTube = useCallback((fetching: boolean) => {
    setState(prev => ({
      ...prev,
      youtube: { ...prev.youtube, isFetching: fetching }
    }));
  }, []);

  const setTranscriptId = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      youtube: { ...prev.youtube, transcriptId: id }
    }));
  }, []);

  // Upload actions
  const setSelectedFiles = useCallback((files: File[]) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, selectedFiles: files }
    }));
  }, []);

  const addSelectedFiles = useCallback((files: File[]) => {
    setState(prev => ({
      ...prev,
      upload: {
        ...prev.upload,
        selectedFiles: [...prev.upload.selectedFiles, ...files]
      }
    }));
  }, []);

  const removeSelectedFile = useCallback((fileToRemove: File) => {
    setState(prev => ({
      ...prev,
      upload: {
        ...prev.upload,
        selectedFiles: prev.upload.selectedFiles.filter(file => file !== fileToRemove),
        fileDurations: prev.upload.fileDurations.filter(item => item.name !== fileToRemove.name)
      }
    }));
  }, []);

  const setFileDurations = useCallback((durations: FileDuration[]) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, fileDurations: durations }
    }));
  }, []);

  const setFilesUploaded = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, filesUploaded: count }
    }));
  }, []);

  const incrementFilesUploaded = useCallback(() => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, filesUploaded: prev.upload.filesUploaded + 1 }
    }));
  }, []);

  const setUploadProgress = useCallback((progress: UploadProgress) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, uploadProgress: progress }
    }));
  }, []);

  const updateUploadProgress = useCallback((fileName: string, progress: number) => {
    setState(prev => ({
      ...prev,
      upload: {
        ...prev.upload,
        uploadProgress: { ...prev.upload.uploadProgress, [fileName]: progress }
      }
    }));
  }, []);

  const setFilesInFlight = useCallback((files: File[]) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, filesInFlight: files }
    }));
  }, []);

  const setUploadToastId = useCallback((id: string | number | null) => {
    setState(prev => ({
      ...prev,
      upload: { ...prev.upload, uploadToastId: id }
    }));
  }, []);

  // Reset actions
  const resetUploadState = useCallback(() => {
    setState(prev => ({
      ...prev,
      upload: initialUploadState
    }));
  }, []);

  const resetYouTubeState = useCallback(() => {
    setState(prev => ({
      ...prev,
      youtube: initialYouTubeState
    }));
  }, []);

  const resetState = useCallback((newTab?: TabType) => {
    setState({
      ...initialState,
      activeTab: newTab || state.activeTab,
    });
  }, [state.activeTab]);

  return {
    state,
    actions: {
      setActiveTab,
      setTranscript,
      setModelChoice,
      setAnalysisPersona,
      setStatus,
      setError,
      setCostDetails,
      setYouTubeUrl,
      setVideoDetails,
      setIsFetchingYouTube,
      setTranscriptId,
      setSelectedFiles,
      addSelectedFiles,
      removeSelectedFile,
      setFileDurations,
      setFilesUploaded,
      incrementFilesUploaded,
      setUploadProgress,
      updateUploadProgress,
      setFilesInFlight,
      setUploadToastId,
      resetState,
      resetUploadState,
      resetYouTubeState,
    },
  };
};