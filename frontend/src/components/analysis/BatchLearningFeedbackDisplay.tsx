"use client";

import { OpenEndedQuestion } from "@/app/_global/interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Brain,
  CheckCircle,
  Target,
  TrendingUp,
  Lightbulb,
  MessageSquareQuote,
  ArrowLeft,
} from "lucide-react";
import React from "react";

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

interface BatchLearningFeedbackDisplayProps {
  feedback: LearningFeedback[];
  questions: OpenEndedQuestion[];
  userAnswers: string[];
  onClose: () => void;
}

const getUnderstandingColor = (level: string) => {
  switch (level) {
    case "advanced":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "proficient":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "developing":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "emerging":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
  }
};

const getMasteryColor = (level: string) => {
  switch (level) {
    case "strong":
    case "excellent":
    case "deep":
      return "text-green-600 dark:text-green-400";
    case "partial":
    case "good":
    case "surface":
      return "text-yellow-600 dark:text-yellow-400";
    case "emerging":
    case "needs_work":
    case "minimal":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-slate-600 dark:text-slate-400";
  }
};

export const BatchLearningFeedbackDisplay: React.FC<BatchLearningFeedbackDisplayProps> = ({
  feedback,
  questions,
  userAnswers,
  onClose,
}) => {
  const overallStats = {
    totalQuestions: feedback.length,
    averageLevel: feedback.reduce((acc, f) => {
      const levelValue = { emerging: 1, developing: 2, proficient: 3, advanced: 4 }[f.understanding_level];
      return acc + levelValue;
    }, 0) / feedback.length,
    strongAreas: feedback.reduce((acc, f) => acc + f.what_you_nailed.length, 0),
    growthAreas: feedback.reduce((acc, f) => acc + f.growth_opportunities.length, 0),
  };

  const getOverallLevel = (avg: number) => {
    if (avg >= 3.5) return "Advanced";
    if (avg >= 2.5) return "Proficient";
    if (avg >= 1.5) return "Developing";
    return "Emerging";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <Brain className="w-6 h-6 mr-3 text-purple-600" />
                Learning Assessment Complete
              </CardTitle>
              <CardDescription className="mt-2">
                AI-powered feedback on your thoughtful responses
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose} className="shrink-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quiz
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {overallStats.totalQuestions}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Questions Completed
              </div>
            </div>
            <div className="text-center">
              <Badge className={getUnderstandingColor(getOverallLevel(overallStats.averageLevel).toLowerCase())}>
                {getOverallLevel(overallStats.averageLevel)}
              </Badge>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Overall Level
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {overallStats.strongAreas}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Strengths Identified
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {overallStats.growthAreas}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Growth Opportunities
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Question Feedback */}
      {feedback.map((feedbackItem, index) => (
        <Card key={index} className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="w-4 h-4 mr-2 text-purple-500" />
                  Question {index + 1}
                  <Badge className={`ml-3 ${getUnderstandingColor(feedbackItem.understanding_level)}`}>
                    {feedbackItem.understanding_level.charAt(0).toUpperCase() + feedbackItem.understanding_level.slice(1)}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {questions[index]?.question}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Answer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                <MessageSquareQuote className="w-4 h-4 mr-2 text-blue-500" />
                Your Response
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                "{userAnswers[index]}"
              </p>
            </div>

            {/* Mastery Indicators */}
            <div>
              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2 text-green-500" />
                Mastery Indicators
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Concept Grasp
                  </div>
                  <div className={`text-sm font-semibold capitalize ${getMasteryColor(feedbackItem.mastery_indicators.concept_grasp)}`}>
                    {feedbackItem.mastery_indicators.concept_grasp}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Real-World Connection
                  </div>
                  <div className={`text-sm font-semibold capitalize ${getMasteryColor(feedbackItem.mastery_indicators.real_world_connection)}`}>
                    {feedbackItem.mastery_indicators.real_world_connection}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Critical Thinking
                  </div>
                  <div className={`text-sm font-semibold capitalize ${getMasteryColor(feedbackItem.mastery_indicators.critical_thinking)}`}>
                    {feedbackItem.mastery_indicators.critical_thinking}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* What You Nailed */}
              <div>
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  What You Nailed
                </h4>
                <div className="space-y-2">
                  {feedbackItem.what_you_nailed.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 shrink-0" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Opportunities */}
              <div>
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
                  Growth Opportunities
                </h4>
                <div className="space-y-2">
                  {feedbackItem.growth_opportunities.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 shrink-0" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Guided Questions */}
            {feedbackItem.guided_questions.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                  Questions for Deeper Reflection
                </h4>
                <div className="space-y-2">
                  {feedbackItem.guided_questions.map((question, idx) => (
                    <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">💭 {question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reflection Challenge */}
            {feedbackItem.reflection_challenge && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                  🚀 Challenge for Next Time
                </h4>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {feedbackItem.reflection_challenge}
                </p>
              </div>
            )}

            {/* Encouragement */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400 italic">
                "✨ {feedbackItem.encouragement}"
              </p>
            </div>

            {index < feedback.length - 1 && <Separator className="mt-6" />}
          </CardContent>
        </Card>
      ))}

      {/* Footer Actions */}
      <Card className="bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Great work completing this reflection exercise! Review your feedback and consider how you can apply these insights to deepen your learning.
            </p>
            <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};