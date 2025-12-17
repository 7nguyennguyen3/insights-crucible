"use client";

import React, { useState } from "react";
import { Youtube, Twitter, Linkedin } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { SocialContent } from "@/types/analysis";

interface SocialTabProps {
  socialContent: SocialContent;
}

export const SocialTab: React.FC<SocialTabProps> = ({ socialContent }) => {
  const [platform, setPlatform] = useState<"youtube" | "twitter" | "linkedin">(
    "linkedin"
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar Controls */}
      <div className="lg:col-span-3 space-y-2">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-2">
          Platform
        </h3>
        <button
          onClick={() => setPlatform("linkedin")}
          className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            platform === "linkedin"
              ? "bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-400 shadow-sm border border-zinc-100 dark:border-zinc-800"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Linkedin size={18} className="mr-3" />
          LinkedIn
        </button>
        <button
          onClick={() => setPlatform("twitter")}
          className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            platform === "twitter"
              ? "bg-white dark:bg-zinc-900 text-sky-500 dark:text-sky-400 shadow-sm border border-zinc-100 dark:border-zinc-800"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Twitter size={18} className="mr-3" />
          Twitter / X
        </button>
        <button
          onClick={() => setPlatform("youtube")}
          className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            platform === "youtube"
              ? "bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-sm border border-zinc-100 dark:border-zinc-800"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Youtube size={18} className="mr-3" />
          YouTube
        </button>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-9">
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm min-h-[600px] overflow-hidden">
          <div className="border-b border-zinc-50 dark:border-zinc-800 px-6 py-4 flex justify-between items-center bg-zinc-50/30 dark:bg-zinc-900/30">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Preview
            </span>
            <div className="flex gap-2">
              <CopyButton
                text={
                  platform === "youtube"
                    ? socialContent.youtube_description
                    : platform === "twitter"
                    ? socialContent.twitter_thread.join("\n\n")
                    : socialContent.linkedin_post
                }
                label="Copy Content"
              />
            </div>
          </div>

          <div className="p-8 bg-zinc-50 dark:bg-zinc-900 h-full">
            {/* LinkedIn Preview */}
            {platform === "linkedin" && (
              <div className="max-w-[552px] mx-auto bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full flex-shrink-0"></div>
                  <div>
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-1.5"></div>
                    <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
                  </div>
                </div>
                <div className="text-[14px] leading-[1.4] text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                  {socialContent.linkedin_post}
                </div>
                <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex gap-6 text-zinc-500 text-sm font-medium">
                  <span>Like</span>
                  <span>Comment</span>
                  <span>Repost</span>
                  <span>Send</span>
                </div>
              </div>
            )}

            {/* Twitter Preview */}
            {platform === "twitter" && (
              <div className="max-w-[600px] mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {socialContent.twitter_thread.map((tweet, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm relative"
                  >
                    {i > 0 && (
                      <div className="absolute -top-6 left-8 w-0.5 h-6 bg-zinc-200 dark:bg-zinc-800"></div>
                    )}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                          <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
                        </div>
                        <div className="text-[15px] leading-normal text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                          {tweet}
                        </div>
                        <div className="mt-3 flex justify-between text-zinc-400 max-w-xs">
                          <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700"></div>
                          <div className="w-4 h-4 rounded-md border border-zinc-300 dark:border-zinc-700"></div>
                          <div className="w-4 h-4 rounded-md border border-zinc-300 dark:border-zinc-700"></div>
                          <div className="w-4 h-4 rounded-md border border-zinc-300 dark:border-zinc-700"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* YouTube Preview */}
            {platform === "youtube" && (
              <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-[14px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {socialContent.youtube_description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
