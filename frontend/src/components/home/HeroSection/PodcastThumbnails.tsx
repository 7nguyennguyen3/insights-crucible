"use client";

import React from "react";
import { PODCAST_IMAGES } from "@/lib/constants";

export const PodcastThumbnails: React.FC = () => (
  <div className="relative hidden md:flex items-center justify-center">
    <div className="relative w-[450px] md:w-[500px] lg:w-[600px] h-[400px] md:h-[475px] lg:h-[550px]">
      <div className="relative h-full flex items-start justify-center pt-6 md:pt-7 lg:pt-8">
        {/* Modern Wisdom - Left, tilting inward */}
        <div className="absolute top-6 md:top-8 lg:top-10 left-0 group z-10">
          <div className="relative overflow-hidden rounded-xl shadow-2xl transform -rotate-12 transition-all duration-300 group-hover:scale-105">
            <img
              src={PODCAST_IMAGES.MODERN_WISDOM}
              alt="Modern Wisdom Podcast"
              className="w-44 md:w-52 lg:w-60 h-[300px] md:h-[350px] lg:h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* Huberman Lab - Center, main character */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 group z-30">
          <div className="relative overflow-hidden rounded-xl shadow-2xl transform rotate-0 transition-all duration-300 group-hover:scale-105">
            <img
              src={PODCAST_IMAGES.HUBERMAN_LAB}
              alt="Huberman Lab Podcast"
              className="w-44 md:w-52 lg:w-60 h-[300px] md:h-[350px] lg:h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* Lex Fridman - Right, tilting away from center */}
        <div className="absolute top-6 md:top-8 lg:top-10 right-0 group z-10">
          <div className="relative overflow-hidden rounded-xl shadow-2xl transform rotate-12 transition-all duration-300 group-hover:scale-105">
            <img
              src={PODCAST_IMAGES.LEX_FRIDMAN}
              alt="Lex Fridman Podcast"
              className="w-44 md:w-52 lg:w-60 h-[300px] md:h-[350px] lg:h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </div>

      {/* Learning metrics overlay - positioned below images */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-5 py-3 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="text-sm text-center">
          <div className="font-semibold text-teal-600 dark:text-teal-400">
            Learn 10X Faster
          </div>
        </div>
      </div>
    </div>
  </div>
);
