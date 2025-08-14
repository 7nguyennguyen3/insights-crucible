//src/app/components/analysis/LinkedInPostDisplay.tsx

"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Film, Image as ImageIcon } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { EditableField } from "./EditableField";
import { LinkedInPost } from "@/app/_global/interface";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LinkedInPostDisplayProps {
  post: LinkedInPost;
  isEditMode: boolean;
  onChange: (field: keyof LinkedInPost, value: any) => void;
}

// Helper to render the visual suggestion icon
const VisualIcon = ({ suggestion }: { suggestion: string }) => {
  const lowerSuggestion = suggestion.toLowerCase();
  if (lowerSuggestion.includes("carousel") || lowerSuggestion.includes("pdf")) {
    return <ImageIcon className="h-5 w-5 flex-shrink-0 text-sky-500" />;
  }
  if (lowerSuggestion.includes("video")) {
    return <Film className="h-5 w-5 flex-shrink-0 text-sky-500" />;
  }
  return <ImageIcon className="h-5 w-5 flex-shrink-0 text-sky-500" />;
};

export const LinkedInPostDisplay = ({
  post,
  isEditMode,
  onChange,
}: LinkedInPostDisplayProps) => {
  if (!post) return null;

  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="linkedin-post" className="border-b-0">
          <AccordionTrigger className="p-6 text-left hover:no-underline">
            <div className="flex items-center space-x-3 w-full">
              <div className="flex-shrink-0 bg-sky-100 dark:bg-sky-900/70 p-2 rounded-md">
                <FaLinkedin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                Generated LinkedIn Post
              </h3>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6 pt-0 space-y-6">
            {/* Post Content */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Post Content
              </label>
              {isEditMode ? (
                <Textarea
                  value={post.post_text}
                  onChange={(e) => onChange("post_text", e.target.value)}
                  placeholder="Enter LinkedIn post content..."
                  className="w-full min-h-[250px] text-base leading-relaxed bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none rounded-md border bg-slate-50/50 dark:bg-slate-900/40 p-4">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="mb-4 last:mb-0" {...props} />
                      ),
                    }}
                  >
                    {post.post_text}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Archetype */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Post Archetype
              </label>
              {isEditMode ? (
                <Input
                  value={post.archetype_used}
                  onChange={(e) => onChange("archetype_used", e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <div>
                  <Badge variant="secondary">{post.archetype_used}</Badge>
                </div>
              )}
            </div>

            {/* Visual Suggestion */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Visual Suggestion
              </label>
              {isEditMode ? (
                <Input
                  value={post.visual_suggestion}
                  onChange={(e) =>
                    onChange("visual_suggestion", e.target.value)
                  }
                  className="bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <div className="flex items-start space-x-3 rounded-md border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950">
                  <VisualIcon suggestion={post.visual_suggestion} />
                  <p className="text-sm text-sky-800 dark:text-sky-200">
                    {post.visual_suggestion}
                  </p>
                </div>
              )}
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Hashtags
              </label>
              {isEditMode ? (
                <Input
                  value={post.hashtags.join(", ")}
                  onChange={(e) =>
                    onChange(
                      "hashtags",
                      e.target.value.split(",").map((tag) => tag.trim())
                    )
                  }
                  placeholder="Enter hashtags, separated by commas"
                  className="bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="font-mono">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
