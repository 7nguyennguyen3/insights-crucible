// components/library/BulkLibraryDialog.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Loader2, CheckCircle, AlertCircle, Eye, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { Job } from "@/app/_global/interface";

interface BulkLibraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobs: Job[];
  onBulkShare: (metadata: HybridBulkLibraryMetadata) => Promise<BulkLibraryResult>;
}

interface BulkLibraryMetadata {
  description: string;
  tags: string[];
  category?: string;
}

interface IndividualMetadata {
  description?: string;
  tags?: string[];
}

interface HybridBulkLibraryMetadata {
  sharedMetadata: BulkLibraryMetadata;
  individualOverrides: Record<string, IndividualMetadata>;
}

interface BulkLibraryResult {
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  results: {
    jobId: string;
    success: boolean;
    error?: string;
  }[];
}

const COMMON_CATEGORIES = [
  "Business",
  "Technology",
  "Education",
  "Health & Wellness",
  "Science",
  "Politics",
  "Entertainment",
  "Sports",
  "News & Current Events",
  "Personal Development",
  "Finance",
  "History",
  "Philosophy",
  "Art & Culture"
];

const SUGGESTED_TAGS = [
  "leadership", "strategy", "innovation", "productivity", "marketing",
  "entrepreneurship", "AI", "programming", "data science", "design",
  "psychology", "motivation", "career", "investing", "economics",
  "research", "interview", "case study", "tutorial", "analysis"
];

// Smart aggregation utility functions
const aggregateSuggestions = (jobs: Job[]): { description: string; tags: string[] } => {
  const eligibleJobs = jobs.filter(job =>
    job.status === "COMPLETED" &&
    (job.libraryDescriptionSuggestion || job.libraryTagsSuggestion)
  );

  if (eligibleJobs.length === 0) {
    return { description: "", tags: [] };
  }

  // Aggregate tags - collect all unique tags and sort by frequency
  const tagFrequency: Record<string, number> = {};
  eligibleJobs.forEach(job => {
    job.libraryTagsSuggestion?.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });

  const aggregatedTags = Object.entries(tagFrequency)
    .sort(([,a], [,b]) => b - a) // Sort by frequency descending
    .map(([tag]) => tag);

  // Aggregate description - use the most comprehensive one or create a composite
  const descriptions = eligibleJobs
    .map(job => job.libraryDescriptionSuggestion)
    .filter(Boolean) as string[];

  let aggregatedDescription = "";
  if (descriptions.length === 1) {
    aggregatedDescription = descriptions[0];
  } else if (descriptions.length > 1) {
    // Create a composite description
    const jobTitles = eligibleJobs.map(job => job.job_title);
    aggregatedDescription = `A collection of ${eligibleJobs.length} analyses covering: ${jobTitles.slice(0, 3).join(", ")}${jobTitles.length > 3 ? ` and ${jobTitles.length - 3} more` : ""}. These insights explore various perspectives and key takeaways across multiple topics.`;
  }

  return { description: aggregatedDescription, tags: aggregatedTags };
};

