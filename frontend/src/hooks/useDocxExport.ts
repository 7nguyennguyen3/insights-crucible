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
  GlobalContextualBriefingPayload,
  Viewpoint,
  BlogPostData,
  BlogBlock,
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

        case "global_briefing":
          const briefing = part.data as GlobalContextualBriefingPayload;
          docChildren.push(
            new Paragraph({
              text: "Global Contextual Briefing",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Claim: ", bold: true }),
                new TextRun(briefing.claim_text),
              ],
            }),
            new Paragraph({ text: "" })
          );

          if (briefing.briefing_data.overall_summary) {
            docChildren.push(
              new Paragraph({
                text: "Summary",
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({ text: briefing.briefing_data.overall_summary }),
              new Paragraph({ text: "" })
            );
          }

          if (briefing.briefing_data.supporting_viewpoints?.length) {
            docChildren.push(
              new Paragraph({
                text: "Supporting Viewpoints",
                heading: HeadingLevel.HEADING_3,
              }),
              ...briefing.briefing_data.supporting_viewpoints.map(
                (v: Viewpoint) =>
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${v.source}: `, bold: true }),
                      new TextRun(v.perspective),
                    ],
                    bullet: { level: 0 },
                  })
              ),
              new Paragraph({ text: "" })
            );
          }

          if (briefing.briefing_data.challenging_viewpoints?.length) {
            docChildren.push(
              new Paragraph({
                text: "Challenging Viewpoints",
                heading: HeadingLevel.HEADING_3,
              }),
              ...briefing.briefing_data.challenging_viewpoints.map(
                (v: Viewpoint) =>
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${v.source}: `, bold: true }),
                      new TextRun(v.perspective),
                    ],
                    bullet: { level: 0 },
                  })
              ),
              new Paragraph({ text: "" })
            );
          }
          break;

        case "blog_post":
          docChildren.push(
            new Paragraph({
              text: "Generated Blog Post",
              heading: HeadingLevel.HEADING_2,
            })
          );
          docChildren.push(new Paragraph({ text: "" })); // Add a space

          const blogPost = part.content as BlogPostData;

          if (blogPost && blogPost.title) {
            // Add the blog post's main title as an H3
            docChildren.push(
              new Paragraph({
                text: blogPost.title,
                heading: HeadingLevel.HEADING_3,
              })
            );
            docChildren.push(new Paragraph({ text: "" })); // Add a space

            // Process each content block from the array
            blogPost.content.forEach((block: BlogBlock) => {
              switch (block.type) {
                case "heading":
                  docChildren.push(
                    new Paragraph({
                      text: block.text,
                      // Use H4 for level 2, H5 for level 3
                      heading:
                        block.level === 2
                          ? HeadingLevel.HEADING_4
                          : HeadingLevel.HEADING_5,
                    })
                  );
                  break;
                case "paragraph":
                  // The docx library handles text with markdown bold/italics
                  const paraChildren = (block.text || "")
                    .split(/(\*\*.*?\*\*|\*.*?\*)/g)
                    .map((part) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return new TextRun({
                          text: part.slice(2, -2),
                          bold: true,
                        });
                      }
                      if (part.startsWith("*") && part.endsWith("*")) {
                        return new TextRun({
                          text: part.slice(1, -1),
                          italics: true,
                        });
                      }
                      return new TextRun(part);
                    });
                  docChildren.push(new Paragraph({ children: paraChildren }));
                  break;
                case "list":
                  (block.items || []).forEach((item: string) => {
                    docChildren.push(
                      new Paragraph({ text: item, bullet: { level: 0 } })
                    );
                  });
                  break;
                case "quote":
                  docChildren.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `"${block.text}"`, italics: true }),
                      ],
                      indent: { left: 720 }, // Indent in twentieths of a point
                    })
                  );
                  if (block.author) {
                    docChildren.push(
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `— ${block.author}`,
                            italics: true,
                          }),
                        ],
                        alignment: AlignmentType.RIGHT,
                      })
                    );
                  }
                  break;
                case "cta":
                  docChildren.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `➡️ ${block.text}`, bold: true }),
                      ],
                    })
                  );
                  break;
                case "visual_suggestion":
                  docChildren.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `💡 Visual Suggestion: ${block.description}`,
                          italics: true,
                        }),
                      ],
                    })
                  );
                  break;
              }
              // Add a space after each block for readability
              docChildren.push(new Paragraph({ text: "" }));
            });
          }
          break;

        case "x_thread":
          docChildren.push(
            new Paragraph({
              text: "Generated X/Twitter Thread",
              heading: HeadingLevel.HEADING_2,
            }),
            ...(part.thread as string[]).map(
              (tweet: string) =>
                new Paragraph({ text: tweet, bullet: { level: 0 } })
            ),
            new Paragraph({ text: "" })
          );
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
            if (part.persona === "consultant") {
              const s = section as ConsultantAnalysisSection;
              docChildren.push(
                new Paragraph({
                  text: `${index + 1}. ${s.section_title}`,
                  heading: HeadingLevel.HEADING_3,
                }),
                new Paragraph({
                  text: "Executive Summary",
                  heading: HeadingLevel.HEADING_4,
                }),
                new Paragraph({ text: s.executive_summary || "N/A" }),
                new Paragraph({
                  text: "Client Pain Points",
                  heading: HeadingLevel.HEADING_4,
                }),
                ...(s.client_pain_points || []).map(
                  (p) => new Paragraph({ text: p, bullet: { level: 0 } })
                ),
                new Paragraph({ text: "" })
              );
            } else {
              const s = section as GeneralAnalysisSection;
              docChildren.push(
                new Paragraph({
                  text: `${index + 1}. ${s.generated_title}`,
                  heading: HeadingLevel.HEADING_3,
                }),
                new Paragraph({
                  text: "Summary",
                  heading: HeadingLevel.HEADING_4,
                }),
                new Paragraph({ text: s["1_sentence_summary"] || "N/A" }),
                new Paragraph({
                  text: "Summary Points",
                  heading: HeadingLevel.HEADING_4,
                }),
                ...(s.summary_points || []).map(
                  (p) => new Paragraph({ text: p, bullet: { level: 0 } })
                )
                // New Paragraph() for spacing will be added after each new section
              );

              // --- START REPLACEMENT / ADDITION FOR GENERAL ANALYSIS ---
              if (s.actionable_advice?.length > 0) {
                docChildren.push(
                  new Paragraph({
                    text: "Actionable Advice",
                    heading: HeadingLevel.HEADING_4,
                  }),
                  ...(s.actionable_advice || []).map(
                    (advice) =>
                      new Paragraph({ text: advice, bullet: { level: 0 } })
                  ),
                  new Paragraph({ text: "" }) // Add space after this section
                );
              }

              if (s.notable_quotes?.length > 0) {
                docChildren.push(
                  new Paragraph({
                    text: "Notable Quotes",
                    heading: HeadingLevel.HEADING_4,
                  }),
                  ...(s.notable_quotes || []).map(
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

              if (s.questions_and_answers?.length > 0) {
                docChildren.push(
                  new Paragraph({
                    text: "Questions & Answers",
                    heading: HeadingLevel.HEADING_4,
                  })
                );
                (s.questions_and_answers || []).forEach((qa) => {
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

              // Ensure there's a final space after the entire section if no new content was added at the end
              // This handles cases where all the new optional sections might be empty.
              if (
                s.actionable_advice?.length === 0 &&
                s.notable_quotes?.length === 0 &&
                s.questions_and_answers?.length === 0
              ) {
                docChildren.push(new Paragraph({ text: "" }));
              }
            }
          });
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
