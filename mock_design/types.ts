export interface AnalysisData {
  main_document: {
    path?: string;
    document_id?: string;
    data: {
      job_title: string;
      status: string;
      progress: string;
      createdAt: {
        _seconds: number;
        _nanoseconds: number;
      };
      updatedAt?: {
        _seconds: number;
        _nanoseconds: number;
      };
      request_data: {
        youtube_video_title: string;
        youtube_channel_name: string;
        youtube_url: string;
        youtube_thumbnail_url: string;
        user_id?: string;
        source_type?: string;
        youtube_duration?: string;
        transcript_id?: string;
        config: {
          analysis_persona?: string;
        };
      };
      transcript?: any[];
      folderId?: string | null;
      show_notes: {
        title_variations: {
          curiosity_gap: string;
          benefit_driven: string;
          contrarian: string;
          direct: string;
        };
        episode_description: string;
        key_points: string[];
        social_content: {
          youtube_description: string;
          twitter_thread: string[];
          linkedin_post: string;
        };
        notable_quotes: Array<{
          quote: string;
          context: string;
          timestamp: string;
        }>;
        chapters: Array<{
          timestamp: string;
          title: string;
          summary: string;
        }>;
        total_sections?: number;
      };
    };
  };
  subcollections: {
    results: {
      path?: string;
      document_count?: number;
      documents: Array<{
        id?: string;
        entities: Array<{
          name: string;
          explanation: string;
        }>;
        [key: string]: any; // Allow other fields like 1_sentence_summary, contextual_briefing etc
      }>;
    };
  };
}

export type TabId = "overview" | "social" | "titles" | "quotes" | "entities";
