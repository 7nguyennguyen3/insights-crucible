// app/components/BlogPostDisplay.tsx (Corrected)

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
import { Check, Copy, Newspaper } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogPostDisplayProps {
  blogPostContent: string;
}

export const BlogPostDisplay: React.FC<BlogPostDisplayProps> = ({
  blogPostContent,
}) => {
  const [hasCopied, setHasCopied] = useState(false);

  // Pre-process the markdown string to fix newlines for better display
  const formattedContent = blogPostContent.replace(
    /(#{2,3}\s[^\n\r]+)(?=\s[A-Z])/g,
    "$1\n\n"
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(blogPostContent);
    toast.success("Blog post copied to clipboard!");
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      <AccordionItem
        value="blog-post"
        className="bg-white dark:bg-slate-900/70 rounded-lg shadow-md border-b-0"
      >
        <AccordionTrigger className="p-6 text-left hover:no-underline">
          <div className="flex items-center space-x-4">
            <Newspaper className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              Generated Blog Post
            </h3>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-6 pt-0">
          <div className="space-y-4">
            {/* --- FIX: MOVED BUTTON HERE --- */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {hasCopied ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {hasCopied ? "Copied" : "Copy Text"}
              </Button>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none border-t border-slate-200 dark:border-slate-700 pt-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formattedContent}
              </ReactMarkdown>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
