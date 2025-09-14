import { useState, useCallback } from 'react';
import { OpenEndedSubmission } from '@/app/_global/interface';

interface LearningFeedback {
  understanding_level: "emerging" | "developing" | "proficient" | "advanced";
  mastery_indicators: {
    concept_grasp: "strong" | "partial" | "emerging";
    real_world_connection: "excellent" | "good" | "needs_work";
    critical_thinking: "deep" | "surface" | "minimal";
  };
  what_you_nailed: string[];
  growth_opportunities: string[];
  guided_questions: string[];
  connection_prompts: string[];
  reflection_challenge: string;
  encouragement: string;
}

interface GradingJob {
  question_id: string;
  job_id: string;
  grading_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  grading_result?: LearningFeedback;
  error?: string;
}

interface SubmissionResult {
  question_id: string;
  job_id: string;
  status: string;
  message: string;
}

export const useOpenEndedGrading = () => {
  const [submissions, setSubmissions] = useState<Map<string, SubmissionResult>>(new Map());
  const [gradingJobs, setGradingJobs] = useState<Map<string, GradingJob>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAnswer = useCallback(async (submission: OpenEndedSubmission) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/submit-open-ended-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit answer: ${response.statusText}`);
      }

      const result: SubmissionResult = await response.json();
      
      // Store the submission result
      const key = `${submission.job_id}-${submission.question_id}`;
      setSubmissions(prev => new Map(prev.set(key, result)));

      // Initialize grading job tracking (now using question_id as key)
      setGradingJobs(prev => new Map(prev.set(result.question_id, {
        question_id: result.question_id,
        job_id: result.job_id,
        grading_status: "PENDING"
      })));

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const checkGradingStatus = useCallback(async (userId: string, jobId: string, questionId: string) => {
    try {
      const response = await fetch(`/api/grading-status/${jobId}/${questionId}?user_id=${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to check grading status: ${response.statusText}`);
      }

      const gradingJob: GradingJob = await response.json();
      
      // Update the grading job status (using question_id as key)
      setGradingJobs(prev => new Map(prev.set(questionId, gradingJob)));

      return gradingJob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check grading status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const pollGradingStatus = useCallback(async (
    userId: string, 
    jobId: string,
    questionId: string,
    maxAttempts: number = 60,
    initialInterval: number = 2000
  ): Promise<GradingJob> => {
    let attempt = 0;
    let intervalMs = initialInterval;
    
    while (attempt < maxAttempts) {
      try {
        const job = await checkGradingStatus(userId, jobId, questionId);
        
        if (job.grading_status === "COMPLETED" || job.grading_status === "FAILED") {
          return job;
        }

        // Exponential backoff to prevent infinite loops
        intervalMs = Math.min(intervalMs * 1.2, 5000);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempt++;
      } catch (error) {
        // If we get repeated errors, fail fast instead of looping
        if (attempt > 5) {
          throw new Error('Multiple grading status check failures. Please try again later.');
        }
        // Wait longer before retrying on error
        await new Promise(resolve => setTimeout(resolve, Math.min(intervalMs * 2, 10000)));
        attempt++;
      }
    }
    
    throw new Error('Grading timed out after 2 minutes. Please try again later.');
  }, [checkGradingStatus]);

  const submitAndGetFeedback = useCallback(async (submission: OpenEndedSubmission): Promise<LearningFeedback> => {
    // Submit the answer
    const submitResult = await submitAnswer(submission);
    
    // Poll for grading completion
    const gradingResult = await pollGradingStatus(submission.user_id, submitResult.job_id, submitResult.question_id);
    
    if (gradingResult.grading_status === "FAILED") {
      throw new Error(gradingResult.error || 'Grading failed');
    }
    
    if (!gradingResult.grading_result) {
      throw new Error('No feedback received');
    }
    
    return gradingResult.grading_result;
  }, [submitAnswer, pollGradingStatus]);

  const getSubmissionResult = useCallback((jobId: string, questionId: string) => {
    const key = `${jobId}-${questionId}`;
    return submissions.get(key);
  }, [submissions]);

  const getGradingJob = useCallback((questionId: string) => {
    return gradingJobs.get(questionId);
  }, [gradingJobs]);

  const submitAllAndGetFeedback = useCallback(async (submissions: OpenEndedSubmission[]): Promise<LearningFeedback[]> => {
    if (submissions.length === 0) {
      throw new Error('No submissions to process');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const results: LearningFeedback[] = [];

      // Submit all answers first
      const submissionResults: SubmissionResult[] = [];
      for (const submission of submissions) {
        const submitResult = await submitAnswer(submission);
        submissionResults.push(submitResult);
      }

      // Then poll for all results with timeout protection
      const startTime = Date.now();
      const maxTotalTime = 3 * 60 * 1000; // 3 minutes total

      for (let i = 0; i < submissionResults.length; i++) {
        // Check if we've exceeded total time limit
        if (Date.now() - startTime > maxTotalTime) {
          throw new Error('Batch grading timed out. Some feedback may be incomplete.');
        }

        const submitResult = submissionResults[i];
        const gradingResult = await pollGradingStatus(submissions[i].user_id, submitResult.job_id, submitResult.question_id);
        
        if (gradingResult.grading_status === "FAILED") {
          console.error(`Grading failed for question ${i + 1}:`, gradingResult.error);
          // Continue with other questions instead of failing completely
          continue;
        }
        
        if (gradingResult.grading_result) {
          results.push(gradingResult.grading_result);
        }
      }

      if (results.length === 0) {
        throw new Error('No feedback was generated for any questions');
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process batch feedback';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [submitAnswer, pollGradingStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submitAnswer,
    checkGradingStatus,
    pollGradingStatus,
    submitAndGetFeedback,
    submitAllAndGetFeedback,
    getSubmissionResult,
    getGradingJob,
    isSubmitting,
    error,
    clearError,
    submissions: Array.from(submissions.values()),
    gradingJobs: Array.from(gradingJobs.values()),
  };
};