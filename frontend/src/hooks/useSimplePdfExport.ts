// src\hooks\useSimplePdfExport.ts
import { useCallback } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import {
  JobData,
  Slide,
  Contradiction,
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
      isItalic?: boolean; // Add isItalic option
      isListItem?: boolean;
      spaceAfter?: number;
      isQuote?: boolean; // Add isQuote option for styling blockquotes
    } = {}
  ) => {
    if (!text) return; // Don't process empty strings

    const size = options.size || 10;
    const isBold = options.isBold || false;
    const isItalic = options.isItalic || false;
    const isListItem = options.isListItem || false;
    const isQuote = options.isQuote || false;
    const spaceAfter =
      options.spaceAfter !== undefined ? options.spaceAfter : 4;

    doc.setFontSize(size);

    let fontStyle: "normal" | "bold" | "italic" | "bolditalic" = "normal";
    if (isBold && isItalic) {
      fontStyle = "bolditalic";
    } else if (isBold) {
      fontStyle = "bold";
    } else if (isItalic) {
      fontStyle = "italic";
    }

    doc.setFont("helvetica", fontStyle);

    // Clean the text: remove problematic characters and strip common markdown list/bold/italic syntax
    const cleanedText = text
      .replace(
        /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}ãþØ=Ü¡•→➡️💡🧵👇🤔]/gu,
        ""
      ) // More robustly remove markdown list prefixes (bulleted or numbered).
      .replace(/^\s*(?:[0-9]+[.)]?\s*|\*|\-|\•)\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown (keep content)
      .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown (keep content)
      .replace(/\s\s+/g, " ") // Collapse consecutive spaces into a single space
      .trim();

    // Fix this line:
    const textToDisplay = isListItem ? `• ${cleanedText}` : cleanedText;

    // Adjust wrap width for list items or quotes
    let currentX = pageMargin;
    let currentUsableWidth = usableWidth;
    if (isListItem) {
      currentX = pageMargin + indent;
      currentUsableWidth = usableWidth - indent;
    }
    if (isQuote) {
      currentX = pageMargin + indent * 2; // Further indent for quotes
      currentUsableWidth = usableWidth - indent * 3; // Reduce width for quotes
    }

    const lines = doc.splitTextToSize(textToDisplay, currentUsableWidth);
    const textHeight = lines.length * (size * 0.352778) * 1.15;

    if (y + textHeight > 280) {
      doc.addPage();
      y = pageMargin;
    }

    doc.text(lines, currentX, y);
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




      case "detailed_sections_header":
        addText("Detailed Section-by-Section Analysis", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        break;

      case "detailed_sections":
        (part.sections ?? []).forEach((section: any, index: number) => {
          // Add a line break and separator for readability between sections
          if (index > 0) {
            y += 5;
            doc.setDrawColor(200, 200, 200);
            doc.line(pageMargin, y - 8, usableWidth + pageMargin, y - 8);
          }

          // Define 's' here to access start_time and end_time for both personas
          const s = section;

          // Construct the time string for the title line
          let timeDisplay = "";
          if (s.start_time || s.end_time) {
            timeDisplay = ` (${s.start_time || "00:00"}-${s.end_time || "XX:XX"})`;
          }

          // Deep dive analysis section
          const deepDiveSection = s as any; // Using any since we're transitioning
          addText(
            `${index + 1}. ${deepDiveSection.generated_title}${timeDisplay}`,
            {
              size: 12,
              isBold: true,
              spaceAfter: 8,
            }
          );
          addText("Summary", { isBold: true });
          addText(deepDiveSection["1_sentence_summary"] || "N/A", {
            spaceAfter: 8,
          });

          if (deepDiveSection.actionable_takeaways?.length > 0) {
            addText("Actionable Takeaways", { isBold: true, spaceAfter: 6 });
            (deepDiveSection.actionable_takeaways ?? []).forEach((takeaway: any) =>
              addText(`${takeaway.type}: ${takeaway.takeaway}`, { isListItem: true })
            );
            y += 5; // Add space after this section
          }

          if (deepDiveSection.entities?.length > 0) {
            addText("Key Concepts", { isBold: true, spaceAfter: 6 });
            (deepDiveSection.entities ?? []).forEach((entity: any) =>
              addText(`${entity.name}: ${entity.explanation}`, { isListItem: true })
            );
            y += 5; // Add space after this section
          }
          y += 10; // Extra space after each detailed section
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
