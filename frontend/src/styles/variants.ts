export const backgroundVariants = {
  // Universal warm neutral background inspired by 2025 trends (Mocha Mousse)
  primary:
    "bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 dark:from-stone-900 dark:via-amber-950 dark:to-stone-900",
  secondary:
    "bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 dark:from-stone-900 dark:via-amber-950 dark:to-stone-900",

  // Unified universal background for consistency
  universal:
    "bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 dark:from-stone-900 dark:via-amber-950 dark:to-stone-900",

  // Legacy variants (keeping for backward compatibility)
  primaryGradient:
    "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900",
  secondaryGradient:
    "bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800",
  featureGradient:
    "bg-gradient-to-br from-orange-50/30 via-coral-50/20 to-red-50/30 dark:from-orange-900/10 dark:via-coral-900/5 dark:to-red-900/10",
} as const;

export const gridPatterns = {
  subtle:
    "bg-grid-stone-200/30 dark:bg-grid-amber-900/20 bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]",
  medium: "bg-grid-stone-200/20 dark:bg-grid-amber-900/15 bg-[size:40px_40px]",
  fine: "bg-grid-stone-200/25 dark:bg-grid-amber-900/18 bg-[size:80px_80px]",
} as const;

export const textGradients = {
  primary:
    "bg-gradient-to-r from-white via-slate-100 to-white dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent",
  accent:
    "bg-gradient-to-r from-coral-500 via-orange-500 to-red-500 dark:from-coral-300 dark:via-orange-300 dark:to-red-300 bg-clip-text text-transparent",
  secondary:
    "bg-gradient-to-r from-coral-600 via-orange-600 to-red-600 dark:from-coral-400 dark:via-orange-400 dark:to-red-400 bg-clip-text text-transparent",
  ai: "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent",
  warmHero:
    "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent",
} as const;

export const containerVariants = {
  section: "container mx-auto px-4",
  maxWidth: "max-w-7xl mx-auto",
  centered: "max-w-4xl mb-20 mx-auto text-center",
} as const;

export const spacingVariants = {
  sectionPadding: "py-24 md:py-32",
  heroPadding: "py-24 md:py-32 lg:py-40",
} as const;

export const typographyVariants = {
  // Consistent heading scales
  heroTitle:
    "text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight",
  sectionTitle: "text-4xl md:text-5xl font-bold leading-tight",
  cardTitle: "text-xl sm:text-2xl md:text-3xl font-bold leading-tight",
  ctaTitle: "text-4xl md:text-5xl font-bold tracking-tight leading-tight",
} as const;

export const elevationVariants = {
  // Subtle elevation for section distinction
  subtle: "shadow-sm border border-stone-200/40 dark:border-amber-900/20",
  medium: "shadow-md border border-stone-200/50 dark:border-amber-900/25",
  elevated: "shadow-lg border border-stone-200/60 dark:border-amber-900/30",
  floating: "shadow-xl border border-stone-200/70 dark:border-amber-900/35",
} as const;
