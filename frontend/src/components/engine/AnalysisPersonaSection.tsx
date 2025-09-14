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
        <div className="flex justify-center">
          <Label
            htmlFor="deep_dive"
            className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 max-w-md ${
              analysisPersona === "deep_dive"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/50"
            }`}
          >
            <Brain className="w-6 h-6 mb-2 text-purple-600" />
            <span className="font-medium text-center">{ANALYSIS_PERSONA_OPTIONS.DEEP_DIVE.title}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 mt-1 text-slate-400 hover:text-slate-600" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{ANALYSIS_PERSONA_OPTIONS.DEEP_DIVE.description}</p>
              </TooltipContent>
            </Tooltip>
          </Label>
        </div>

        <RadioGroup
          value={analysisPersona}
          onValueChange={(value) => onPersonaChange(value as AnalysisPersona)}
          className="sr-only"
          disabled={!canInteract}
        >
          <RadioGroupItem value="deep_dive" id="deep_dive" />
        </RadioGroup>
      </CardContent>
    </Card>
  );
};