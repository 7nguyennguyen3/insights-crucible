// Job and data types consolidated from _global/interface.ts

import { AnalysisSection, SynthesisResults, ArgumentStructure, Slide, QuizQuestion, OpenEndedQuestion } from './analysis';
import { LibraryMeta } from './library';

export type JobStatus = "COMPLETED" | "PROCESSING" | "FAILED" | "QUEUED";

export interface Job {
  id: string;
  status: JobStatus;
  createdAt: any; // Firestore Timestamp
  job_title: string;
  progress?: number;
  isStarred?: boolean;
  folderId?: string | null;
  sourceType?: 'youtube' | 'upload' | 'paste';
  youtubeUrl?: string;
  youtubeChannelName?: string;
  youtubeVideoName?: string;
  youtubeDuration?: string;
  youtubeThumbnailUrl?: string;
  analysisPersona?: string;
  audioFilename?: string;
  durationSeconds?: number;
  libraryDescriptionSuggestion?: string;
  libraryTagsSuggestion?: string[];
  libraryMeta?: LibraryMeta;
}

export interface Utterance {
  speaker?: string; // Optional - only present for upload source types
  text: string;
  start: number;
  end?: number;
}

export interface JobData {
  job_id: string;
  status: JobStatus;
  job_title: string;
  structured_transcript?: Utterance[];
  transcript?: any[]; // Raw transcript data in various formats
  results: AnalysisSection[];
  synthesis_results?: SynthesisResults;
  argument_structure?: ArgumentStructure;
  request_data: {
    config: {
      analysis_persona: "deep_dive";
    };
    source_type?: string; // e.g., "youtube", "upload", "paste"
  };
  generated_slide_outline?: Slide[];
  generated_quiz_questions?: {
    quiz_metadata: {
      total_questions: number;
      total_open_ended_questions?: number;
      estimated_time_minutes: number;
      difficulty_distribution: {
        easy: number;
        medium: number;
        hard: number;
      };
      source: string;
    };
    questions: QuizQuestion[];
    open_ended_questions?: OpenEndedQuestion[];
    quiz_type: string;
    generation_method?: string;
  };
  learning_synthesis?: {
    quiz_questions: QuizQuestion[];
  };
  quiz_results?: QuizResults;
  open_ended_results?: OpenEndedResults | null;
}

export interface JobDataWithShare extends JobData {
  isPublic?: boolean;
  publicShareId?: string;
  libraryMeta?: LibraryMeta;
  libraryDescriptionSuggestion?: string;
  libraryTagsSuggestion?: string[];
  viewCount?: number;
}

export interface OpenEndedSubmission {
  user_id: string;
  job_id: string;
  question_id: string;
  user_answer: string;
  submitted_at?: string;
}

export interface QuizAnswer {
  questionIndex: number;
  selectedAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  question: string;
  correctAnswer: "A" | "B" | "C" | "D";
}

export interface QuizResults {
  quiz_answers: QuizAnswer[];
  final_score: {
    correct: number;
    total: number;
  };
  completed_at: any; // Firestore Timestamp
  user_id: string;
}

export interface OpenEndedGradingResult {
  understanding_level: "proficient" | "developing" | "advanced" | "needs_work";
  what_you_nailed: string[];
  growth_opportunities: string[];
  encouragement: string;
  reflection_prompt: string;
  original_question: string;
}

export interface OpenEndedQuestionResult {
  id: string;
  job_id: string;
  user_id: string;
  question_id: string;
  user_answer: string;
  submitted_at: any; // Firestore Timestamp
  grading_status: "COMPLETED" | "PROCESSING" | "FAILED";
  graded_at?: any; // Firestore Timestamp
  grading_result?: OpenEndedGradingResult;
  updated_at?: any; // Firestore Timestamp
}

export interface OpenEndedQuestionProgress {
  id: string;
  job_id: string;
  user_id: string;
  question_id: string;
  question_index: number;
  user_answer: string;
  is_submitted: boolean;
  submitted_at?: any; // Firestore Timestamp
  updated_at: any; // Firestore Timestamp
}

export interface OpenEndedResults {
  open_ended_answers: OpenEndedQuestionResult[];
  completed_at: any; // Firestore Timestamp
  user_id: string;
  progress?: OpenEndedQuestionProgress[]; // Added for incremental progress tracking
}