"use client";

import {
  OpenEndedQuestion,
  OpenEndedSubmission,
} from "@/app/_global/interface";
import { OpenEndedResults } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Clock,
  MessageSquareQuote,
  RotateCcw,
  Save,
  CheckCircle,
  PlusCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { EditableField } from "@/app/components/analysis/EditableField";
import { BatchLearningFeedbackDisplay } from "./BatchLearningFeedbackDisplay";
import { useOpenEndedGrading } from "@/hooks/useOpenEndedGrading";
import { OpenEndedQuestionProgress } from "@/types/job";

interface OpenEndedQuestionsDisplayProps {
  questions: OpenEndedQuestion[];
  estimatedTimeMinutes?: number;
  totalQuestions?: number;
  isEditMode?: boolean;
  onQuestionChange?: (
    index: number,
    field: string,
    value: string | string[]
  ) => void;
  onAddQuestion?: () => void;
  onDeleteQuestion?: (index: number) => void;
  onSubmitAnswers?: (submissions: OpenEndedSubmission[]) => void;
  userId?: string;
  jobId?: string;
  existingOpenEndedResults?: OpenEndedResults | null;
}

interface UserResponse {
  questionIndex: number;
  answer: string;
  savedAt?: Date;
}

export const OpenEndedQuestionsDisplay: React.FC<
  OpenEndedQuestionsDisplayProps
