//src/app/utils/reportGenerator.ts
import { JobData } from "@/app/_global/interface";

// This function creates a structured "blueprint" of the report.
// It's the single source of truth for the report's content and order.
export const generateReportBlueprint = (data: JobData) => {
  const persona = data.request_data?.config?.analysis_persona;
  const blueprint: any[] = [];

  // Part 1: Title
  blueprint.push({
    type: "title",
    content: data.job_title || "Analysis Report",
  });

  // Part 2: High-Level Synthesis or Argument
  if (data.synthesis_results) {
    blueprint.push({ type: "synthesis", data: data.synthesis_results });
  } else if (data.argument_structure) {
    blueprint.push({ type: "argument", data: data.argument_structure });
  }


  // Part 4: Detailed Analysis Sections
  blueprint.push({ type: "detailed_sections_header" });
  blueprint.push({
    type: "detailed_sections",
    sections: data.results,
    persona: persona,
  });

  // Part 5: Slide Deck Outline
  if (
    data.generated_slide_outline &&
    data.generated_slide_outline?.length > 0
  ) {
    blueprint.push({ type: "slide_deck_header" });
    blueprint.push({
      type: "slide_deck",
      slides: data.generated_slide_outline,
    });
  }

  return blueprint;
};
