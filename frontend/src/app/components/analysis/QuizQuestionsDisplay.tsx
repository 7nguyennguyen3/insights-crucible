"use client";

import { QuizQuestion } from "@/app/_global/interface";
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
import {
  BrainCircuit,
  CheckCircle,
  Clock,
  HelpCircle,
  MessageSquareQuote,
  PlusCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { EditableField } from "./EditableField";

interface QuizQuestionsDisplayProps {
  questions: QuizQuestion[];
  estimatedTimeMinutes?: number;
  totalQuestions?: number;
  isEditMode?: boolean;
  onQuestionChange?: (
    index: number,
    field: keyof QuizQuestion,
    value: string | string[]
  ) => void;
  onAddQuestion?: () => void;
  onDeleteQuestion?: (index: number) => void;
}

type Answer = "A" | "B" | "C" | "D" | null;

export const QuizQuestionsDisplay: React.FC<QuizQuestionsDisplayProps> = ({
  questions,
  estimatedTimeMinutes,
  totalQuestions,
  isEditMode = false,
  onQuestionChange = () => {},
  onAddQuestion = () => {},
  onDeleteQuestion = () => {},
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Answer[]>(
    new Array(questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const handleAnswerSelect = (answer: Answer) => {
    if (showResults) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
    setQuizStarted(false);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BrainCircuit className="w-5 h-5 mr-3 text-purple-500" />
            Knowledge Quiz
          </CardTitle>
          <CardDescription>
            No quiz questions available for this analysis.
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
              <BrainCircuit className="w-5 h-5 mr-3 text-purple-500" />
              Knowledge Quiz - Edit Mode
            </span>
            <Badge variant="secondary">
              {questions.length} Question{questions.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <CardDescription>
            Edit quiz questions to test comprehension of the content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={`quiz-question-${index}`}
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
                value={question.question}
                onChange={(newValue) =>
                  onQuestionChange(index, "question", newValue)
                }
                isTextarea
                placeholder="Enter question..."
                className="font-medium"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Answer Options
                </label>
                {["A", "B", "C", "D"].map((letter, optionIndex) => {
                  // Handle both array and object formats
                  let currentOptionValue = "";
                  if (Array.isArray(question.options)) {
                    currentOptionValue = question.options[optionIndex] || "";
                  } else if (
                    typeof question.options === "object" &&
                    question.options
                  ) {
                    currentOptionValue = question.options[letter as keyof typeof question.options] || "";
                  }

                  return (
                    <div key={letter} className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        {letter}
                      </Badge>
                      <EditableField
                        isEditing={true}
                        value={currentOptionValue}
                        onChange={(newValue) => {
                          // Always convert to array format when editing
                          let newOptions: string[];
                          if (Array.isArray(question.options)) {
                            newOptions = [...question.options];
                          } else if (
                            typeof question.options === "object" &&
                            question.options
                          ) {
                            newOptions = [
                              question.options.A || "",
                              question.options.B || "",
                              question.options.C || "",
                              question.options.D || "",
                            ];
                          } else {
                            newOptions = ["", "", "", ""];
                          }
                          newOptions[optionIndex] = newValue;
                          onQuestionChange(index, "options", newOptions);
                        }}
                        placeholder={`Enter option ${letter}...`}
                        className="flex-1"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Correct Answer
                  </label>
                  <select
                    value={question.correct_answer}
                    onChange={(e) =>
                      onQuestionChange(index, "correct_answer", e.target.value)
                    }
                    className="w-full mt-1 p-2 border rounded-md bg-white dark:bg-slate-800"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
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
              </div>

              <EditableField
                isEditing={true}
                value={question.explanation}
                onChange={(newValue) =>
                  onQuestionChange(index, "explanation", newValue)
                }
                isTextarea
                placeholder="Explain why this answer is correct..."
                className="text-sm"
              />

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <MessageSquareQuote className="w-3 h-3 mr-2 text-blue-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Supporting Quote
                  </span>
                </div>
                <EditableField
                  isEditing={true}
                  value={question.supporting_quote}
                  onChange={(newValue) =>
                    onQuestionChange(index, "supporting_quote", newValue)
                  }
                  isTextarea
                  placeholder="Enter supporting quote from content..."
                  className="italic text-sm text-slate-600 dark:text-slate-400"
                />
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

  // Quiz taking interface
  if (!quizStarted) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 mr-3 text-purple-500" />
            Knowledge Quiz
          </CardTitle>
          <CardDescription>
            Test your understanding of the key concepts from this content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {questions.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Questions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {estimatedTimeMinutes || questions.length * 2}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Minutes
              </div>
            </div>
          </div>

          <Button
            onClick={() => setQuizStarted(true)}
            className="w-full max-w-sm mx-auto"
            size="lg"
          >
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score.correct / score.total) * 100);

    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <CheckCircle className="w-6 h-6 mr-3 text-green-500" />
            Quiz Results
          </CardTitle>
          <CardDescription>
            Your knowledge assessment is complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">
              {percentage}%
            </div>
            <div className="text-lg text-slate-600 dark:text-slate-400">
              {score.correct} out of {score.total} correct
            </div>
            <Progress
              value={percentage}
              className="w-full max-w-sm mx-auto mt-4"
            />
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correct_answer;

              return (
                <div key={`result-${index}`} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">
                      Question {index + 1}
                    </h4>
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {question.question}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {(() => {
                      // Convert options to array format
                      let questionOptionsArray: string[];
                      if (Array.isArray(question.options)) {
                        questionOptionsArray = question.options;
                      } else if (
                        typeof question.options === "object" &&
                        question.options
                      ) {
                        questionOptionsArray = [
                          question.options.A || "",
                          question.options.B || "",
                          question.options.C || "",
                          question.options.D || "",
                        ];
                      } else {
                        questionOptionsArray = [];
                      }
                      return questionOptionsArray.map((option, optionIndex) => {
                        const letter = ["A", "B", "C", "D"][optionIndex];
                        const isUserAnswer = userAnswer === letter;
                        const isCorrectAnswer =
                          question.correct_answer === letter;

                        let badgeVariant:
                          | "default"
                          | "destructive"
                          | "secondary" = "secondary";
                        if (isCorrectAnswer) badgeVariant = "default";
                        if (isUserAnswer && !isCorrect)
                          badgeVariant = "destructive";

                        return (
                          <div
                            key={letter}
                            className="flex items-center space-x-2"
                          >
                            <Badge
                              variant={badgeVariant}
                              className="w-6 h-6 flex items-center justify-center text-xs"
                            >
                              {letter}
                            </Badge>
                            <span className="text-sm">{option}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {!isCorrect && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button onClick={resetQuiz} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" /> Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Convert options to array format if it's an object
  let optionsArray: string[];
  if (Array.isArray(currentQuestion.options)) {
    optionsArray = currentQuestion.options;
  } else if (
    typeof currentQuestion.options === "object" &&
    currentQuestion.options
  ) {
    // Convert object format {A: "text", B: "text", ...} to array format
    optionsArray = [
      currentQuestion.options.A || "",
      currentQuestion.options.B || "",
      currentQuestion.options.C || "",
      currentQuestion.options.D || "",
    ];
  } else {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <p>Error: Quiz question data is malformed.</p>
            <p className="text-sm mt-2">
              Question {currentQuestionIndex + 1} options:{" "}
              {JSON.stringify(currentQuestion?.options)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-3 text-purple-500" />
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
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {optionsArray.map((option, index) => {
              const letter = ["A", "B", "C", "D"][index] as Answer;
              const isSelected =
                selectedAnswers[currentQuestionIndex] === letter;

              return (
                <button
                  key={letter}
                  onClick={() => handleAnswerSelect(letter)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className="w-6 h-6 flex items-center justify-center text-xs"
                    >
                      {letter}
                    </Badge>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswers[currentQuestionIndex] === null}
          >
            {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
