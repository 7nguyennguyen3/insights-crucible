"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

/**
 * A simple component to safely render a string containing Markdown.
 * It uses the 'prose' class from @tailwindcss/typography for nice styling.
 * If you don't have that plugin, it will still render correctly with default styles.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  return (
    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};
