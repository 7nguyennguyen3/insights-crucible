// components/analysis/synthesis-display/ExecutiveSynthesisView.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SynthesisResults, Contradiction } from "@/app/_global/interface";
import { KeyContradictionsCard } from "./KeyContradictionsCard";
import { OverarchingThemesCard } from "./OverarchingThemesCard";
import { UnifyingInsightsCard } from "./UnifyingInsightsCard";
import { NarrativeArcCard } from "./NarrativeCard";

interface ExecutiveSynthesisViewProps {
  synthesis: SynthesisResults;
  isEditMode?: boolean;
  onSynthesisChange?: (field: keyof SynthesisResults, value: string) => void;
  onSynthesisListChange?: (
    field: "overarching_themes" | "unifying_insights",
    index: number,
    value: string
  ) => void;
  onSynthesisContradictionChange?: (
    index: number,
    prop: keyof Contradiction,
    value: string
  ) => void;
  // Add new handlers for adding/deleting items
  onSynthesisAddItem?: (
    field: "overarching_themes" | "unifying_insights" | "key_contradictions"
  ) => void;
  onSynthesisDeleteItem?: (
    field: "overarching_themes" | "unifying_insights" | "key_contradictions",
    index: number
  ) => void;
}

export const ExecutiveSynthesisView: React.FC<ExecutiveSynthesisViewProps> = ({
  synthesis,
  isEditMode = false,
  onSynthesisChange = () => {},
  onSynthesisListChange = () => {},
  onSynthesisContradictionChange = () => {},
  onSynthesisAddItem = () => {},
  onSynthesisDeleteItem = () => {},
}) => {
  if (!synthesis) return null;
  const s = synthesis || {
    key_contradictions: [],
    unifying_insights: [],
    overarching_themes: [],
    narrative_arc: "",
  };

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Executive Synthesis
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        High-level insights and strategic narrative derived from the complete
        analysis.
      </p>

      <Tabs defaultValue="contradictions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-100 dark:bg-slate-800 h-auto rounded-lg">
          <TabsTrigger
            value="contradictions"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-300 rounded-md"
          >
            Key Contradictions
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-300 rounded-md"
          >
            Unifying Insights
          </TabsTrigger>
          <TabsTrigger
            value="themes"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-300 rounded-md"
          >
            Overarching Themes
          </TabsTrigger>
          <TabsTrigger
            value="narrative"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-300 rounded-md"
          >
            Narrative Arc
          </TabsTrigger>
        </TabsList>

        {/* Pass the new props down to the child cards */}
        <TabsContent value="contradictions" className="mt-6">
          <KeyContradictionsCard
            contradictions={s.key_contradictions}
            isEditMode={isEditMode}
            onContradictionChange={onSynthesisContradictionChange}
            onAddContradiction={() => onSynthesisAddItem("key_contradictions")}
            onDeleteContradiction={(index) =>
              onSynthesisDeleteItem("key_contradictions", index)
            }
          />
        </TabsContent>
        <TabsContent value="insights" className="mt-6">
          <UnifyingInsightsCard
            insights={s.unifying_insights}
            isEditMode={isEditMode}
            onInsightChange={(index, value) =>
              onSynthesisListChange("unifying_insights", index, value)
            }
            onAddInsight={() => onSynthesisAddItem("unifying_insights")}
            onDeleteInsight={(index) =>
              onSynthesisDeleteItem("unifying_insights", index)
            }
          />
        </TabsContent>
        <TabsContent value="themes" className="mt-6">
          <OverarchingThemesCard
            themes={s.overarching_themes}
            isEditMode={isEditMode}
            onThemeChange={(index, value) =>
              onSynthesisListChange("overarching_themes", index, value)
            }
            onAddTheme={() => onSynthesisAddItem("overarching_themes")}
            onDeleteTheme={(index) =>
              onSynthesisDeleteItem("overarching_themes", index)
            }
          />
        </TabsContent>
        <TabsContent value="narrative" className="mt-6">
          <NarrativeArcCard
            narrative={s.narrative_arc}
            isEditMode={isEditMode}
            onNarrativeChange={(value) =>
              onSynthesisChange("narrative_arc", value)
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
