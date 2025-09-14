"use client";

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
  BrainCircuit,
  CheckCircle,
  Lightbulb,
  MessageCircle,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import React from "react";

interface LearningFeedbackData {
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

interface LearningFeedbackDisplayProps {
  feedback: LearningFeedbackData;
  question: string;
  userAnswer: string;
  onClose?: () => void;
  onContinueReflecting?: () => void;
}

const getLevelColor = (level: string) => {
  switch (level) {
    case "advanced":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "proficient":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "developing":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "emerging":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

const getIndicatorColor = (indicator: string) => {
  switch (indicator) {
    case "strong":
    case "excellent":
    case "deep":
      return "text-green-600 dark:text-green-400";
    case "partial":
    case "good":
    case "surface":
      return "text-blue-600 dark:text-blue-400";
    case "emerging":
    case "needs_work":
    case "minimal":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

export const LearningFeedbackDisplay: React.FC<LearningFeedbackDisplayProps> = ({
  feedback,
  question,
  userAnswer,
  onClose,
  onContinueReflecting,
}) => {
  const levelColor = getLevelColor(feedback.understanding_level);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center mb-2">
          <Sparkles className="w-6 h-6 mr-3 text-purple-500" />
          Learning Feedback
        </CardTitle>
        <Badge className={`mx-auto text-sm font-medium ${levelColor}`}>
          {feedback.understanding_level.charAt(0).toUpperCase() + feedback.understanding_level.slice(1)} Understanding
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Encouragement Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
          <div className="flex items-start">
            <TrendingUp className="w-5 h-5 text-purple-600 mt-1 mr-3 flex-shrink-0" />
            <p className="text-purple-800 dark:text-purple-200 font-medium">
              {feedback.encouragement}
            </p>
          </div>
        </div>

        {/* Understanding Indicators */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="mb-2">
              <BrainCircuit className={`w-6 h-6 mx-auto ${getIndicatorColor(feedback.mastery_indicators.concept_grasp)}`} />
            </div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Concept Grasp</div>
            <div className={`text-sm font-semibold ${getIndicatorColor(feedback.mastery_indicators.concept_grasp)}`}>
              {feedback.mastery_indicators.concept_grasp.charAt(0).toUpperCase() + feedback.mastery_indicators.concept_grasp.slice(1)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <Target className={`w-6 h-6 mx-auto ${getIndicatorColor(feedback.mastery_indicators.real_world_connection)}`} />
            </div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Real-World Connection</div>
            <div className={`text-sm font-semibold ${getIndicatorColor(feedback.mastery_indicators.real_world_connection)}`}>
              {feedback.mastery_indicators.real_world_connection.charAt(0).toUpperCase() + feedback.mastery_indicators.real_world_connection.slice(1)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <MessageCircle className={`w-6 h-6 mx-auto ${getIndicatorColor(feedback.mastery_indicators.critical_thinking)}`} />
            </div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Critical Thinking</div>
            <div className={`text-sm font-semibold ${getIndicatorColor(feedback.mastery_indicators.critical_thinking)}`}>
              {feedback.mastery_indicators.critical_thinking.charAt(0).toUpperCase() + feedback.mastery_indicators.critical_thinking.slice(1)}
            </div>
          </div>
        </div>

        <Separator />

        {/* What You Nailed */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-green-700 dark:text-green-300 mb-3">
            <CheckCircle className="w-5 h-5 mr-2" />
            What You Nailed
          </h3>
          <div className="space-y-2">
            {feedback.what_you_nailed.map((strength, index) => (
              <div key={index} className="flex items-start bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0" />
                <p className="text-green-800 dark:text-green-200">{strength}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Opportunities */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3">
            <TrendingUp className="w-5 h-5 mr-2" />
            Growth Opportunities
          </h3>
          <div className="space-y-2">
            {feedback.growth_opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-start bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <ArrowRight className="w-4 h-4 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                <p className="text-blue-800 dark:text-blue-200">{opportunity}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guided Questions */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3">
            <MessageCircle className="w-5 h-5 mr-2" />
            Questions to Deepen Your Thinking
          </h3>
          <div className="space-y-2">
            {feedback.guided_questions.map((question, index) => (
              <div key={index} className="flex items-start bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="text-purple-500 font-bold mt-1 mr-3 flex-shrink-0">?</div>
                <p className="text-purple-800 dark:text-purple-200">{question}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Prompts */}
        {feedback.connection_prompts && feedback.connection_prompts.length > 0 && (
          <div>
            <h3 className="flex items-center text-lg font-semibold text-orange-700 dark:text-orange-300 mb-3">
              <Lightbulb className="w-5 h-5 mr-2" />
              Connections to Explore
            </h3>
            <div className="space-y-2">
              {feedback.connection_prompts.map((prompt, index) => (
                <div key={index} className="flex items-start bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <Lightbulb className="w-4 h-4 text-orange-500 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-orange-800 dark:text-orange-200">{prompt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflection Challenge */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="flex items-center text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
            <Target className="w-5 h-5 mr-2" />
            Reflection Challenge
          </h3>
          <p className="text-slate-600 dark:text-slate-300 italic font-medium">
            {feedback.reflection_challenge}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {onContinueReflecting && (
            <Button onClick={onContinueReflecting} className="flex-1">
              <Lightbulb className="w-4 h-4 mr-2" />
              Continue Reflecting
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close Feedback
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};