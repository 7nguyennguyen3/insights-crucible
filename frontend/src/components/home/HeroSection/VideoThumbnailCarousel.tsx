"use client";

import React from "react";
import { FEATURED_VIDEO } from "@/app/utils/data";

export const VideoThumbnailCarousel: React.FC = () => {
  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-transparent via-slate-100/50 to-transparent dark:via-slate-800/50 py-4">
      <div className="flex animate-scroll-infinite">
        {/* First set of videos */}
        {FEATURED_VIDEO.map((video) => (
          <div
            key={`first-${video.id}`}
            className="flex-shrink-0 mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group"
            style={{ width: "280px" }}
          >
            <div className="p-4">
              <div className="relative mb-3">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/10 rounded-lg group-hover:bg-black/20 transition-colors"></div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-2 mb-1">
                  {video.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {video.channelName}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Duplicate set for seamless infinite scroll */}
        {FEATURED_VIDEO.map((video) => (
          <div
            key={`second-${video.id}`}
            className="flex-shrink-0 mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group"
            style={{ width: "280px" }}
          >
            <div className="p-4">
              <div className="relative mb-3">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/10 rounded-lg group-hover:bg-black/20 transition-colors"></div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-2 mb-1">
                  {video.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {video.channelName}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-312px * 11));
          }
        }

        .animate-scroll-infinite {
          animation: scroll-infinite 44s linear infinite;
        }

        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
