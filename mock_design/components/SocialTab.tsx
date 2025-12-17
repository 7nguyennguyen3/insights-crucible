import React, { useState } from "react";
import { Youtube, Twitter, Linkedin, Copy } from "lucide-react";
import { CopyButton } from "./CopyButton";

interface SocialTabProps {
  data: {
    youtube_description: string;
    twitter_thread: string[];
    linkedin_post: string;
  };
}

export const SocialTab: React.FC<SocialTabProps> = ({ data }) => {
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
              ? "bg-white text-blue-700 shadow-sm border border-zinc-100"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Linkedin size={18} className="mr-3" />
          LinkedIn
        </button>
        <button
          onClick={() => setPlatform("twitter")}
          className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            platform === "twitter"
              ? "bg-white text-sky-500 shadow-sm border border-zinc-100"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Twitter size={18} className="mr-3" />
          Twitter / X
        </button>
        <button
          onClick={() => setPlatform("youtube")}
          className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            platform === "youtube"
              ? "bg-white text-red-600 shadow-sm border border-zinc-100"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Youtube size={18} className="mr-3" />
          YouTube
        </button>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-9">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm min-h-[600px] overflow-hidden">
          <div className="border-b border-zinc-50 px-6 py-4 flex justify-between items-center bg-zinc-50/30">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Preview
            </span>
            <div className="flex gap-2">
              <CopyButton
                text={
                  platform === "youtube"
                    ? data.youtube_description
                    : platform === "twitter"
                    ? data.twitter_thread.join("\n\n")
                    : data.linkedin_post
                }
                label="Copy Content"
              />
            </div>
          </div>

          <div className="p-8 bg-[#fafafa] h-full">
            {/* LinkedIn Preview */}
            {platform === "linkedin" && (
              <div className="max-w-[552px] mx-auto bg-white rounded-lg border border-zinc-200 shadow-sm p-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 bg-zinc-200 rounded-full flex-shrink-0"></div>
                  <div>
                    <div className="h-4 w-32 bg-zinc-200 rounded mb-1.5"></div>
                    <div className="h-3 w-20 bg-zinc-100 rounded"></div>
                  </div>
                </div>
                <div className="text-[14px] leading-[1.4] text-zinc-900 whitespace-pre-wrap">
                  {data.linkedin_post}
                </div>
                <div className="mt-4 pt-2 border-t border-zinc-100 flex gap-6 text-zinc-500 text-sm font-medium">
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
                {data.twitter_thread.map((tweet, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm relative"
                  >
                    {i > 0 && (
                      <div className="absolute -top-6 left-8 w-0.5 h-6 bg-zinc-200"></div>
                    )}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-zinc-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-4 w-24 bg-zinc-200 rounded"></div>
                          <div className="h-4 w-16 bg-zinc-100 rounded"></div>
                        </div>
                        <div className="text-[15px] leading-normal text-zinc-900 whitespace-pre-wrap">
                          {tweet}
                        </div>
                        <div className="mt-3 flex justify-between text-zinc-400 max-w-xs">
                          <div className="w-4 h-4 rounded-full border border-zinc-300"></div>
                          <div className="w-4 h-4 rounded-md border border-zinc-300"></div>
                          <div className="w-4 h-4 rounded-md border border-zinc-300"></div>
                          <div className="w-4 h-4 rounded-md border border-zinc-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* YouTube Preview */}
            {platform === "youtube" && (
              <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-[14px] text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {data.youtube_description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
