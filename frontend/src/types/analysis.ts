// Analysis-related types consolidated from _global/interface.ts

export interface Clip {
  quote: string;
  start: number;
  end: number;
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

export interface OpenEndedQuestion {
  question_id?: string;
  question: string;
  related_timestamp: string;
  metadata: {
    evaluation_criteria: string[];
    supporting_quote: string;
    quote_timestamp: string | null;
    timestamp_source: string;
    insight_principle: string;
  };
  source_section?: number;
  difficulty?: string;
  quiz_number?: number;
  section_range?: string;
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


export interface Slide {
  slide_title: string;
  slide_bullets: string[];
}

// Base analysis section interface
export interface BaseAnalysisSection {
  start_time: string;
  end_time: string;
}

// Specific analysis section types


export interface ActionableTakeaway {
  type: "Prescriptive Action" | "Mental Model" | "Reflective Question";
  takeaway: string;
  supporting_quote: string;
  quote_timestamp?: {
    duration: string;
    start: string;
    end: string;
  };
}

export interface DeepDiveLessonConcept {
  lesson: string;
  supporting_quote: string;
  quote_timestamp?: {
    duration: string;
    start: string;
    end: string;
  };
}

export interface DeepDiveSection extends BaseAnalysisSection {
  id: string;
  analysis_persona: "deep_dive";
  generated_title: string;
  "1_sentence_summary": string;
  actionable_takeaways: ActionableTakeaway[];
  lessons_and_concepts?: DeepDiveLessonConcept[];  // Keep for backward compatibility
  section_title?: string;
  section_summary?: string;
  entities?: Entity[];
}

// Discriminated union for all analysis section types
export type AnalysisSection = DeepDiveSection;

// Analysis persona type
export type AnalysisPersona = "deep_dive";