// app/hooks/useMarkdownExport.ts

import { useCallback } from "react";
import { toast } from "sonner";
import {
  JobData,
  GeneralAnalysisSection,
  ConsultantAnalysisSection,
} from "@/app/_global/interface";

// Move the markdown generation logic into a standalone utility function
const generateMarkdown = (data: JobData) => {
  let md = `# ${data.job_title}\n\n`;

  // 1. Add High-Level Synthesis/Argument based on persona
  // FIX: Added optional chaining (?.) and nullish coalescing (?? []) to all .forEach calls for safety.
  if (data.synthesis_results) {
    md += `## Executive Synthesis\n\n`;
    md += `### Strategic Narrative Arc\n${
      data.synthesis_results.narrative_arc || ""
    }\n\n`;

    md += `### Overarching Themes\n`;
    (data.synthesis_results.overarching_themes ?? []).forEach(
      (theme) => (md += `- ${theme}\n`)
    );
    md += `\n`;

    md += `### Key Contradictions\n`;
    (data.synthesis_results.key_contradictions ?? []).forEach((c) => {
      md += `> **Point A:** ${c.point_a}\n`;
      md += `> **Point B:** ${c.point_b}\n`;
      md += `**Analysis:** ${c.analysis}\n\n`;
    });

    md += `### Unifying Insights\n`;
    (data.synthesis_results.unifying_insights ?? []).forEach(
      (insight) => (md += `* ${insight}\n\n`)
    );
  } else if (data.argument_structure) {
    md += `## Argument & Thesis Breakdown\n\n`;
    md += `### Main Thesis\n${data.argument_structure.main_thesis || ""}\n\n`;

    md += `### Supporting Arguments\n`;
    (data.argument_structure.supporting_arguments ?? []).forEach(
      (arg) => (md += `- ${arg}\n`)
    );
    md += `\n`;

    if (data.argument_structure.counterarguments_mentioned?.length > 0) {
      md += `### Counterarguments Mentioned\n`;
      (data.argument_structure.counterarguments_mentioned ?? []).forEach(
        (arg) => (md += `- ${arg}\n`)
      );
      md += `\n`;
    }
  }

  // 2. Add Detailed Section-by-Section Analysis
  md += `## Detailed Section-by-Section Analysis\n\n`;

  const persona = data.request_data?.config?.analysis_persona;

  if (persona === "consultant") {
    (data.results ?? []).forEach((section, index) => {
      const consultantSection = section as ConsultantAnalysisSection;
      md += `### ${index + 1}. ${consultantSection.section_title} (${
        consultantSection.start_time
      } - ${consultantSection.end_time})\n\n`;
      md += `**Executive Summary:** ${consultantSection.executive_summary}\n\n`;
      md += `**Client Pain Points:**\n`;
      (consultantSection.client_pain_points ?? []).forEach(
        (p) => (md += `- ${p}\n`)
      );
      md += `\n`;
      md += `**Strategic Opportunities:**\n`;
      (consultantSection.strategic_opportunities ?? []).forEach(
        (o) => (md += `- ${o}\n`)
      );
      md += `\n`;
      md += `**Critical Quotes:**\n`;
      (consultantSection.critical_quotes ?? []).forEach(
        (q) => (md += `> ${q}\n`)
      );
      md += `\n\n`;
    });
  } else if (persona === "general") {
    (data.results ?? []).forEach((section, index) => {
      const generalSection = section as GeneralAnalysisSection;
      md += `### ${index + 1}. ${generalSection.generated_title} (${
        generalSection.start_time
      } - ${generalSection.end_time})\n\n`;
      md += `> ${generalSection["1_sentence_summary"]}\n\n`;
      md += `**Summary Points:**\n`;
      (generalSection.summary_points ?? []).forEach((p) => (md += `- ${p}\n`));
      md += `\n`;
      md += `**Actionable Advice:**\n`;
      (generalSection.actionable_advice ?? []).forEach(
        (a) => (md += `- ${a}\n`)
      );
      md += `\n`;
      md += `**Notable Quotes:**\n`;
      (generalSection.notable_quotes ?? []).forEach((q) => (md += `> ${q}\n`));
      md += `\n\n`;
      md += `**Questions & Answers:**\n`;
      (generalSection.questions_and_answers ?? []).forEach((qa) => {
        md += `- **Q:** ${qa.question}\n`;
        md += `  - **A:** ${qa.answer}\n`;
      });
      md += `\n`;
    });
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
