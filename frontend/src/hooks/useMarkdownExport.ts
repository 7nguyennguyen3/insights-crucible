import { useCallback } from "react";
import { toast } from "sonner";
import {
  JobData,
  GeneralAnalysisSection,
  ConsultantAnalysisSection,
  Slide,
  Contradiction,
  GlobalContextualBriefingPayload,
  Viewpoint,
  BlogBlock,
} from "@/app/_global/interface";
import { generateReportBlueprint } from "@/app/utils/reportGenerator";

const generateMarkdown = (data: JobData): string => {
  const blueprint = generateReportBlueprint(data);
  let md = "";

  // Helper to format malformed markdown from the DB
  const formatMarkdownContent = (content: string) => {
    if (!content) return "";
    let formatted = content.replace(/(\n)(##+\s)/g, "\n\n$2");
    formatted = formatted.replace(/(##+\s[^\n]+)(\n)([^\n])/g, "$1\n\n$3");
    return formatted;
  };

  for (const part of blueprint) {
    switch (part.type) {
      case "title":
        md += `# ${part.content}\n\n`;
        break;

      case "synthesis":
        md += `## Executive Synthesis\n\n`;
        md += `### Strategic Narrative Arc\n${
          part.data.narrative_arc || "N/A"
        }\n\n`;
        md += `### Overarching Themes\n`;
        (part.data.overarching_themes ?? []).forEach(
          (theme: string) => (md += `- ${theme}\n`)
        );
        md += `\n`;
        md += `### Key Contradictions\n`;
        (part.data.key_contradictions ?? []).forEach((c: Contradiction) => {
          md += `> **Point A:** ${c.point_a}\n> **Point B:** ${c.point_b}\n**Analysis:** ${c.analysis}\n\n`;
        });
        md += `### Unifying Insights\n`;
        (part.data.unifying_insights ?? []).forEach(
          (insight: string) => (md += `* ${insight}\n\n`)
        );
        break;

      case "argument":
        md += `## Argument & Thesis Breakdown\n\n`;
        md += `### Main Thesis\n${part.data.main_thesis || "N/A"}\n\n`;
        md += `### Supporting Arguments\n`;
        (part.data.supporting_arguments ?? []).forEach(
          (arg: string) => (md += `- ${arg}\n`)
        );
        md += `\n`;
        if (part.data.counterarguments_mentioned?.length > 0) {
          md += `### Counterarguments Mentioned\n`;
          (part.data.counterarguments_mentioned ?? []).forEach(
            (arg: string) => (md += `- ${arg}\n`)
          );
          md += `\n`;
        }
        break;

      case "global_briefing":
        const briefing = part.data as GlobalContextualBriefingPayload;
        md += `## Global Contextual Briefing\n\n`;
        md += `**Claim:** ${briefing.claim_text}\n\n`;
        if (briefing.briefing_data.overall_summary) {
          md += `### Summary\n${briefing.briefing_data.overall_summary}\n\n`;
        }
        if (briefing.briefing_data.supporting_viewpoints?.length) {
          md += `### Supporting Viewpoints\n`;
          briefing.briefing_data.supporting_viewpoints.forEach(
            (v: Viewpoint) => {
              md += `- **${v.source}:** ${v.perspective}\n`;
            }
          );
          md += `\n`;
        }
        if (briefing.briefing_data.challenging_viewpoints?.length) {
          md += `### Challenging Viewpoints\n`;
          briefing.briefing_data.challenging_viewpoints.forEach(
            (v: Viewpoint) => {
              md += `- **${v.source}:** ${v.perspective}\n`;
            }
          );
          md += `\n`;
        }
        break;

      case "blog_post":
        md += `## Generated Blog Post\n\n`;
        const blogPost = part.content; // part.content is now a BlogPostData object

        if (blogPost && blogPost.title) {
          // Add the blog post's main title as an H3
          md += `### ${blogPost.title}\n\n`;

          // Process each content block from the array
          blogPost.content.forEach((block: BlogBlock) => {
            switch (block.type) {
              case "heading":
                // Use #### for h2, ##### for h3 to maintain report hierarchy
                const headingLevel = (block.level || 2) + 2;
                md += `${"#".repeat(headingLevel)} ${block.text}\n\n`;
                break;
              case "paragraph":
                md += `${block.text}\n\n`;
                break;
              case "list":
                (block.items || []).forEach((item) => {
                  md += `- ${item}\n`;
                });
                md += "\n";
                break;
              case "quote":
                md += `> ${block.text}`;
                if (block.author) {
                  md += `\n> — ${block.author}`;
                }
                md += `\n\n`;
                break;
              case "cta":
                md += `**➡️ Call to Action:** ${block.text}\n\n`;
                break;
              case "visual_suggestion":
                md += `*[💡 Visual Suggestion: ${block.description}]*\n\n`;
                break;
            }
          });
        }
        break;

      case "x_thread":
        md += `## Generated X/Twitter Thread\n\n`;
        (part.thread as string[]).forEach((tweet, index) => {
          md += `${index + 1}. ${tweet}\n\n`;
        });
        break;

      case "detailed_sections_header":
        md += `## Detailed Section-by-Section Analysis\n\n`;
        break;

      case "detailed_sections":
        (part.sections ?? []).forEach((section: any, index: number) => {
          if (part.persona === "consultant") {
            const s = section as ConsultantAnalysisSection;
            md += `### ${index + 1}. ${s.section_title}\n\n**Executive Summary:** ${
              s.executive_summary
            }\n\n`;
            md += `**Client Pain Points:**\n`;
            (s.client_pain_points ?? []).forEach((p) => (md += `- ${p}\n`));
            md += `\n`;
          } else {
            const s = section as GeneralAnalysisSection;
            md += `### ${index + 1}. ${s.generated_title}\n\n> ${
              s["1_sentence_summary"]
            }\n\n`;
            md += `**Summary Points:**\n`;
            (s.summary_points ?? []).forEach((p) => (md += `- ${p}\n`));
            md += `\n`;

            // --- START REPLACEMENT / ADDITION FOR GENERAL ANALYSIS ---
            if (s.actionable_advice?.length > 0) {
              md += `**Actionable Advice:**\n`;
              (s.actionable_advice ?? []).forEach(
                (advice) => (md += `- ${advice}\n`)
              );
              md += `\n`; // Add space after this section
            }

            if (s.notable_quotes?.length > 0) {
              md += `**Notable Quotes:**\n`;
              (s.notable_quotes ?? []).forEach(
                (quote) => (md += `> "${quote}"\n`)
              );
              md += `\n`; // Add space after this section
            }

            if (s.questions_and_answers?.length > 0) {
              md += `**Questions & Answers:**\n`;
              (s.questions_and_answers ?? []).forEach((qa) => {
                md += `**Q:** ${qa.question}\n`;
                md += `**A:** ${qa.answer}\n\n`;
              });
              md += `\n`; // Add space after this section
            }
            // --- END REPLACEMENT / ADDITION ---
          }
        });
        break;

      case "slide_deck_header":
        md += `## Slide Deck Outline\n\n`;
        break;

      case "slide_deck":
        (part.slides ?? []).forEach((slide: Slide) => {
          md += `### ${slide.slide_title}\n\n`;
          (slide.slide_bullets ?? []).forEach(
            (bullet: string) => (md += `- ${bullet}\n`)
          );
          md += `\n`;
        });
        break;
    }
  }
  return md;
};

export const useMarkdownExport = (jobData: JobData | null) => {
  const exportToMarkdown = useCallback(() => {
    if (!jobData) {
      toast.error("No data available to export.");
      return;
    }
    const markdownContent = generateMarkdown(jobData);
    navigator.clipboard.writeText(markdownContent);
    toast.success("Analysis copied to clipboard as Markdown!");
  }, [jobData]);

  return { exportToMarkdown };
};
