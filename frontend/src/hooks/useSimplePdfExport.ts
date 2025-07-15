import { useCallback } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import {
  JobData,
  GeneralAnalysisSection,
  ConsultantAnalysisSection,
  Slide,
  Contradiction,
  GlobalContextualBriefingPayload, // Import this
  Viewpoint, // Import this
} from "@/app/_global/interface";
import { generateReportBlueprint } from "@/app/utils/reportGenerator";

const generatePdfDocument = (data: JobData) => {
  const doc = new jsPDF();
  let y = 20; // Manually track the Y position on the page
  const pageMargin = 14,
    usableWidth = doc.internal.pageSize.getWidth() - pageMargin * 2,
    indent = 5;

  // A helper function to handle all text adding, wrapping, styling, and page breaks
  const addText = (
    text: string,
    options: {
      size?: number;
      isBold?: boolean;
      isListItem?: boolean;
      spaceAfter?: number;
    } = {}
  ) => {
    if (!text) return; // Don't process empty strings

    const size = options.size || 10;
    const isBold = options.isBold || false;
    const isListItem = options.isListItem || false;
    const spaceAfter =
      options.spaceAfter !== undefined ? options.spaceAfter : 4;
    const fontStyle = isBold ? "bold" : "normal";

    // Estimate height of the text block to check for page break
    doc.setFontSize(size);
    const textToWrap = isListItem ? `• ${text}` : text;
    const wrapWidth = usableWidth - (isListItem ? indent : 0);
    const lines = doc.splitTextToSize(textToWrap, wrapWidth);
    const textHeight = lines.length * (size * 0.35); // Approximate height

    if (y + textHeight > 280) {
      // Check if it fits on the page (297mm height)
      doc.addPage();
      y = pageMargin;
    }

    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(size);

    const xPos = isListItem ? pageMargin + indent : pageMargin;

    doc.text(lines, xPos, y);
    y += textHeight + spaceAfter;
  };

  const blueprint = generateReportBlueprint(data);

  for (const part of blueprint) {
    switch (part.type) {
      case "title":
        addText(part.content, { size: 18, isBold: true, spaceAfter: 10 });
        break;

      case "synthesis":
        addText("Executive Synthesis", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        addText("Strategic Narrative Arc", { isBold: true });
        addText(part.data.narrative_arc || "N/A", { spaceAfter: 8 });

        addText("Overarching Themes", { isBold: true, spaceAfter: 6 });
        (part.data.overarching_themes ?? []).forEach((theme: string) =>
          addText(theme, { isListItem: true })
        );
        y += 5;

        addText("Key Contradictions", { isBold: true, spaceAfter: 6 });
        (part.data.key_contradictions ?? []).forEach((c: Contradiction) => {
          addText(`Point A: ${c.point_a}`, { isListItem: true });
          addText(`Point B: ${c.point_b}`, { isListItem: true });
          addText(`Analysis: ${c.analysis}`, { spaceAfter: 6 });
        });
        y += 5;

        addText("Unifying Insights", { isBold: true, spaceAfter: 6 });
        (part.data.unifying_insights ?? []).forEach((insight: string) =>
          addText(insight, { isListItem: true })
        );
        y += 10;
        break;

      case "argument":
        addText("Argument & Thesis Breakdown", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        addText("Main Thesis", { isBold: true });
        addText(part.data.main_thesis || "N/A", { spaceAfter: 8 });

        if (part.data.supporting_arguments?.length > 0) {
          addText("Supporting Arguments", { isBold: true, spaceAfter: 6 });
          part.data.supporting_arguments.forEach((arg: string) =>
            addText(arg, { isListItem: true })
          );
          y += 5;
        }

        if (part.data.counterarguments_mentioned?.length > 0) {
          addText("Counterarguments Mentioned", {
            isBold: true,
            spaceAfter: 6,
          });
          part.data.counterarguments_mentioned.forEach((arg: string) =>
            addText(arg, { isListItem: true })
          );
        }
        y += 10;
        break;

      case "global_briefing":
        const briefing = part.data as GlobalContextualBriefingPayload;
        addText("Global Contextual Briefing", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        addText(`Claim: ${briefing.claim_text}`, {
          isBold: true,
          spaceAfter: 8,
        });

        if (briefing.briefing_data.overall_summary) {
          addText("Summary", { isBold: true, spaceAfter: 6 });
          addText(briefing.briefing_data.overall_summary, { spaceAfter: 8 });
        }

        if (briefing.briefing_data.supporting_viewpoints?.length) {
          addText("Supporting Viewpoints", { isBold: true, spaceAfter: 6 });
          briefing.briefing_data.supporting_viewpoints.forEach(
            (v: Viewpoint) => {
              addText(`${v.source}: ${v.perspective}`, { isListItem: true });
            }
          );
          y += 5;
        }

        if (briefing.briefing_data.challenging_viewpoints?.length) {
          addText("Challenging Viewpoints", { isBold: true, spaceAfter: 6 });
          briefing.briefing_data.challenging_viewpoints.forEach(
            (v: Viewpoint) => {
              addText(`${v.source}: ${v.perspective}`, { isListItem: true });
            }
          );
        }
        y += 10;
        break;

      case "blog_post":
        addText("Generated Blog Post", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        const blogLines = part.content.split("\n");
        blogLines.forEach((line: string) => {
          if (line.startsWith("### ")) {
            addText(line.substring(4), { size: 12, isBold: true });
          } else if (line.startsWith("## ")) {
            addText(line.substring(3), { size: 13, isBold: true });
          } else {
            addText(line);
          }
        });
        y += 10;
        break;

      case "x_thread":
        addText("Generated X/Twitter Thread", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        (part.thread as string[]).forEach((tweet) => {
          addText(tweet, { isListItem: true });
        });
        y += 10;
        break;

      case "detailed_sections_header":
        addText("Detailed Section-by-Section Analysis", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        break;

      case "detailed_sections":
        (part.sections ?? []).forEach((section: any, index: number) => {
          if (index > 0) {
            y += 5;
            doc.setDrawColor(200, 200, 200);
            doc.line(pageMargin, y - 8, usableWidth + pageMargin, y - 8);
          }
          if (part.persona === "consultant") {
            const s = section as ConsultantAnalysisSection;
            addText(`${index + 1}. ${s.section_title}`, {
              size: 12,
              isBold: true,
              spaceAfter: 8,
            });
            addText("Executive Summary", { isBold: true });
            addText(s.executive_summary || "N/A", { spaceAfter: 8 });
            addText("Client Pain Points", { isBold: true, spaceAfter: 6 });
            (s.client_pain_points ?? []).forEach((p) =>
              addText(p, { isListItem: true })
            );
          } else {
            const s = section as GeneralAnalysisSection;
            addText(`${index + 1}. ${s.generated_title}`, {
              size: 12,
              isBold: true,
              spaceAfter: 8,
            });
            addText("Summary", { isBold: true });
            addText(s["1_sentence_summary"] || "N/A", { spaceAfter: 8 });
            addText("Summary Points", { isBold: true, spaceAfter: 6 });
            (s.summary_points ?? []).forEach((p) =>
              addText(p, { isListItem: true })
            );
          }
          y += 10;
        });
        break;

      case "slide_deck_header":
        addText("Slide Deck Outline", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        break;

      case "slide_deck":
        (part.slides ?? []).forEach((slide: Slide) => {
          addText(slide.slide_title, { size: 12, isBold: true, spaceAfter: 6 });
          (slide.slide_bullets ?? []).forEach((bullet: string) =>
            addText(bullet, { isListItem: true })
          );
          y += 5;
        });
        break;
    }
  }

  return doc;
};

export const useSimplePdfExport = (jobData: JobData | null) => {
  const exportToPdf = useCallback(() => {
    if (!jobData) {
      toast.error("No data available to export.");
      return;
    }
    try {
      const doc = generatePdfDocument(jobData);
      doc.save(`${jobData.job_title || "analysis"}-report.pdf`);
      toast.success("PDF export started!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("PDF export failed. See console for details.");
    }
  }, [jobData]);

  return { exportToPdf };
};
