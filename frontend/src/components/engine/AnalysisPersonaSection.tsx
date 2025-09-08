import { GraduationCap, Brain, Info } from "lucide-react";
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
        <div className="grid grid-cols-2 gap-4">
          <Label
            htmlFor="learning_accelerator"
            className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              analysisPersona === "learning_accelerator"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/50"
            }`}
          >
            <GraduationCap className="w-6 h-6 mb-2 text-teal-600" />
            <span className="font-medium text-center">{ANALYSIS_PERSONA_OPTIONS.LEARNING_ACCELERATOR.title}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 mt-1 text-slate-400 hover:text-slate-600" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{ANALYSIS_PERSONA_OPTIONS.LEARNING_ACCELERATOR.description}</p>
              </TooltipContent>
            </Tooltip>
          </Label>

          <div className="relative">
            <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-medium z-10">
              Coming Soon
            </div>
            <Label
              htmlFor="deep_analysis"
              className="flex flex-col items-center p-4 rounded-lg border-2 cursor-not-allowed transition-all duration-200 border-muted bg-muted/20 opacity-60"
            >
              <Brain className="w-6 h-6 mb-2 text-purple-600" />
              <span className="font-medium text-center">{ANALYSIS_PERSONA_OPTIONS.DEEP_ANALYSIS.title}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 mt-1 text-slate-400 hover:text-slate-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{ANALYSIS_PERSONA_OPTIONS.DEEP_ANALYSIS.description}</p>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
        </div>

        <RadioGroup
          value={analysisPersona}
          onValueChange={(value) => onPersonaChange(value as AnalysisPersona)}
          className="sr-only"
          disabled={!canInteract}
        >
          <RadioGroupItem value="learning_accelerator" id="learning_accelerator" />
          <RadioGroupItem value="deep_analysis" id="deep_analysis" disabled />
        </RadioGroup>
      </CardContent>
    </Card>
  );
};