"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface PromoNotificationProps {
  credits: string;
  promoDeadlineText: string;
}

export const PromoNotification: React.FC<PromoNotificationProps> = ({
  credits,
  promoDeadlineText,
}) => (
  <div className="mb-12 flex justify-center">
    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/30 dark:to-blue-900/30 border border-teal-200 dark:border-teal-700/50 rounded-full shadow-lg backdrop-blur-sm">
      <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
      <span className="font-semibold text-teal-800 dark:text-teal-200">
        Limited Time: Get {credits} free analyses before {promoDeadlineText}
      </span>
    </div>
  </div>
);