export const BulkLibraryDialog: React.FC<BulkLibraryDialogProps> = ({
  isOpen,
  onClose,
  selectedJobs,
  onBulkShare
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BulkLibraryResult | null>(null);

  // Individual customization state
  const [individualOverrides, setIndividualOverrides] = useState<Record<string, IndividualMetadata>>({});
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // Reset form and auto-prefill AI suggestions when dialog opens
  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setExpandedJobs(new Set());

      // Auto-prefill with AI suggestions for eligible jobs
      const eligibleJobs = selectedJobs.filter(job =>
        job.status === "COMPLETED" && !job.libraryMeta?.libraryEnabled
      );

      const initialOverrides: Record<string, IndividualMetadata> = {};
      eligibleJobs.forEach(job => {
        if (job.libraryDescriptionSuggestion || (job.libraryTagsSuggestion && job.libraryTagsSuggestion.length > 0)) {
          initialOverrides[job.id] = {
            description: job.libraryDescriptionSuggestion || "",
            tags: job.libraryTagsSuggestion || []
          };
        }
      });

      setIndividualOverrides(initialOverrides);
    }
  }, [isOpen, selectedJobs]);


  // Individual customization handlers
  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const updateIndividualMetadata = (jobId: string, field: keyof IndividualMetadata, value: string | string[]) => {
    setIndividualOverrides(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        [field]: value
      }
    }));
  };

  const addIndividualTag = (jobId: string, tag: string) => {
    const currentTags = individualOverrides[jobId]?.tags || [];
    if (!currentTags.includes(tag)) {
      updateIndividualMetadata(jobId, 'tags', [...currentTags, tag]);
    }
  };

  const removeIndividualTag = (jobId: string, tagToRemove: string) => {
    const currentTags = individualOverrides[jobId]?.tags || [];
    updateIndividualMetadata(jobId, 'tags', currentTags.filter(tag => tag !== tagToRemove));
  };


  const hasIndividualCustomizations = (jobId: string) => {
    const override = individualOverrides[jobId];
    return override?.description || (override?.tags && override.tags.length > 0);
  };

  const handleSubmit = async () => {
    // Check if all eligible jobs have descriptions (either from overrides or AI suggestions)
    const eligibleJobs = selectedJobs.filter(job =>
      job.status === "COMPLETED" && !job.libraryMeta?.libraryEnabled
    );

    const hasValidDescriptions = eligibleJobs.every(job =>
      (individualOverrides[job.id]?.description?.trim()) || job.libraryDescriptionSuggestion
    );

    if (!hasValidDescriptions) {
      return;
    }

    setIsLoading(true);
    try {
      // For each job without an override, use AI suggestion if available
      const finalOverrides: Record<string, IndividualMetadata> = {};
      eligibleJobs.forEach(job => {
        const override = individualOverrides[job.id] || {};
        finalOverrides[job.id] = {
          description: override.description || job.libraryDescriptionSuggestion,
          tags: override.tags || job.libraryTagsSuggestion || []
        };
      });

      const hybridMetadata: HybridBulkLibraryMetadata = {
        sharedMetadata: {
          description: "", // Not used anymore
          tags: [], // Not used anymore
          category: undefined // Could add category support later if needed
        },
        individualOverrides: finalOverrides
      };

      const bulkResult = await onBulkShare(hybridMetadata);
      setResult(bulkResult);
    } catch (error) {
      console.error("Bulk sharing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  // Filter jobs that can actually be shared (completed analyses not already in library)
  const eligibleJobs = selectedJobs.filter(job =>
    job.status === "COMPLETED" && !job.libraryMeta?.libraryEnabled
  );
  const ineligibleJobs = selectedJobs.filter(job =>
    job.status !== "COMPLETED" || job.libraryMeta?.libraryEnabled
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Add {selectedJobs.length} Analyses to Library
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-4 pr-4">
            {!result ? (
              <>
                {/* Selection Summary */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Selected Analyses</h4>
                    <Badge variant="secondary">{selectedJobs.length} total</Badge>
                  </div>

                  {eligibleJobs.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {eligibleJobs.length} can be added
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 max-h-20 overflow-y-auto">
                        {eligibleJobs.slice(0, 3).map(job => (
                          <div key={job.id}>• {job.job_title}</div>
                        ))}
                        {eligibleJobs.length > 3 && (
                          <div>... and {eligibleJobs.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {ineligibleJobs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          {ineligibleJobs.length} will be skipped
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 max-h-20 overflow-y-auto">
                        {ineligibleJobs.slice(0, 3).map(job => (
                          <div key={job.id}>
                            • {job.job_title}
                            {job.status !== "COMPLETED" && " (not completed)"}
                            {job.libraryMeta?.libraryEnabled && " (already in library)"}
                          </div>
                        ))}
                        {ineligibleJobs.length > 3 && (
                          <div>... and {ineligibleJobs.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {eligibleJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">No Eligible Analyses</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      All selected analyses are either not completed or already in the library.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Individual Analysis Settings */}
                    <div>
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Set individual descriptions and tags for each analysis. Use AI suggestions to speed up the process.
                        </p>

                          {eligibleJobs.map((job) => (
                            <div key={job.id} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                              {/* Job Header */}
                              <div
                                className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                onClick={() => toggleJobExpansion(job.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{job.job_title}</h4>
                                    {hasIndividualCustomizations(job.id) && (
                                      <Badge variant="secondary" className="text-xs mt-1">
                                        Customized
                                      </Badge>
                                    )}
                                  </div>
                                  {expandedJobs.has(job.id) ?
                                    <ChevronUp className="h-4 w-4 text-slate-400" /> :
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  }
                                </div>
                              </div>

                              {/* Expandable Content */}
                              {expandedJobs.has(job.id) && (
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                                  {/* Individual Description */}
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Description Override
                                      {job.libraryDescriptionSuggestion && (
                                        <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                                          (AI-suggested available)
                                        </span>
                                      )}
                                    </Label>
                                    <Textarea
                                      placeholder={job.libraryDescriptionSuggestion
                                        ? `Suggestion: ${job.libraryDescriptionSuggestion.slice(0, 100)}...`
                                        : `Override shared description for "${job.job_title}"...`}
                                      value={individualOverrides[job.id]?.description || ""}
                                      onChange={(e) => updateIndividualMetadata(job.id, 'description', e.target.value)}
                                      rows={2}
                                      className="mt-1"
                                      maxLength={500}
                                    />
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="text-xs text-slate-500">
                                        {(individualOverrides[job.id]?.description || "").length}/500 characters
                                        {!individualOverrides[job.id]?.description && job.libraryDescriptionSuggestion && (
                                          <span className="ml-2 text-slate-400">
                                            (will use AI suggestion)
                                          </span>
                                        )}
                                      </div>
                                      {job.libraryDescriptionSuggestion && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="text-xs h-6 px-2"
                                          onClick={() => updateIndividualMetadata(job.id, 'description', job.libraryDescriptionSuggestion!)}
                                        >
                                          Use AI suggestion
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Individual Additional Tags */}
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Additional Tags
                                      {job.libraryTagsSuggestion && job.libraryTagsSuggestion.length > 0 && (
                                        <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                                          (AI-suggested available)
                                        </span>
                                      )}
                                    </Label>

                                    {/* AI Suggested Tags Quick Add */}
                                    {job.libraryTagsSuggestion && job.libraryTagsSuggestion.length > 0 && (
                                      <div className="mt-2 mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="text-xs text-slate-500">AI suggestions for this analysis:</div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-6 px-2"
                                            onClick={() => {
                                              const currentTags = individualOverrides[job.id]?.tags || [];
                                              const availableTags = job.libraryTagsSuggestion!.filter(
                                                tag => !currentTags.includes(tag)
                                              );
                                              if (availableTags.length > 0) {
                                                updateIndividualMetadata(job.id, 'tags', [...currentTags, ...availableTags]);
                                              }
                                            }}
                                          >
                                            Add All
                                          </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {job.libraryTagsSuggestion
                                            .filter(tag => !(individualOverrides[job.id]?.tags || []).includes(tag))
                                            .map(tag => (
                                            <Badge
                                              key={tag}
                                              variant="secondary"
                                              className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                                              onClick={() => addIndividualTag(job.id, tag)}
                                            >
                                              + {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Show current individual tags */}
                                    {individualOverrides[job.id]?.tags && individualOverrides[job.id]!.tags!.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2 mb-3">
                                        {individualOverrides[job.id]!.tags!.map(tag => (
                                          <Badge key={tag} variant="default" className="flex items-center gap-1 text-xs">
                                            {tag}
                                            <X
                                              className="h-3 w-3 cursor-pointer hover:text-red-500"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                removeIndividualTag(job.id, tag);
                                              }}
                                            />
                                          </Badge>
                                        ))}
                                      </div>
                                    )}

                                    {/* Add tag input */}
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Add specific tag for this analysis..."
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const value = (e.target as HTMLInputElement).value.trim();
                                            if (value) {
                                              addIndividualTag(job.id, value);
                                              (e.target as HTMLInputElement).value = '';
                                            }
                                          }
                                        }}
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={(e) => {
                                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                          const value = input.value.trim();
                                          if (value) {
                                            addIndividualTag(job.id, value);
                                            input.value = '';
                                          }
                                        }}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    {/* Preview effective tags */}
                                    <div className="mt-2">
                                      <div className="text-xs text-slate-500 mb-1">
                                        Effective tags for this analysis:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {(individualOverrides[job.id]?.tags || []).map(tag => (
                                          <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> All eligible analyses will be added to the library.
                        Public share links will be automatically created for analyses that aren't already public.
                        Each analysis will use its individual description and tags.
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Results Display */
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Bulk Operation Complete</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{result.summary.total}</div>
                      <div className="text-slate-500">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{result.summary.successful}</div>
                      <div className="text-slate-500">Added</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                      <div className="text-slate-500">Failed</div>
                    </div>
                  </div>
                </div>

                {result.summary.failed > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Failed Operations:</h4>
                    <div className="text-sm text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                      {result.results
                        .filter(r => !r.success)
                        .map(r => {
                          const job = selectedJobs.find(j => j.id === r.jobId);
                          return (
                            <div key={r.jobId}>
                              • {job?.job_title || r.jobId}: {r.error}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {result ? "Done" : "Cancel"}
          </Button>
          {!result && eligibleJobs.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add {eligibleJobs.length} to Library
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};