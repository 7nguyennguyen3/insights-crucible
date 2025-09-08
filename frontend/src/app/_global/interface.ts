// A single, unified interface.ts file

export interface Clip {
  quote: string;
  start: number;
  end: number;
}

export type JobStatus = "COMPLETED" | "PROCESSING" | "FAILED" | "QUEUED";

export interface Job {
  id: string;
  status: JobStatus;
  createdAt: string; // Stored as an ISO string
  job_title: string;
  progress?: number;
  isStarred?: boolean;
  folderId?: string | null;
}

export interface BaseAnalysisSection {
  start_time: string;
  end_time: string;
}

export interface Utterance {
  speaker: string;
  text: string;
  start: number;
  end?: number;
}

export interface Notification {
  id: string; // The unique ID from the Firestore document
  message: string;
  isRead: boolean;
  link: string;
  createdAt: any; // Typically a Firestore Timestamp object, can be typed more strictly if needed
}

export interface Entity {
  name: string;
  explanation: string;
}

export interface LessonConcept {
  lesson: string;
  supporting_quote: string;
  timestamp: string;
  real_life_examples: string[];
}

export interface NotableQuote {
  quote: string;
  context: string;
  timestamp?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[] | { A: string; B: string; C: string; D: string; };
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  supporting_quote: string;
  related_timestamp: string;
}

export interface Contradiction {
  analysis: string;
  point_a: string;
  point_b: string;
}

export interface SynthesisResults {
  key_contradictions: Contradiction[];
  narrative_arc: string;
  overarching_themes: string[];
  unifying_insights: string[];
}

export interface ArgumentStructure {
  main_thesis: string;
  supporting_arguments: string[];
  counterarguments_mentioned: string[];
}

export interface LearningAcceleratorSynthesis {
  quiz_questions: QuizQuestion[];
  overall_learning_theme?: string;
  consolidated_lessons?: Array<{
    lesson: string;
    supporting_sections: number[];
  }>;
  concept_connections?: Array<{
    concept_1: string;
    concept_2: string;
    relationship: string;
  }>;
  practical_insights?: string[];
  lesson_progression?: string;
}

// --- DEFINE THE 'GENERAL' ANALYSIS STRUCTURE ---
export interface GeneralAnalysisSection extends BaseAnalysisSection {
  id: string;
  analysis_persona: "general"; // The "discriminator" field

  generated_title: string;
  "1_sentence_summary": string;
  summary_points: string[];
  actionable_advice: string[];
  notable_quotes: string[];
  questions_and_answers: { question: string; answer: string }[];
  verifiable_claims?: string[];
  suggested_clips?: Clip[];
  entities: Entity[];
}

export interface Slide {
  slide_title: string;
  slide_bullets: string[];
}

// --- DEFINE THE 'CONSULTANT' ANALYSIS STRUCTURE ---
export interface ConsultantAnalysisSection extends BaseAnalysisSection {
  id: string;
  analysis_persona: "consultant"; // The "discriminator" field

  section_title: string;
  executive_summary: string;
  client_pain_points: string[];
  strategic_opportunities: string[];
  key_stakeholders_mentioned: string[];
  critical_quotes: string[];
  open_questions: string[];
  entities?: Entity[];
  suggested_clips?: Clip[];
}

// --- DEFINE THE 'LEARNING_ACCELERATOR' ANALYSIS STRUCTURE ---
export interface LearningAcceleratorSection extends BaseAnalysisSection {
  id: string;
  analysis_persona: "learning_accelerator"; // The "discriminator" field

  generated_title: string;
  "1_sentence_summary": string;
  key_points: string[];
  lessons_and_concepts: LessonConcept[];
  notable_quotes: NotableQuote[];
  entities: Entity[];
  verifiable_claims?: string[];
}

// --- THE DISCRIMINATED UNION ---
// An AnalysisSection can now be one of the three specific shapes.
export type AnalysisSection =
  | GeneralAnalysisSection
  | ConsultantAnalysisSection
  | LearningAcceleratorSection;

// --- Defines the structure for the entire Job Data payload from the API ---
export interface JobData {
  job_id: string;
  status: JobStatus;
  job_title: string;
  structured_transcript?: Utterance[];
  results: AnalysisSection[]; // Uses the new, flexible union type

  synthesis_results?: SynthesisResults;
  argument_structure?: ArgumentStructure;

  // This field holds the original request config, including the chosen persona,
  // which allows the frontend to know which UI to render.
  request_data: {
    config: {
      analysis_persona: "general" | "consultant" | "learning_accelerator";
    };
  };
  generated_slide_outline?: Slide[];
  learning_synthesis?: LearningAcceleratorSynthesis;
  generated_quiz_questions?: {
    quiz_metadata: {
      total_questions: number;
      estimated_time_minutes: number;
      difficulty_distribution: {
        easy: number;
        medium: number;
        hard: number;
      };
      source: string;
    };
    questions: QuizQuestion[];
    quiz_type: string;
  };
}

export interface JobDataWithShare extends JobData {
  isPublic?: boolean;
  publicShareId?: string;
}
