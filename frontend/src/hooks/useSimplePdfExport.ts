// src\hooks\useSimplePdfExport.ts
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
  Viewpoint,
  BlogPostData,
  BlogBlock, // Import this
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

        const blogPost = part.content as BlogPostData;

        if (blogPost && blogPost.title) {
          addText(blogPost.title, { size: 13, isBold: true, spaceAfter: 8 });

          blogPost.content.forEach((block: BlogBlock) => {
            switch (block.type) {
              case "heading":
                addText(block.text, {
                  size: block.level === 2 ? 12 : 11,
                  isBold: true,
                });
                break;
              case "paragraph":
                // We'll rely on the addText's internal cleaning for paragraphs
                // If you need specific bold/italic within paragraphs, you'd need
                // to parse the text property and add multiple TextRun calls.
                // For simplicity, current addText cleans markdown syntax.
                addText(block.text);
                break;
              case "list":
                (block.items || []).forEach((item: string) => {
                  addText(item, { isListItem: true });
                });
                y += 5;
                break;
              case "quote":
                addText(`${block.text}`, { isQuote: true, isItalic: true }); // Apply quote styling
                if (block.author) {
                  // Align author to the right, slightly indented
                  doc.setFont("helvetica", "normal"); // Reset font for author
                  doc.setFontSize(10);
                  const authorText = `— ${block.author}`;
                  const authorWidth = doc.getStringUnitWidth(authorText) * 10; // 10 is font size
                  const authorX = usableWidth + pageMargin - authorWidth;
                  if (y + 10 > 280) {
                    // Check for page break for author line
                    doc.addPage();
                    y = pageMargin;
                  }
                  doc.text(authorText, authorX, y);
                  y += 10; // Move y after author
                }
                y += 5;
                break;
              case "cta":
                addText(`➡️ Call to Action: ${block.text}`, { isBold: true });
                break;
              case "visual_suggestion":
                addText(`💡 Visual Suggestion: ${block.description}`, {
                  isItalic: true,
                }); // Apply italic for visual suggestions
                break;
            }
          });
        }
        y += 10;
        break;

      case "x_thread":
        addText("Generated X/Twitter Thread", {
          size: 14,
          isBold: true,
          spaceAfter: 8,
        });
        // Ensure each tweet is treated as a list item for consistent bulleting
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

          if (part.persona === "consultant") {
            const consultantSection = s as ConsultantAnalysisSection; // Use 's' directly
            addText(
              `${index + 1}. ${consultantSection.section_title}${timeDisplay}`,
              {
                size: 12,
                isBold: true,
                spaceAfter: 8,
              }
            );
            addText("Executive Summary", { isBold: true });
            addText(consultantSection.executive_summary || "N/A", {
              spaceAfter: 8,
            });
            addText("Client Pain Points", { isBold: true, spaceAfter: 6 });
            (consultantSection.client_pain_points ?? []).forEach((p) =>
              addText(p, { isListItem: true })
            );
            y += 5; // Add space after this list

            // Add Critical Quotes for consultant persona
            if (consultantSection.critical_quotes?.length > 0) {
              addText("Critical Quotes", { isBold: true, spaceAfter: 6 });
              (consultantSection.critical_quotes ?? []).forEach((quote) =>
                addText(`"${quote}"`, { isListItem: true })
              );
              y += 5; // Add space after this section
            }

            // Add Strategic Opportunities for consultant persona
            if (consultantSection.strategic_opportunities?.length > 0) {
              addText("Strategic Opportunities", {
                isBold: true,
                spaceAfter: 6,
              });
              (consultantSection.strategic_opportunities ?? []).forEach(
                (opportunity) => addText(opportunity, { isListItem: true })
              );
              y += 5; // Add space after this section
            }
          } else {
            const generalSection = s as GeneralAnalysisSection; // Use 's' directly
            addText(
              `${index + 1}. ${generalSection.generated_title}${timeDisplay}`,
              {
                size: 12,
                isBold: true,
                spaceAfter: 8,
              }
            );
            addText("Summary", { isBold: true });
            addText(generalSection["1_sentence_summary"] || "N/A", {
              spaceAfter: 8,
            });
            addText("Summary Points", { isBold: true, spaceAfter: 6 });
            (generalSection.summary_points ?? []).forEach((p) =>
              addText(p, { isListItem: true })
            );
            y += 5; // Add space after this list

            // --- START REPLACEMENT / ADDITION FOR GENERAL ANALYSIS ---
            if (generalSection.actionable_advice?.length > 0) {
              addText("Actionable Advice", { isBold: true, spaceAfter: 6 });
              (generalSection.actionable_advice ?? []).forEach((advice) =>
                addText(advice, { isListItem: true })
              );
              y += 5; // Add space after this section
            }

            if (generalSection.notable_quotes?.length > 0) {
              addText("Notable Quotes", { isBold: true, spaceAfter: 6 });
              (generalSection.notable_quotes ?? []).forEach((quote) =>
                addText(`"${quote}"`, { isListItem: true })
              );
              y += 5; // Add space after this section
            }

            if (generalSection.questions_and_answers?.length > 0) {
              addText("Questions & Answers", { isBold: true, spaceAfter: 6 });
              (generalSection.questions_and_answers ?? []).forEach((qa) => {
                addText(`Q: ${qa.question}`, { isBold: true });
                addText(`A: ${qa.answer}`, { spaceAfter: 6 });
              });
              y += 5; // Add space after this section
            }
            // --- END REPLACEMENT / ADDITION ---
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
