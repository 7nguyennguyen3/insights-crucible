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

// --- ADDED BACK: Definitions for Contextual Briefing ---
export interface Viewpoint {
  perspective: string;
  source: string;
  url: string;
}

export interface ContextualBriefing {
  broader_context?: string;
  key_nuances_and_conditions?: string[];
  overall_summary?: string;
  supporting_viewpoints?: Viewpoint[];
  challenging_viewpoints?: Viewpoint[];
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
  key_entities: string[];
  verifiable_claims?: string[];
  contextual_briefing?: ContextualBriefing;
  suggested_clips?: Clip[];
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
  key_entities?: string[];
  contextual_briefing?: ContextualBriefing;
  suggested_clips?: Clip[];
}

// --- THE DISCRIMINATED UNION ---
// An AnalysisSection can now be one of the two specific shapes.
export type AnalysisSection =
  | GeneralAnalysisSection
  | ConsultantAnalysisSection;

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
      analysis_persona: "general" | "consultant";
      run_contextual_briefing?: boolean;
      run_x_thread_generation?: boolean;
      run_blog_post_generation?: boolean;
    };
  };

  // Optional generated content that can exist on any job type
  generated_blog_post?: string;
  generated_overall_x_thread?: string[];

  generated_slide_outline?: Slide[];
}

export interface JobDataWithShare extends JobData {
  isPublic?: boolean;
  publicShareId?: string;
}
