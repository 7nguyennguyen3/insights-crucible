export const PODCAST_IMAGES = {
  MODERN_WISDOM: "/modern_wisdom_podcast_image.png",
  HUBERMAN_LAB: "/huberman_lab_podcast_image.png",
  LEX_FRIDMAN: "/lex_fridman_podcast_image.png",
} as const;

export const ROUTES = {
  AUTH: "/auth",
  AUTH_SIGNUP: "/auth?tab=signup",
  DEMO: "/demo",
  PRICING: "/#pricing",
  ENGINE: "/engine",
  DASHBOARD: "/dashboard",
} as const;

export const FEATURE_DATA = [
  {
    title: "Master Complex Arguments",
    description: "Break down 3-hour debates into clear thesis statements, supporting evidence, and counterarguments. See the full logical structure.",
  },
  {
    title: "Get Multiple Perspectives", 
    description: "Understand supporting and challenging viewpoints on any topic. See nuances and conditions that matter for deeper comprehension.",
  },
  {
    title: "Build Study Guides",
    description: "Transform educational podcasts into structured learning materials. Get executive summaries and detailed section breakdowns.",
  },
  {
    title: "Find Exact Quotes & Sources",
    description: "Jump to specific moments with timestamped transcripts. Get precise citations and supporting evidence for research.",
  },
] as const;