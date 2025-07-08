"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Twitter,
  Bot,
  MessageCircle,
  Repeat,
  Heart,
  BarChart2,
  ClipboardCopy,
  Check,
} from "lucide-react";

interface XThreadDisplayProps {
  xThreadContent: string[];
}

export const XThreadDisplay: React.FC<XThreadDisplayProps> = ({
  xThreadContent,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!xThreadContent || xThreadContent.length === 0) {
    return null;
  }

  const handleCopyThread = () => {
    // Format the thread with double newlines for easy pasting
    const threadString = xThreadContent.join("\n\n");
    navigator.clipboard.writeText(threadString);
    setIsCopied(true);
    toast.success("Thread copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <Card className="shadow-md">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="x-thread" className="border-b-0">
          <AccordionTrigger className="p-6 text-left hover:no-underline">
            <div className="flex items-center text-xl font-semibold w-full text-slate-800 dark:text-slate-100">
              <Twitter className="w-6 h-6 mr-3 text-[#1DA1F2]" />
              Generated X (Twitter) Thread
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6 pt-0">
            <div className="flex justify-end mb-4">
              <Button onClick={handleCopyThread} size="sm" variant="outline">
                {isCopied ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <ClipboardCopy className="w-4 h-4 mr-2" />
                )}
                {isCopied ? "Copied!" : "Copy Thread"}
              </Button>
            </div>

            <div className="border rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
              {xThreadContent.map((tweet, index) => (
                <div
                  key={index}
                  className="flex space-x-4 p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                >
                  <Bot className="flex-shrink-0 w-10 h-10 text-slate-400" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        AI Assistant
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        @GeneratedThread
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        ·
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Just now
                      </span>
                    </div>

                    <p className="my-2 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {tweet}
                    </p>

                    <div className="flex items-center justify-between max-w-sm mt-3 text-slate-500 dark:text-slate-400">
                      <MessageCircle className="w-4 h-4" />
                      <Repeat className="w-4 h-4" />
                      <Heart className="w-4 h-4" />
                      <BarChart2 className="w-4 h-4" />
                      <span className="text-xs">
                        {index + 1} / {xThreadContent.length}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
