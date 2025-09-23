"use client";

import React from "react";
import { ExternalLink, Github } from "lucide-react";

export const TeamSection: React.FC = () => (
  <section className="py-20 bg-slate-50 dark:bg-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          About the Mission
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
          Building open-source tools that transform how we learn from content
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          {/* Founder Profile */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <img
              src="/Nguyen_Nguyen_Profile_Image.png"
              alt="Nguyen Nguyen"
              className="w-24 h-24 rounded-full object-cover shadow-lg"
            />
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Nguyen Nguyen
              </h3>
              <p className="text-blue-600 dark:text-blue-400 font-semibold mb-3">
                Founder & Developer
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                "I was incredibly inefficient at studying—spending hours on
                flashcards that felt like memorization, not real learning. I
                knew there had to be a better way, so I started building my own
                learning system. This open-source platform is the result of that
                journey."
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://x.com/ICrucibleHQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Follow the Journey
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/7nguyennguyen3/insights-crucible"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"
            >
              View Source Code
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);
