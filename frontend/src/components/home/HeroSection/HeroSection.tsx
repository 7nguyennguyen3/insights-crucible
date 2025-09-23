"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Brain, CheckCircle, Clock, Play } from "lucide-react";
import { CustomButton } from "@/components/common/CustomButton";
import { ROUTES } from "@/lib/constants";
import { VideoThumbnailCarousel } from "./VideoThumbnailCarousel";

export const HeroSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/20 to-transparent dark:via-slate-700/20"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              {/* Beta announcement */}
              <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Open Source • Early Access Beta
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-slate-900 dark:text-slate-100">
                  Transform Long Videos Into
                </span>
                <br />
                <span className="text-blue-600 dark:text-blue-400">
                  Structured Learning
                </span>
              </h1>

              <p className="mt-8 text-xl md:text-2xl leading-relaxed text-slate-700 dark:text-slate-300 max-w-2xl lg:max-w-none">
                Turn hour-long YouTube videos, podcasts, and lectures into
                structured learning sessions with AI-powered analysis and
                interactive quizzes.
                <strong className="text-slate-900 dark:text-slate-100 block mt-2">
                  Stop passive watching. Start active learning.
                </strong>
              </p>

              <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <CustomButton
                  href={ROUTES.AUTH_SIGNUP}
                  variant="primary"
                  className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Get 30 Free Credits
                  <ArrowRight className="w-5 h-5" />
                </CustomButton>

                <div className="flex flex-col items-center">
                  <CustomButton
                    href={ROUTES.LIBRARY}
                    variant="secondary"
                    className="border-slate-300 text-slate-700 dark:text-slate-300"
                  >
                    View Sample Analysis
                  </CustomButton>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    No sign-up required
                  </p>
                </div>
              </div>

              {/* Beta benefits */}
              <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm font-medium">
                  <span>🎁</span>
                  <span>
                    Start with 30 free credits • No subscriptions, pay only when
                    you need more
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Product Preview */}
            <div className="relative hidden md:flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                {/* Detailed Dashboard Mockup */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Mock browser header */}
                  <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="ml-4 bg-white dark:bg-slate-800 px-3 py-1 rounded text-xs text-slate-600 dark:text-slate-400">
                      insights-crucible.com/dashboard
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-6">
                    {/* Header with stats */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Your Learning Dashboard
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                          <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                            12
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-500">
                            Analyzed
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                          <div className="text-sm font-semibold text-green-700 dark:text-green-400">
                            8.5h
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-500">
                            Time Saved
                          </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                          <div className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                            89%
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-500">
                            Avg. Score
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Analyses */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Recent Analyses
                      </h4>

                      {/* Analysis Item 1 */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src="/huberman_lab_podcast_image.png"
                            alt="Huberman Lab Podcast"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            Huberman Lab: Sleep & Recovery
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <span>3h 24m → 18m</span>
                            <span className="text-green-600">✓ Completed</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            92%
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500">
                            Quiz Score
                          </div>
                        </div>
                      </div>

                      {/* Analysis Item 2 */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src="/lex_fridman_podcast_image.png"
                            alt="Lex Fridman Podcast"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            Lex Fridman: AI & The Future
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <span>2h 45m → 15m</span>
                            <span className="text-blue-600">
                              📚 In Progress
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            7/12
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500">
                            Questions
                          </div>
                        </div>
                      </div>

                      {/* Analysis Item 3 */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src="/modern_wisdom_podcast_image.png"
                            alt="Modern Wisdom Podcast"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            Modern Wisdom: Productivity
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <span>1h 52m → 12m</span>
                            <span className="text-green-600">✓ Completed</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            95%
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500">
                            Quiz Score
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <span className="font-medium">Ready for more?</span>
                          <br />
                          <span className="text-xs">
                            Upload your next learning
                          </span>
                        </div>
                        <CustomButton
                          href={ROUTES.ENGINE}
                          variant="primary"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                          + Add New
                        </CustomButton>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Active Learning
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    ⚡ 3x faster learning
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats and Social Proof Section */}
      <section className="py-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                3.2x
              </div>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Faster Learning
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                vs traditional note-taking
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                85%
              </div>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Better Retention
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Quiz performance vs passive listening
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                1,200+
              </div>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Episodes Analyzed
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                By our beta community
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                92%
              </div>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                User Satisfaction
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Would recommend to colleagues
              </div>
            </div>
          </div>

          {/* How It Works Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Enhanced Demo Preview with Browser Mockup - Now on Left */}
            <div className="relative w-full max-w-lg mx-auto lg:order-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Mock browser header */}
                <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="ml-4 bg-white dark:bg-slate-800 px-3 py-1 rounded text-xs text-slate-600 dark:text-slate-400">
                    insights-crucible.com/analysis/sample
                  </div>
                </div>

                {/* Enhanced Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Sample Analysis Result
                  </h4>

                  {/* Key Concepts Preview */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Key Concepts Extracted
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                          Building Better Habits
                        </span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                          High Impact
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                          Productivity Systems
                        </span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                          Actionable
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quiz Preview */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Interactive Quiz Sample
                    </h5>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                        What's the most effective way to build lasting habits?
                      </p>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-600 dark:text-slate-400 p-1">
                          A) Start with big, ambitious changes
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-400 p-1 bg-green-50 dark:bg-green-900/20 rounded">
                          ✓ B) Begin with small, consistent actions
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      <strong>2h 45m video → 15m learning session</strong>
                    </p>
                    <CustomButton
                      href={ROUTES.LIBRARY}
                      variant="primary"
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md py-3"
                    >
                      <Play className="w-3 h-3" />
                      Try Sample Analysis
                    </CustomButton>
                  </div>
                </div>
              </div>

              {/* Floating elements - Adjusted for left positioning */}
              <div className="absolute -top-4 -left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Live Preview
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  🎯 Interactive learning
                </span>
              </div>
            </div>

            {/* Text Content - Now on Right */}
            <div className="lg:order-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                From Hours to Minutes
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Intelligent Concept Extraction
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      AI identifies and extracts the most important concepts,
                      eliminating filler content and tangents.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Active Learning Design
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Interactive quizzes and spaced repetition ensure 40%
                      better retention than passive listening.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Structured Learning Path
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Content organized for optimal comprehension, with clear
                      progress tracking and mastery indicators.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted Content Sources */}
          <div className="mt-16 text-center">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-8">
              Works with Top Educational Content
            </h3>
            <VideoThumbnailCarousel />
          </div>
        </div>
      </section>
    </div>
  );
};
