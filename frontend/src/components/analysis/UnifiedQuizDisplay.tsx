"use client";

import { QuizQuestion, OpenEndedQuestion, OpenEndedSubmission } from "@/app/_global/interface";
import { QuizResults, OpenEndedResults } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, BookOpen, Users, CheckCircle } from "lucide-react";
import React from "react";

import { QuizQuestionsDisplay } from "@/app/components/analysis/QuizQuestionsDisplay";
import { OpenEndedQuestionsDisplay } from "./OpenEndedQuestionsDisplay";

interface UnifiedQuizDisplayProps {
  multipleChoiceQuestions?: QuizQuestion[];
  openEndedQuestions?: OpenEndedQuestion[];
  mcqEstimatedTimeMinutes?: number;
  oeEstimatedTimeMinutes?: number;
  isEditMode?: boolean;
  onMcqQuestionChange?: (
    index: number,
    field: keyof QuizQuestion,
    value: string | string[]
  ) => void;
  onMcqAddQuestion?: () => void;
  onMcqDeleteQuestion?: (index: number) => void;
  onOeQuestionChange?: (
    index: number,
    field: string,
    value: string | string[]
  ) => void;
  onOeAddQuestion?: () => void;
  onOeDeleteQuestion?: (index: number) => void;
  onSubmitOpenEndedAnswers?: (submissions: OpenEndedSubmission[]) => void;
  userId?: string;
  jobId?: string;
  existingQuizResults?: QuizResults | null;
  existingOpenEndedResults?: OpenEndedResults | null;
}

export const UnifiedQuizDisplay: React.FC<UnifiedQuizDisplayProps> = ({
  multipleChoiceQuestions = [],
  openEndedQuestions = [],
  mcqEstimatedTimeMinutes,
  oeEstimatedTimeMinutes,
  isEditMode = false,
  onMcqQuestionChange = () => {},
  onMcqAddQuestion = () => {},
  onMcqDeleteQuestion = () => {},
  onOeQuestionChange = () => {},
  onOeAddQuestion = () => {},
  onOeDeleteQuestion = () => {},
  onSubmitOpenEndedAnswers = () => {},
  userId = "",
  jobId = "",
  existingQuizResults = null,
  existingOpenEndedResults = null,
}) => {
  // Note: Grading results functionality disabled
  const hasMcq = multipleChoiceQuestions.length > 0;
  const hasOe = openEndedQuestions.length > 0;
  const totalQuestions = multipleChoiceQuestions.length + openEndedQuestions.length;

  // If no questions at all, show empty state
  if (!hasMcq && !hasOe) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BrainCircuit className="w-5 h-5 mr-3 text-purple-500" />
            Learning Assessment
          </CardTitle>
          <CardDescription>
            No quiz questions available for this analysis.
          </CardDescription>
        </CardHeader>
        {isEditMode && (
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              onClick={onMcqAddQuestion}
              className="w-full"
            >
              Add Multiple Choice Question
            </Button>
            <Button
              variant="outline"
              onClick={onOeAddQuestion}
              className="w-full"
            >
              Add Open-Ended Question
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  // If only one type exists, display it directly without tabs
  if (hasMcq && !hasOe) {
    return (
      <QuizQuestionsDisplay
        questions={multipleChoiceQuestions}
        estimatedTimeMinutes={mcqEstimatedTimeMinutes}
        totalQuestions={multipleChoiceQuestions.length}
        isEditMode={isEditMode}
        onQuestionChange={onMcqQuestionChange}
        onAddQuestion={onMcqAddQuestion}
        onDeleteQuestion={onMcqDeleteQuestion}
        userId={userId}
        jobId={jobId}
        existingQuizResults={existingQuizResults}
      />
    );
  }

  if (hasOe && !hasMcq) {
    return (
      <OpenEndedQuestionsDisplay
        questions={openEndedQuestions}
        estimatedTimeMinutes={oeEstimatedTimeMinutes}
        totalQuestions={openEndedQuestions.length}
        isEditMode={isEditMode}
        onQuestionChange={onOeQuestionChange}
        onAddQuestion={onOeAddQuestion}
        onDeleteQuestion={onOeDeleteQuestion}
        onSubmitAnswers={onSubmitOpenEndedAnswers}
        userId={userId}
        jobId={jobId}
        existingOpenEndedResults={existingOpenEndedResults}
      />
    );
  }

  // Both types exist, show tabbed interface
  const defaultTab = hasMcq ? "multiple-choice" : "open-ended";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Users className="w-5 h-5 mr-3 text-purple-500" />
            Learning Assessment
          </span>
          <Badge variant="secondary">
            {totalQuestions} Total Question{totalQuestions !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test your knowledge and deepen your understanding with multiple formats
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {hasMcq && (
              <TabsTrigger value="multiple-choice" className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" />
                Multiple Choice
                <Badge variant="outline" className="ml-1">
                  {multipleChoiceQuestions.length}
                </Badge>
              </TabsTrigger>
            )}
            {hasOe && (
              <TabsTrigger value="open-ended" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Reflection
                <Badge variant="outline" className="ml-1">
                  {openEndedQuestions.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {hasMcq && (
            <TabsContent value="multiple-choice" className="mt-6">
              <QuizQuestionsDisplay
                questions={multipleChoiceQuestions}
                estimatedTimeMinutes={mcqEstimatedTimeMinutes}
                totalQuestions={multipleChoiceQuestions.length}
                isEditMode={isEditMode}
                onQuestionChange={onMcqQuestionChange}
                onAddQuestion={onMcqAddQuestion}
                onDeleteQuestion={onMcqDeleteQuestion}
                userId={userId}
                jobId={jobId}
                existingQuizResults={existingQuizResults}
              />
            </TabsContent>
          )}

          {hasOe && (
            <TabsContent value="open-ended" className="mt-6">
              <OpenEndedQuestionsDisplay
                questions={openEndedQuestions}
                estimatedTimeMinutes={oeEstimatedTimeMinutes}
                totalQuestions={openEndedQuestions.length}
                isEditMode={isEditMode}
                onQuestionChange={onOeQuestionChange}
                onAddQuestion={onOeAddQuestion}
                onDeleteQuestion={onOeDeleteQuestion}
                onSubmitAnswers={onSubmitOpenEndedAnswers}
                userId={userId}
                jobId={jobId}
                existingOpenEndedResults={existingOpenEndedResults}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};