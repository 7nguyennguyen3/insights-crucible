import { useCallback } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import {
  JobData,
  GeneralAnalysisSection,
  ConsultantAnalysisSection,
  Slide,
  Contradiction,
} from "@/app/_global/interface";
import { generateReportBlueprint } from "@/app/utils/reportGenerator";

// Helper function to parse simple markdown (headings, paragraphs) into docx Paragraphs
const createParasFromMarkdown = (markdownText: string): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  const lines = markdownText.split("\n");

  for (const line of lines) {
    if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
        })
      );
    } else if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
        })
      );
    } else if (line.trim() !== "") {
      paragraphs.push(new Paragraph({ text: line }));
    } else {
      // Add an empty paragraph for spacing if the line is empty
      paragraphs.push(new Paragraph({ text: "" }));
    }
  }
  return paragraphs;
};

export const useDocxExport = (jobData: JobData | null) => {
  const exportToDocx = useCallback(() => {
    if (!jobData) {
      console.error("No data available to export to DOCX.");
      return;
    }

    const blueprint = generateReportBlueprint(jobData);
    const docChildren: Paragraph[] = [];

    for (const part of blueprint) {
      switch (part.type) {
        case "title":
          docChildren.push(
            new Paragraph({
              text: part.content,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            })
          );
          docChildren.push(new Paragraph({ text: "" }));
          break;

        case "synthesis":
          docChildren.push(
            new Paragraph({
              text: "Executive Synthesis",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: "Strategic Narrative Arc",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: part.data.narrative_arc || "N/A" }),
            new Paragraph({ text: "" })
          );

          if (part.data.overarching_themes?.length > 0) {
            docChildren.push(
              new Paragraph({
                text: "Overarching Themes",
                heading: HeadingLevel.HEADING_3,
              }),
              ...part.data.overarching_themes.map(
                (theme: string) =>
                  new Paragraph({ text: theme, bullet: { level: 0 } })
              ),
              new Paragraph({ text: "" })
            );
          }

          if (part.data.key_contradictions?.length > 0) {
            docChildren.push(
              new Paragraph({
                text: "Key Contradictions",
                heading: HeadingLevel.HEADING_3,
              })
            );
            part.data.key_contradictions.forEach((c: Contradiction) => {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: "Point A: ", bold: true }),
                    new TextRun(c.point_a),
                  ],
                  bullet: { level: 0 },
                })
              );
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: "Point B: ", bold: true }),
                    new TextRun(c.point_b),
                  ],
                  bullet: { level: 0 },
                  spacing: { after: 200 }, // Add space after this paragraph
                })
              );
            });
            docChildren.push(new Paragraph({ text: "" }));
          }

          if (part.data.unifying_insights?.length > 0) {
            docChildren.push(
              new Paragraph({
                text: "Unifying Insights",
                heading: HeadingLevel.HEADING_3,
              }),
              ...part.data.unifying_insights.map(
                (insight: string) =>
                  new Paragraph({ text: insight, bullet: { level: 0 } })
              ),
              new Paragraph({ text: "" })
            );
          }
          break;

        case "argument":
          docChildren.push(
            new Paragraph({
              text: "Argument & Thesis Breakdown",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: "Main Thesis",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: part.data.main_thesis || "N/A" }),
            new Paragraph({ text: "" })
          );

          if (part.data.supporting_arguments?.length > 0) {
            docChildren.push(
              new Paragraph({
                text: "Supporting Arguments",
                heading: HeadingLevel.HEADING_3,
              }),
              ...part.data.supporting_arguments.map(
                (arg: string) =>
                  new Paragraph({ text: arg, bullet: { level: 0 } })
              ),
              new Paragraph({ text: "" })
            );
          }

          if (part.data.counterarguments_mentioned?.length > 0) {
            docChildren.push(
              new Paragraph({
                text: "Counterarguments Mentioned",
                heading: HeadingLevel.HEADING_3,
              }),
              ...part.data.counterarguments_mentioned.map(
                (arg: string) =>
                  new Paragraph({ text: arg, bullet: { level: 0 } })
              ),
              new Paragraph({ text: "" })
            );
          }
          break;




        case "detailed_sections_header":
          docChildren.push(
            new Paragraph({
              text: "Detailed Section-by-Section Analysis",
              heading: HeadingLevel.HEADING_2,
            })
          );
          break;

        case "detailed_sections":
          (part.sections ?? []).forEach((section: any, index: number) => {
            // Add a separator *before* each section, except the very first one
            if (index > 0) {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "---", // Simple separator
                      color: "A0A0A0", // Light gray color
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200, before: 200 }, // Spacing around the separator
                })
              );
            }

            // Declare 's' at this higher scope so it's accessible for both persona branches
            const s = section;

            // Construct the time string for the title
            const timeDisplay =
              s.start_time || s.end_time
                ? ` (${s.start_time || "00:00"}-${s.end_time || "XX:XX"})`
                : "";

            if (part.persona === "consultant") {
              const consultantSection = s as ConsultantAnalysisSection;
              docChildren.push(
                new Paragraph({
                  text: `${index + 1}. ${consultantSection.section_title}${timeDisplay}`, // Add time here
                  heading: HeadingLevel.HEADING_3,
                }),
                new Paragraph({
                  text: "Executive Summary",
                  heading: HeadingLevel.HEADING_4,
                }),
                new Paragraph({
                  text: consultantSection.executive_summary || "N/A",
                }),
                new Paragraph({
                  text: "Client Pain Points",
                  heading: HeadingLevel.HEADING_4,
                }),
                ...(consultantSection.client_pain_points || []).map(
                  (p) => new Paragraph({ text: p, bullet: { level: 0 } })
                ),
                new Paragraph({ text: "" }) // Add a space after this block
              );

              // Add Critical Quotes for consultant persona
              if (consultantSection.critical_quotes?.length > 0) {
                docChildren.push(
                  new Paragraph({
                    text: "Critical Quotes",
                    heading: HeadingLevel.HEADING_4,
                  }),
                  ...(consultantSection.critical_quotes || []).map(
                    (quote) =>
                      new Paragraph({
                        children: [
                          new TextRun({ text: `"${quote}"`, italics: true }),
                        ],
                        bullet: { level: 0 },
                      })
                  ),
                  new Paragraph({ text: "" }) // Add space after this section
                );
              }

              // Add Strategic Opportunities for consultant persona
              if (consultantSection.strategic_opportunities?.length > 0) {
                docChildren.push(
                  new Paragraph({
                    text: "Strategic Opportunities",
                    heading: HeadingLevel.HEADING_4,
                  }),
                  ...(consultantSection.strategic_opportunities || []).map(
                    (opportunity) =>
                      new Paragraph({ text: opportunity, bullet: { level: 0 } })
                  ),
                  new Paragraph({ text: "" }) // Add space after this section
                );
              }
            } else {
              const generalSection = s as GeneralAnalysisSection;
              docChildren.push(
                new Paragraph({
                  text: `${index + 1}. ${generalSection.generated_title}${timeDisplay}`, // Add time here
                  heading: HeadingLevel.HEADING_3,
                }),
                new Paragraph({
                  text: "Summary",
                  heading: HeadingLevel.HEADING_4,
                }),
                new Paragraph({
                  text: generalSection["1_sentence_summary"] || "N/A",
                }),
                new Paragraph({
                  text: "Summary Points",
                  heading: HeadingLevel.HEADING_4,
                }),
                ...(generalSection.summary_points || []).map(
                  (p) => new Paragraph({ text: p, bullet: { level: 0 } })
                ),
                new Paragraph({ text: "" })
              );

              // --- START REPLACEMENT / ADDITION FOR GENERAL ANALYSIS ---
              if (generalSection.actionable_advice?.length > 0) {
                docChildren.push(
                  new Paragraph({
                    text: "Actionable Advice",
                    heading: HeadingLevel.HEADING_4,
                  }),
                  ...(generalSection.actionable_advice || []).map(
                    (advice) =>
                      new Paragraph({ text: advice, bullet: { level: 0 } })
                  ),
                  new Paragraph({ text: "" }) // Add space after this section
                );
              }

              if (generalSection.notable_quotes?.length > 0) {
                docChildren.push(
                  new Paragraph({
                    text: "Notable Quotes",
                    heading: HeadingLevel.HEADING_4,
                  }),
                  ...(generalSection.notable_quotes || []).map(
                    (quote) =>
                      new Paragraph({
                        children: [
                          new TextRun({ text: `"${quote}"`, italics: true }),
                        ],
                        bullet: { level: 0 },
                      })
                  ),
                  new Paragraph({ text: "" }) // Add space after this section
                );
              }

              if (generalSection.questions_and_answers?.length > 0) {
                docChildren.push(
                  new Paragraph({
                    text: "Questions & Answers",
                    heading: HeadingLevel.HEADING_4,
                  })
                );
                (generalSection.questions_and_answers || []).forEach((qa) => {
                  docChildren.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `Q: ${qa.question}`, bold: true }),
                      ],
                    }),
                    new Paragraph({ text: `A: ${qa.answer}` })
                  );
                });
                docChildren.push(new Paragraph({ text: "" })); // Add space after this section
              }
              // --- END REPLACEMENT / ADDITION ---
            }
          });
          // The problematic logic to remove the last separator is no longer needed
          // because separators are now added *before* each section (except the first).
          break;

        case "slide_deck_header":
          docChildren.push(
            new Paragraph({
              text: "Slide Deck Outline",
              heading: HeadingLevel.HEADING_2,
            })
          );
          break;

        case "slide_deck":
          (part.slides ?? []).forEach((slide: Slide) => {
            docChildren.push(
              new Paragraph({
                text: slide.slide_title,
                heading: HeadingLevel.HEADING_3,
              }),
              ...(slide.slide_bullets || []).map(
                (bullet: string) =>
                  new Paragraph({ text: bullet, bullet: { level: 0 } })
              ),
              new Paragraph({ text: "" })
            );
          });
          break;
      }
    }

    const doc = new Document({
      sections: [{ children: docChildren }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${jobData.job_title || "analysis"}-report.docx`);
    });
  }, [jobData]);

  return { exportToDocx };
};
