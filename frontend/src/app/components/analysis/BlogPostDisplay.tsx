// app/components/BlogPostDisplay.tsx

import React, { JSX } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// -- NEW: Import a few icons for our new block types
import { Newspaper, Lightbulb, MessageSquareQuote, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BlogPostData, BlogBlock } from "@/app/_global/interface";

interface BlogPostDisplayProps {
  content: BlogPostData;
  isEditMode: boolean;
  onChange: (newContent: BlogPostData) => void;
}

// Helper function to render each block
const renderBlock = (block: BlogBlock, index: number) => {
  switch (block.type) {
    case "heading":
      const Tag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
      // -- MODIFY: Differentiate styling for H2 vs H3 and use a softer font-weight.
      const sizeClass = block.level === 2 ? "text-2xl" : "text-xl";
      return (
        <Tag key={index} className={`mt-8 mb-3 ${sizeClass} font-semibold`}>
          {block.text}
        </Tag>
      );

    case "paragraph":
      return (
        <div key={index} className="mb-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {block.text || ""}
          </ReactMarkdown>
        </div>
      );

    // -- NEW: Add a case for rendering quotes
    case "quote":
      return (
        <blockquote
          key={index}
          className="my-6 border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic text-slate-600 dark:text-slate-400"
        >
          <p>{block.text}</p>
          {block.author && (
            <footer className="mt-2 text-sm font-semibold not-italic">
              — {block.author}
            </footer>
          )}
        </blockquote>
      );

    // -- NEW: Add a case for rendering visual suggestions
    case "visual_suggestion":
      return (
        <div
          key={index}
          className="my-6 flex items-start space-x-3 rounded-md border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950"
        >
          <Lightbulb className="h-5 w-5 flex-shrink-0 text-sky-500" />
          <p className="text-sm text-sky-800 dark:text-sky-200">
            <span className="font-semibold">Visual Suggestion:</span>{" "}
            {block.description}
          </p>
        </div>
      );

    // -- NEW: Add a case for rendering a call to action
    case "cta":
      return (
        <div
          key={index}
          className="my-8 rounded-lg bg-slate-100 p-6 text-center dark:bg-slate-800"
        >
          <Target className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-400" />
          <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">
            {block.text}
          </p>
        </div>
      );

    case "list": // This was in your original code, good to keep.
      return (
        <ul key={index}>
          {block.items?.map((item, itemIndex) => (
            <li key={itemIndex}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item}</ReactMarkdown>
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
};

export const BlogPostDisplay: React.FC<BlogPostDisplayProps> = ({
  content,
  isEditMode,
  onChange,
}) => {
  if (!content || !content.title) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900/70 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 text-slate-500">
        Blog post content is not available or is in an invalid format.
      </div>
    );
  }

  const handleEditChange = (textValue: string) => {
    try {
      const parsedJson = JSON.parse(textValue);
      onChange(parsedJson);
    } catch (error) {
      console.error("Invalid JSON format:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
      <Accordion type="single" collapsible className="w-full">
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
                value={JSON.stringify(content, null, 2)}
                onChange={(e) => handleEditChange(e.target.value)}
                className="w-full min-h-[400px] text-sm bg-slate-100 dark:bg-slate-800 font-mono"
                placeholder="Enter blog post content in JSON format..."
              />
            ) : (
              <article className="prose prose-slate dark:prose-invert max-w-none">
                {/* -- MODIFY: Use a softer font-weight for the main title */}
                <h1 className="text-3xl font-semibold mb-6">{content.title}</h1>
                {content.content?.map((block, index) =>
                  renderBlock(block, index)
                )}
              </article>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
