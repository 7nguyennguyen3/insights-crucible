// app/components/BlogPostDisplay.tsx

import React from "react";
import { Textarea } from "@/components/ui/textarea"; // Use Textarea for multi-line editing
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Newspaper } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogPostDisplayProps {
  content: string;
  isEditMode: boolean;
  onChange: (newContent: string) => void;
}

export const BlogPostDisplay: React.FC<BlogPostDisplayProps> = ({
  content,
  isEditMode,
  onChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
      <Accordion
        type="single"
        collapsible
        defaultValue="blog-post"
        className="w-full"
      >
        <AccordionItem value="blog-post" className="border-b-0">
          <AccordionTrigger className="p-6 text-left hover:no-underline">
            <div className="flex items-center space-x-3 w-full">
              <div className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                <Newspaper className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                Generated Blog Post
              </h3>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6 pt-0">
            {isEditMode ? (
              <Textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                className="w-full min-h-[300px] text-base bg-slate-100 dark:bg-slate-800"
                placeholder="Enter blog post content in Markdown..."
              />
            ) : (
              <article className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </article>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
