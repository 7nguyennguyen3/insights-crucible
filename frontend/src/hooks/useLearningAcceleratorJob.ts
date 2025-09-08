import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

// Simplified data structure for new learning_accelerator
interface LearningSection {
  start_time: string;
  end_time: string;
  section_summary: string;
  key_points: string[];
  lessons_and_concepts: Array<{
    lesson: string;
    supporting_quote: string;
    timestamp: string;
    real_life_examples: string[];
  }>;
  notable_quotes: string[];
  entities: Array<{
    name: string;
    explanation?: string;
  }>;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  supporting_quote?: string;
  related_timestamp?: string;
}

interface LearningAcceleratorJobData {
  id: string;
  title: string;
  status: string;
  created_at: any;
  updated_at: any;
  persona: string;
  sections?: LearningSection[];
  learning_synthesis?: {
    quiz_questions?: QuizQuestion[];
  };
}

export const useLearningAcceleratorJob = (jobId: string | null) => {
  const [jobData, setJobData] = useState<LearningAcceleratorJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId || !user?.uid) {
        setLoading(false);
        setError("Missing job ID or user authentication");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch job data from our API endpoint
        const response = await fetch(`/api/temp-learning-job?jobId=${encodeURIComponent(jobId)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setError(errorData.error || `HTTP error! status: ${response.status}`);
          setJobData(null);
          return;
        }

        const jobData: LearningAcceleratorJobData = await response.json();
        setJobData(jobData);

      } catch (err) {
        console.error("Error fetching job data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch job data");
        setJobData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [jobId, user?.uid]);

  return { jobData, loading, error };
};