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

  // --- ADD THIS SECTION ---
  // Part 3: Add Global Briefing and Generated Content if they exist
  if (data.global_contextual_briefing) {
    blueprint.push({
      type: "global_briefing",
      data: data.global_contextual_briefing,
    });
  }

  if (data.generated_blog_post) {
    blueprint.push({
      type: "blog_post",
      content: data.generated_blog_post,
    });
  }

  if (
    data.generated_overall_x_thread &&
    data.generated_overall_x_thread.length > 0
  ) {
    blueprint.push({
      type: "x_thread",
      thread: data.generated_overall_x_thread,
    });
  }
  // --- END OF ADDED SECTION ---

  // Part 4: Detailed Analysis Sections
  blueprint.push({ type: "detailed_sections_header" });
  blueprint.push({
    type: "detailed_sections",
    sections: data.results,
    persona: persona,
  });

  // Part 5: Slide Deck Outline for Consultants
  if (
    persona === "consultant" &&
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