> = ({
  questions,
  estimatedTimeMinutes,
  totalQuestions,
  isEditMode = false,
  onQuestionChange = () => {},
  onAddQuestion = () => {},
  onDeleteQuestion = () => {},
  onSubmitAnswers = () => {},
  userId = "",
  jobId = "",
  existingOpenEndedResults = null,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [submittedAnswers, setSubmittedAnswers] = useState<boolean[]>([]);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isGettingBatchFeedback, setIsGettingBatchFeedback] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState<any[]>([]);
  const [showingBatchFeedback, setShowingBatchFeedback] = useState(false);
  const [showCompactResults, setShowCompactResults] = useState(!!existingOpenEndedResults && !isEditMode);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [loadedProgress, setLoadedProgress] = useState<OpenEndedQuestionProgress[]>([]);

  // Initialize grading hooks
  const { submitAllAndGetFeedback, isSubmitting, error, clearError } =
    useOpenEndedGrading();

  // Load existing progress from backend
  const loadProgress = async () => {
    if (!userId || !jobId) return;

    try {
      const response = await fetch(`/api/open-ended-progress?jobId=${jobId}&userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        setLoadedProgress(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  };

  // Save progress to backend
  const saveProgress = async (questionIndex: number, answer: string, isSubmitted: boolean = false) => {
    if (!userId || !jobId || !questions[questionIndex]) return;

    const questionId = questions[questionIndex].question_id || `question_${questionIndex}`;

    setIsSavingProgress(true);
    try {
      const response = await fetch('/api/open-ended-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          userId,
          questionId,
          questionIndex,
          userAnswer: answer,
          isSubmitted,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save progress');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Initialize user responses array and load progress when questions change
  useEffect(() => {
    if (questions.length > 0) {
      const initialResponses = questions.map((_, index) => ({
        questionIndex: index,
        answer: "",
      }));
      setUserResponses(initialResponses);
      setSubmittedAnswers(new Array(questions.length).fill(false));

      // Load existing progress
      loadProgress();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, userId, jobId]);

  // Apply loaded progress to state
  useEffect(() => {
    if (loadedProgress.length > 0 && questions.length > 0) {
      const updatedResponses = questions.map((_, index) => {
        const progress = loadedProgress.find(p => p.question_index === index);
        return {
          questionIndex: index,
          answer: progress?.user_answer || "",
          savedAt: progress?.updated_at ? new Date(progress.updated_at.seconds * 1000) : undefined,
        };
      });

      const updatedSubmitted = questions.map((_, index) => {
        const progress = loadedProgress.find(p => p.question_index === index);
        return progress?.is_submitted || false;
      });

      setUserResponses(updatedResponses);
      setSubmittedAnswers(updatedSubmitted);
    }
  }, [loadedProgress, questions]);

  // Update current answer when question changes
  useEffect(() => {
    const response = userResponses.find(
      (r) => r.questionIndex === currentQuestionIndex
    );
    setCurrentAnswer(response?.answer || "");

    // Show feedback if this question was already submitted
    if (submittedAnswers[currentQuestionIndex]) {
      setShowingFeedback(true);
    } else {
      setShowingFeedback(false);
    }
  }, [currentQuestionIndex, userResponses, submittedAnswers]);

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);

    // Update the response in the array
    const updatedResponses = userResponses.map((response) =>
      response.questionIndex === currentQuestionIndex
        ? { ...response, answer: value, savedAt: new Date() }
        : response
    );
    setUserResponses(updatedResponses);

    // Auto-save progress (debounced to avoid too many API calls)
    if (userId && jobId && value.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        saveProgress(currentQuestionIndex, value, false);
      }, 1000); // Save after 1 second of no changes

      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || submittedAnswers[currentQuestionIndex]) return;

    // Mark this answer as submitted
    const newSubmittedAnswers = [...submittedAnswers];
    newSubmittedAnswers[currentQuestionIndex] = true;
    setSubmittedAnswers(newSubmittedAnswers);
    setShowingFeedback(true);

    // Save submitted answer to backend
    await saveProgress(currentQuestionIndex, currentAnswer, true);
  };

  const handleNextQuestion = () => {
    setShowingFeedback(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setShowingFeedback(false);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Check if previous question was submitted to show feedback
      if (submittedAnswers[currentQuestionIndex - 1]) {
        setShowingFeedback(true);
      }
    }
  };

  const handleSubmitAllAnswers = async () => {
    if (!userId || !jobId) return;

    const submissions: OpenEndedSubmission[] = userResponses
      .filter((response) => response.answer.trim() !== "")
      .map((response) => ({
        user_id: userId,
        job_id: jobId,
        question_id:
          questions[response.questionIndex]?.question_id ||
          `${response.questionIndex + 1}`,
        user_answer: response.answer,
        submitted_at: new Date().toISOString(),
      }));

    if (submissions.length === 0) {
      return;
    }

    setIsGettingBatchFeedback(true);
    clearError();

    try {
      // Call the parent's onSubmitAnswers first
      onSubmitAnswers(submissions);

      // Then get AI feedback
      const feedback = await submitAllAndGetFeedback(submissions);
      setBatchFeedback(feedback);
      setShowingBatchFeedback(true);
    } catch (err) {
      console.error("Failed to get batch feedback:", err);
      // Even if feedback fails, the submissions were saved
    } finally {
      setIsGettingBatchFeedback(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserResponses(
      questions.map((_, index) => ({
        questionIndex: index,
        answer: "",
      }))
    );
    setSubmittedAnswers(new Array(questions.length).fill(false));
    setShowingFeedback(false);
    setCurrentAnswer("");
    setQuizStarted(false);
    setIsCompleted(false);
    setShowCompactResults(false);
    setShowDetailedResults(false);
    setShowingBatchFeedback(false);
    setBatchFeedback([]);
    setLoadedProgress([]);
  };

  const getAnsweredCount = () => {
    return userResponses.filter((response) => response.answer.trim() !== "")
      .length;
  };

  const toggleAnswerExpansion = (answerId: string) => {
    setExpandedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(answerId)) {
        newSet.delete(answerId);
      } else {
        newSet.add(answerId);
      }
      return newSet;
    });
  };

  const truncateAnswer = (answer: string, maxLength: number = 100) => {
    if (answer.length <= maxLength) return answer;
    return answer.substring(0, maxLength) + "...";
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-3 text-blue-500" />
            Open-Ended Reflection
          </CardTitle>
          <CardDescription>
            No open-ended questions available for this analysis.
          </CardDescription>
        </CardHeader>
        {isEditMode && (
          <CardContent>
            <Button
              variant="outline"
              onClick={onAddQuestion}
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  if (isEditMode) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BookOpen className="w-5 h-5 mr-3 text-blue-500" />
              Open-Ended Questions - Edit Mode
            </span>
            <Badge variant="secondary">
              {questions.length} Question{questions.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <CardDescription>
            Edit open-ended questions for deeper reflection and understanding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={`open-ended-question-${index}`}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                  Question {index + 1}
                </h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteQuestion(index)}
                >
                  Delete
                </Button>
              </div>

              <EditableField
                isEditing={true}
                value={question.question === "text" ? "" : question.question}
                onChange={(newValue) =>
                  onQuestionChange(index, "question", newValue)
                }
                isTextarea
                placeholder="Enter open-ended question... (leave empty to auto-generate from learning principle)"
                className="font-medium"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Timestamp
                  </label>
                  <EditableField
                    isEditing={true}
                    value={question.related_timestamp}
                    onChange={(newValue) =>
                      onQuestionChange(index, "related_timestamp", newValue)
                    }
                    placeholder="MM:SS or HH:MM:SS"
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Source Section
                  </label>
                  <EditableField
                    isEditing={true}
                    value={question.source_section?.toString() || ""}
                    onChange={(newValue) =>
                      onQuestionChange(
                        index,
                        "source_section",
                        newValue
                      )
                    }
                    placeholder="Section number"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <MessageSquareQuote className="w-3 h-3 mr-2 text-blue-500" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Supporting Quote
                    </span>
                  </div>
                  <EditableField
                    isEditing={true}
                    value={question.metadata?.supporting_quote || ""}
                    onChange={(newValue) =>
                      onQuestionChange(index, "metadata.supporting_quote", newValue)
                    }
                    isTextarea
                    placeholder="Enter supporting quote from content..."
                    className="italic text-sm text-slate-600 dark:text-slate-400"
                  />
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      💡 Learning Principle
                    </span>
                  </div>
                  <EditableField
                    isEditing={true}
                    value={question.metadata?.insight_principle || ""}
                    onChange={(newValue) =>
                      onQuestionChange(index, "metadata.insight_principle", newValue)
                    }
                    isTextarea
                    placeholder="Enter the learning principle this question demonstrates..."
                    className="text-sm text-slate-600 dark:text-slate-400"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      📝 Evaluation Criteria
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(question.metadata?.evaluation_criteria || []).map((criterion, criterionIndex) => (
                      <div key={criterionIndex} className="flex items-center gap-2">
                        <EditableField
                          isEditing={true}
                          value={criterion}
                          onChange={(newValue) => {
                            const newCriteria = [...(question.metadata?.evaluation_criteria || [])];
                            newCriteria[criterionIndex] = newValue;
                            onQuestionChange(index, "metadata.evaluation_criteria", newCriteria);
                          }}
                          placeholder="Enter evaluation criterion..."
                          className="flex-1 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newCriteria = (question.metadata?.evaluation_criteria || []).filter((_, i) => i !== criterionIndex);
                            onQuestionChange(index, "metadata.evaluation_criteria", newCriteria);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCriteria = [...(question.metadata?.evaluation_criteria || []), ""];
                        onQuestionChange(index, "metadata.evaluation_criteria", newCriteria);
                      }}
                      className="w-full"
                    >
                      + Add Criterion
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={onAddQuestion} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Question
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact results display when questions have been completed previously
  if (showCompactResults && existingOpenEndedResults) {
    const completedAnswers = existingOpenEndedResults.open_ended_answers.filter(
      answer => answer.grading_status === "COMPLETED"
    );
    const completedDate = existingOpenEndedResults.completed_at?.toDate ? 
      existingOpenEndedResults.completed_at.toDate().toLocaleDateString() : 
      new Date().toLocaleDateString();

    // Calculate understanding level summary
    const understandingLevels = completedAnswers
      .map(answer => answer.grading_result?.understanding_level)
      .filter(level => level);
    
    const avgUnderstandingLevel = understandingLevels.length > 0 ? 
      understandingLevels[0] : "completed"; // For now, show the first one or "completed"

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
              Reflection Completed
            </span>
            <Badge 
              variant="default" 
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            >
              {avgUnderstandingLevel}
            </Badge>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>
              {completedAnswers.length} of {questions.length} questions answered
            </span>
            <span className="text-xs text-slate-500">
              Completed on {completedDate}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCompactResults(false);
                setShowDetailedResults(true);
              }}
            >
              View Feedback
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowCompactResults(false);
                setShowDetailedResults(false);
                setQuizStarted(false);
                setIsCompleted(false);
                setCurrentQuestionIndex(0);
                setUserResponses(questions.map((_, index) => ({
                  questionIndex: index,
                  answer: "",
                })));
                setCurrentAnswer("");
              }}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retake Reflection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show detailed results when user clicks "View Feedback"
  if (showDetailedResults && existingOpenEndedResults) {
    const completedAnswers = existingOpenEndedResults.open_ended_answers.filter(
      answer => answer.grading_status === "COMPLETED" && answer.grading_result
    );

    return (
      <div className="w-full space-y-6">
          {completedAnswers.map((answer, index) => {
            const question = questions.find(q => q.question_id === answer.question_id);
            const gradingResult = answer.grading_result!;
            const isExpanded = expandedAnswers.has(answer.id);
            
            return (
              <Card key={answer.id} className="border">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">
                      Question {index + 1}
                    </h4>
                    <Badge variant="secondary">
                      {gradingResult.understanding_level}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {question?.question || gradingResult.original_question}
                  </p>

                  {answer.user_answer && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Your Answer:
                        </h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAnswerExpansion(answer.id)}
                          className="text-xs h-6 px-2"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isExpanded ? answer.user_answer : truncateAnswer(answer.user_answer)}
                      </p>
                    </div>
                  )}

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                    What you nailed:
                  </h5>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    {gradingResult.what_you_nailed.map((point, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {gradingResult.growth_opportunities.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                      Growth opportunities:
                    </h5>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      {gradingResult.growth_opportunities.map((point, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                    Encouragement:
                  </h5>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {gradingResult.encouragement}
                  </p>
                </div>

                {gradingResult.reflection_prompt && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                      Further reflection:
                    </h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {gradingResult.reflection_prompt}
                    </p>
                  </div>
                )}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCompactResults(true)} 
              variant="secondary" 
              className="flex-1"
            >
              Back to Summary
            </Button>
            <Button
              variant="outline" 
              onClick={() => {
                setShowCompactResults(false);
                setShowDetailedResults(false);
                setQuizStarted(false);
                setIsCompleted(false);
                setCurrentQuestionIndex(0);
                setUserResponses(questions.map((_, index) => ({
                  questionIndex: index,
                  answer: "",
                })));
                setCurrentAnswer("");
              }}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> 
              Retake Reflection
            </Button>
          </div>
      </div>
    );
  }

  // Quiz taking interface - Start screen
  if (!quizStarted) {
    const submittedCount = submittedAnswers.filter(Boolean).length;
    const hasProgress = submittedCount > 0 || userResponses.some(r => r.answer.trim().length > 0);

    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <BookOpen className="w-6 h-6 mr-3 text-blue-500" />
            {hasProgress ? "Continue Reflection" : "Open-Ended Reflection"}
          </CardTitle>
          <CardDescription>
            {hasProgress
              ? "Continue your thoughtful responses where you left off"
              : "Deepen your understanding through thoughtful written responses"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {hasProgress && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Progress Found
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                You've completed {submittedCount} of {questions.length} questions
              </p>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(submittedCount / questions.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {questions.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Questions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {estimatedTimeMinutes || questions.length * 5}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Minutes
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Take your time to reflect deeply on each question. There are no
            right or wrong answers - focus on connecting the concepts to your
            own understanding and experiences.
          </div>

          <Button
            onClick={() => {
              setQuizStarted(true);
              // If there's progress, go to the first incomplete question
              if (hasProgress) {
                const firstIncompleteIndex = submittedAnswers.findIndex(submitted => !submitted);
                if (firstIncompleteIndex !== -1) {
                  setCurrentQuestionIndex(firstIncompleteIndex);
                }
              }
            }}
            className="w-full max-w-sm mx-auto"
            size="lg"
          >
            {hasProgress ? "Continue Reflection" : "Start Reflection"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Completion screen
  if (isCompleted) {
    const answeredCount = getAnsweredCount();

    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <CheckCircle className="w-6 h-6 mr-3 text-green-500" />
            Reflection Complete
          </CardTitle>
          <CardDescription>
            Your thoughtful responses have been recorded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">
              {answeredCount}
            </div>
            <div className="text-lg text-slate-600 dark:text-slate-400">
              out of {questions.length} questions answered
            </div>
            <Progress
              value={(answeredCount / questions.length) * 100}
              className="w-full max-w-sm mx-auto mt-4"
            />
          </div>

          <div className="text-center text-slate-600 dark:text-slate-400">
            <p>Your responses show thoughtful engagement with the material.</p>
            <p className="text-sm mt-2">
              Consider revisiting these concepts and how they apply to your
              goals.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200 text-sm">
                <strong>Feedback Error:</strong> {error}
              </p>
              <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                Your answers were saved, but AI feedback couldn't be generated.
                You can try again later.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {answeredCount > 0 && (
              <>
                {userId && jobId ? (
                  <>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-2">
                      <div className="flex items-center mb-1">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                          Personalized AI Grading
                        </span>
                      </div>
                      <p className="text-sm text-purple-800 dark:text-purple-300">
                        This quiz features personalized, custom LLM grading tailored to your responses.
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmitAllAnswers}
                      size="lg"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isGettingBatchFeedback || isSubmitting}
                    >
                      {isGettingBatchFeedback || isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting AI Feedback...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Submit & Get AI Feedback
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Custom Grading Unavailable
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Custom grading unavailable for public view - only available to the analysis owner.
                    </p>
                  </div>
                )}
              </>
            )}
            <Button onClick={resetQuiz} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" /> Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show batch feedback if available
  if (showingBatchFeedback && batchFeedback.length > 0) {
    const answeredResponses = userResponses.filter(
      (r) => r.answer.trim() !== ""
    );
    const userAnswers = answeredResponses.map((r) => r.answer);
    const relevantQuestions = answeredResponses.map(
      (r) => questions[r.questionIndex]
    );

    return (
      <BatchLearningFeedbackDisplay
        feedback={batchFeedback}
        questions={relevantQuestions}
        userAnswers={userAnswers}
        onClose={() => setShowingBatchFeedback(false)}
      />
    );
  }

  // Main question interface
  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = userResponses.find(
    (r) => r.questionIndex === currentQuestionIndex
  );
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Generate question text if it's just a placeholder
  const getQuestionText = (question: OpenEndedQuestion) => {
    if (question.question === "text" && question.metadata?.insight_principle) {
      // Generate a question based on the insight principle and evaluation criteria
      const principle = question.metadata.insight_principle;
      return `Reflect on this learning principle: "${principle}" - How does this concept apply to your own learning experiences?`;
    }
    return question.question;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-3 text-blue-500" />
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
          {currentQuestion.related_timestamp && (
            <Badge variant="outline" className="font-mono">
              <Clock className="w-3 h-3 mr-1" />
              {currentQuestion.related_timestamp}
            </Badge>
          )}
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
            {getQuestionText(currentQuestion)}
          </h3>

          {currentQuestion.metadata?.insight_principle && (
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                  💡 Learning Principle
                </span>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-300">
                {currentQuestion.metadata.insight_principle}
              </p>
            </div>
          )}

          {currentQuestion.metadata?.evaluation_criteria && currentQuestion.metadata.evaluation_criteria.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  📝 What to consider in your response:
                </span>
              </div>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                {currentQuestion.metadata.evaluation_criteria.map((criterion, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Share your thoughts, insights, and reflections..."
            className="min-h-[200px] resize-vertical"
            maxLength={2000}
            disabled={submittedAnswers[currentQuestionIndex]}
          />

          <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{currentAnswer.length}/2000 characters</span>
            {submittedAnswers[currentQuestionIndex] ? (
              <span className="text-green-600 font-medium">✓ Submitted</span>
            ) : currentAnswer.length > 0 ? (
              <span className="text-blue-600">Auto-saved</span>
            ) : null}
          </div>
        </div>

        {currentQuestion.metadata?.supporting_quote && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <MessageSquareQuote className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Reference from content
              </span>
            </div>
            <blockquote className="italic text-sm text-slate-600 dark:text-slate-400 border-l-4 border-blue-200 pl-4">
              {currentQuestion.metadata.supporting_quote}
            </blockquote>
          </div>
        )}

        {/* Feedback section - shown after answer is submitted */}
        {submittedAnswers[currentQuestionIndex] && showingFeedback && currentQuestion.generic_answer && (
          <div className="mt-6 p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="font-medium text-green-700 dark:text-green-400">
                Sample Response
              </span>
            </div>
            <p className="text-sm text-green-800 dark:text-green-300 mb-3">
              Here's an example of how this question could be answered:
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {currentQuestion.generic_answer}
              </p>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              Compare this with your response to deepen your understanding.
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || (submittedAnswers[currentQuestionIndex] && !showingFeedback)}
          >
            Previous
          </Button>

          {!submittedAnswers[currentQuestionIndex] ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={currentAnswer.trim().length < 10 || isSavingProgress}
            >
              {isSavingProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              disabled={isSavingProgress}
            >
              {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next Question"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
