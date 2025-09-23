import { GraduationCap, Brain, Info, Network, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { AnalysisPersona } from "@/types/engine";
import { ANALYSIS_PERSONA_OPTIONS } from "@/lib/engine/engineConstants";
import {
  backgroundVariants,
  containerVariants,
  spacingVariants,
  typographyVariants,
  textGradients,
  elevationVariants,
} from "@/styles/variants";

interface AnalysisPersonaSectionProps {
  analysisPersona: AnalysisPersona;
  canInteract: boolean;
  onPersonaChange: (persona: AnalysisPersona) => void;
}

export const AnalysisPersonaSection = ({
  analysisPersona,
  canInteract,
  onPersonaChange,
}: AnalysisPersonaSectionProps) => {
  return (
    <Card className="shadow-lg dark:bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-2xl">Choose Analysis Type</CardTitle>
        <CardDescription>
          Select how you want your content transformed into insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={analysisPersona}
          onValueChange={(value) => onPersonaChange(value as AnalysisPersona)}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          disabled={!canInteract}
        >
          {/* Deep Dive - Available */}
          <div className="relative">
            <Label
              htmlFor="deep_dive"
              className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                analysisPersona === "deep_dive"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              }`}
            >
              <Brain className="w-5 h-5 mr-3 text-purple-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{ANALYSIS_PERSONA_OPTIONS.DEEP_DIVE.title}</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-foreground ml-2 shrink-0" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>{ANALYSIS_PERSONA_OPTIONS.DEEP_DIVE.description}</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <RadioGroupItem value="deep_dive" id="deep_dive" className="sr-only" />
          </div>

          {/* Neural Synthesis - Coming Soon */}
          <div className="relative">
            <Label className="flex items-center p-4 rounded-lg border cursor-not-allowed transition-all duration-200 border-border bg-muted/30 opacity-60">
              <Network className="w-5 h-5 mr-3 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{ANALYSIS_PERSONA_OPTIONS.NEURAL_SYNTHESIS.title}</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>{ANALYSIS_PERSONA_OPTIONS.NEURAL_SYNTHESIS.description}</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Badge
              variant="outline"
              className="absolute -top-1.5 -right-1.5 text-xs px-2 py-0.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
            >
              Coming Soon
            </Badge>
          </div>

          {/* Insight Engine - Coming Soon */}
          <div className="relative">
            <Label className="flex items-center p-4 rounded-lg border cursor-not-allowed transition-all duration-200 border-border bg-muted/30 opacity-60">
              <Zap className="w-5 h-5 mr-3 text-yellow-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{ANALYSIS_PERSONA_OPTIONS.INSIGHT_ENGINE.title}</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>{ANALYSIS_PERSONA_OPTIONS.INSIGHT_ENGINE.description}</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Badge
              variant="outline"
              className="absolute -top-1.5 -right-1.5 text-xs px-2 py-0.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
            >
              Coming Soon
            </Badge>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};