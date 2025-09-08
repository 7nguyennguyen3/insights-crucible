import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Legacy feature selection - types removed
// import { FeatureConfig } from "@/types/engine";
// import { FEATURE_OPTIONS } from "@/lib/engine/engineConstants";
import { ADD_ON_COSTS } from "@/lib/billing";

// Placeholder type for backwards compatibility
type FeatureConfig = Record<string, boolean>;

// Placeholder for removed feature options
const FEATURE_OPTIONS: any[] = [];

interface FeatureSelectionSectionProps {
  featureConfig: FeatureConfig;
  canInteract: boolean;
  onFeatureChange: (config: FeatureConfig) => void;
}

export const FeatureSelectionSection = ({
  featureConfig,
  canInteract,
  onFeatureChange,
}: FeatureSelectionSectionProps) => {
  const handleFeatureToggle = (featureId: keyof FeatureConfig, checked: boolean) => {
    onFeatureChange({
      ...featureConfig,
      [featureId]: checked,
    });
  };

  return (
    <Card className="shadow-lg dark:bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-2xl">
          Select Add-on Features
        </CardTitle>
        <CardDescription>
          Choose which additional insights you want to generate.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider>
          <div className="flex flex-col">
            {FEATURE_OPTIONS.map((feature, index) => {
              const isPaidFeature = feature.id === "run_contextual_briefing";
              const isFeatureDisabled = false;

              const featureElement = (
                <div
                  className={`flex items-center justify-between p-4 transition-colors ${
                    isFeatureDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  } ${
                    index < FEATURE_OPTIONS.length - 1
                      ? "border-b border-slate-200 dark:border-slate-800"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <feature.icon
                      className={`w-6 h-6 flex-shrink-0 ${feature.color}`}
                    />
                    <Label
                      htmlFor={feature.id}
                      className={`font-semibold text-base ${
                        isFeatureDisabled
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{feature.title}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                          +{" "}
                          {ADD_ON_COSTS[feature.id as keyof typeof ADD_ON_COSTS]}{" "}
                          credits
                        </span>
                      </div>
                    </Label>
                  </div>
                  <Switch
                    id={feature.id}
                    checked={featureConfig[feature.id]}
                    onCheckedChange={(checked) => {
                      if (isFeatureDisabled) return;
                      handleFeatureToggle(feature.id, checked);
                    }}
                    disabled={!canInteract || isFeatureDisabled}
                  />
                </div>
              );

              return (
                <Tooltip key={feature.id} delayDuration={200}>
                  <TooltipTrigger asChild>
                    {featureElement}
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p>
                      {isFeatureDisabled
                        ? "This feature is coming soon."
                        : feature.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};