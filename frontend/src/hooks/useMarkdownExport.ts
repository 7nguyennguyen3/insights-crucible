import { useCallback } from "react";
import { toast } from "sonner";
import {
  JobData,
  GeneralAnalysisSection,
  ConsultantAnalysisSection,
  Slide,
  Contradiction,
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




      case "detailed_sections_header":
        md += `## Detailed Section-by-Section Analysis\n\n`;
        break;

      case "detailed_sections":
        (part.sections ?? []).forEach((section: any, index: number) => {
          const s = section; // 's' is now accessible throughout the forEach callback

          // Construct the time string
          let timeDisplay = "";
          if (s.start_time || s.end_time) {
            timeDisplay = ` (${s.start_time || "00:00"}-${s.end_time || "XX:XX"})`;
          }

          if (part.persona === "consultant") {
            const consultantSection = section as ConsultantAnalysisSection;
            md += `### ${index + 1}. ${consultantSection.section_title}${timeDisplay}\n\n**Executive Summary:** ${
              consultantSection.executive_summary
            }\n\n`;
            md += `**Client Pain Points:**\n`;
            (consultantSection.client_pain_points ?? []).forEach(
              (p) => (md += `- ${p}\n`)
            );
            md += `\n`;
            // Add Critical Quotes for consultant persona
            if (consultantSection.critical_quotes?.length > 0) {
              md += `**Critical Quotes:**\n`;
              (consultantSection.critical_quotes ?? []).forEach(
                (quote) => (md += `> "${quote}"\n`)
              );
              md += `\n`;
            }
            // Add Strategic Opportunities for consultant persona
            if (consultantSection.strategic_opportunities?.length > 0) {
              md += `**Strategic Opportunities:**\n`;
              (consultantSection.strategic_opportunities ?? []).forEach(
                (opportunity) => (md += `- ${opportunity}\n`)
              );
              md += `\n`;
            }
          } else {
            const generalSection = section as GeneralAnalysisSection;
            md += `### ${index + 1}. ${generalSection.generated_title}${timeDisplay}\n\n> ${
              generalSection["1_sentence_summary"]
            }\n\n`;
            md += `**Summary Points:**\n`;
            (generalSection.summary_points ?? []).forEach(
              (p) => (md += `- ${p}\n`)
            );
            md += `\n`;

            if (generalSection.actionable_advice?.length > 0) {
              md += `**Actionable Advice:**\n`;
              (generalSection.actionable_advice ?? []).forEach(
                (advice) => (md += `- ${advice}\n`)
              );
              md += `\n`;
            }

            if (generalSection.notable_quotes?.length > 0) {
              md += `**Notable Quotes:**\n`;
              (generalSection.notable_quotes ?? []).forEach(
                (quote) => (md += `> "${quote}"\n`)
              );
              md += `\n`;
            }

            if (generalSection.questions_and_answers?.length > 0) {
              md += `**Questions & Answers:**\n`;
              (generalSection.questions_and_answers ?? []).forEach((qa) => {
                md += `**Q:** ${qa.question}\n`;
                md += `**A:** ${qa.answer}\n\n`;
              });
              md += `\n`;
            }
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
