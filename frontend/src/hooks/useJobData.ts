// app/hooks/useJobData.ts

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { produce } from "immer";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import {
  AnalysisSection,
  ContextualBriefing,
  Contradiction,
  GeneralAnalysisSection,
  JobData,
  JobDataWithShare,
  Slide /*, other interfaces */,
  SynthesisResults,
  Viewpoint,
} from "@/app/_global/interface";

type GeneralItemField =
  | "summary_points"
  | "actionable_advice"
  | "notable_quotes"
  | "questions_and_answers";
type ConsultantItemField =
  | "client_pain_points"
  | "strategic_opportunities"
  | "critical_quotes"
  | "open_questions"
  | "key_stakeholders_mentioned";
type ItemField = GeneralItemField | ConsultantItemField;
type ViewpointField = "supporting_viewpoints" | "challenging_viewpoints";
type ViewpointProperty = keyof Viewpoint;

export const useJobData = (jobId: string) => {
  // 1. Move SWR call and all state here
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftData, setDraftData] = useState<JobData | null>(null);

  const {
    data: originalData,
    error,
    isLoading,
    mutate,
  } = useSWR<JobDataWithShare>(jobId ? `/results/${jobId}` : null, {
    revalidateOnFocus: false,
  });

  // 2. The derived jobData logic remains
  const jobData = isEditMode ? draftData : originalData;

  // 3. Move the useEffect that syncs original and draft data
  useEffect(() => {
    if (originalData) {
      setDraftData(structuredClone(originalData));
    }
  }, [originalData]);

  const handleSave = async () => {
    if (!draftData) return;

    // 1. Capture the ID of the loading toast
    const toastId = toast.loading("Saving changes...");

    const payload = {
      updatedJobTitle: draftData.job_title,
      updatedResults: draftData.results,
      updatedSlideDeck: draftData.generated_slide_outline,
      updatedSynthesisResults: draftData.synthesis_results,
      updatedArgumentStructure: draftData.argument_structure,
      updatedGlobalBriefing: draftData.global_contextual_briefing,
      updatedBlogPost: draftData.generated_blog_post,
      updatedXThread: draftData.generated_overall_x_thread,
    };

    try {
      await apiClient.patch(`/results/${jobId}/bulk`, payload);
      mutate(draftData, false);
      setIsEditMode(false);

      // 2. Update the original toast to a success message
      toast.success("Analysis saved successfully!", {
        id: toastId,
      });
    } catch (e) {
      // 3. Update the original toast to an error message on failure
      toast.error("Failed to save changes.", {
        id: toastId,
      });
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setDraftData(structuredClone(originalData));
    }
    setIsEditMode(false);
  };

  // --- NEW: Handlers for the Executive Synthesis View ---
  const handleSynthesisChange = useCallback(
    (field: keyof SynthesisResults, value: string) => {
      setDraftData(
        produce((draft) => {
          if (draft?.synthesis_results) {
            (draft.synthesis_results as any)[field] = value;
          }
        })
      );
    },
    []
  );

  const handleSynthesisListChange = useCallback(
    (
      field: "overarching_themes" | "unifying_insights",
      index: number,
      value: string
    ) => {
      setDraftData(
        produce((draft) => {
          if (draft?.synthesis_results) {
            draft.synthesis_results[field][index] = value;
          }
        })
      );
    },
    []
  );

  const handleSynthesisContradictionChange = useCallback(
    (index: number, prop: keyof Contradiction, value: string) => {
      setDraftData(
        produce((draft) => {
          if (draft?.synthesis_results?.key_contradictions) {
            draft.synthesis_results.key_contradictions[index][prop] = value;
          }
        })
      );
    },
    []
  );

  const handleSynthesisAddItem = useCallback(
    (
      field: "overarching_themes" | "unifying_insights" | "key_contradictions"
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft?.synthesis_results) {
            // If synthesis_results doesn't exist, create it.
            draft!.synthesis_results = {
              key_contradictions: [],
              unifying_insights: [],
              overarching_themes: [],
              narrative_arc: "",
            };
          }

          if (field === "key_contradictions") {
            draft?.synthesis_results.key_contradictions.push({
              point_a: "New Point A",
              point_b: "New Point B",
              analysis: "New Analysis",
            });
          } else {
            // Handles 'overarching_themes' and 'unifying_insights'
            draft?.synthesis_results[field].push("New Item");
          }
        })
      );
    },
    []
  );

  const handleSynthesisDeleteItem = useCallback(
    (
      field: "overarching_themes" | "unifying_insights" | "key_contradictions",
      index: number
    ) => {
      setDraftData(
        produce((draft) => {
          if (draft?.synthesis_results) {
            const arrayField = (draft.synthesis_results as any)[field];
            if (Array.isArray(arrayField)) {
              arrayField.splice(index, 1);
            }
          }
        })
      );
    },
    []
  );

  const handleFieldChange = useCallback(
    (sectionId: string, field: keyof AnalysisSection, value: any) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          const section = draft.results.find((s) => s.id === sectionId);
          if (section) {
            (section as any)[field] = value;
          }
        })
      );
    },
    []
  );

  const handleAddItem = useCallback((sectionId: string, field: ItemField) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = draft.results.find((s) => s.id === sectionId);
        if (section) {
          const arrayField = (section as any)[field];
          if (Array.isArray(arrayField)) {
            if (field === "questions_and_answers") {
              arrayField.push({ question: "", answer: "" });
            } else {
              arrayField.push("");
            }
          }
        }
      })
    );
  }, []);

  const handleDeleteItem = useCallback(
    (sectionId: string, field: ItemField, index: number) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          const section = draft.results.find((s) => s.id === sectionId);
          if (section) {
            const arrayField = (section as any)[field];
            if (Array.isArray(arrayField)) {
              arrayField.splice(index, 1);
            }
          }
        })
      );
    },
    []
  );

  const handleItemChange = useCallback(
    (sectionId: string, field: ItemField, index: number, newValue: string) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          const section = draft.results.find((s) => s.id === sectionId);
          if (section) {
            const arrayField = (section as any)[field];
            if (Array.isArray(arrayField)) {
              arrayField[index] = newValue;
            }
          }
        })
      );
    },
    []
  );

  const handleQaChange = useCallback(
    (
      sectionId: string,
      index: number,
      field: "question" | "answer",
      value: string
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          const section = draft.results.find((s) => s.id === sectionId) as
            | GeneralAnalysisSection
            | undefined;
          if (section?.questions_and_answers) {
            section.questions_and_answers[index][field] = value;
          }
        })
      );
    },
    []
  );

  const handleContextualBriefingChange = useCallback(
    (field: keyof ContextualBriefing, value: any) => {
      setDraftData(
        produce((draft) => {
          // Access .briefing_data to modify the correct object
          if (draft?.global_contextual_briefing?.briefing_data) {
            (draft.global_contextual_briefing.briefing_data as any)[field] =
              value;
          }
        })
      );
    },
    []
  );

  const handleContextualBriefingAddItem = useCallback(
    (field: "key_nuances_and_conditions" | ViewpointField) => {
      setDraftData(
        produce((draft) => {
          if (!draft?.global_contextual_briefing?.briefing_data) return;

          // Access .briefing_data to get to the actual content
          const briefing = draft.global_contextual_briefing.briefing_data;

          if (field === "key_nuances_and_conditions") {
            briefing.key_nuances_and_conditions = [
              ...(briefing.key_nuances_and_conditions || []),
              "",
            ];
          } else if (field === "supporting_viewpoints") {
            briefing.supporting_viewpoints = [
              ...(briefing.supporting_viewpoints || []),
              { perspective: "New Perspective", source: "New Source", url: "" },
            ];
          } else if (field === "challenging_viewpoints") {
            briefing.challenging_viewpoints = [
              ...(briefing.challenging_viewpoints || []),
              { perspective: "New Perspective", source: "New Source", url: "" },
            ];
          }
        })
      );
    },
    []
  );

  const handleContextualBriefingDeleteItem = useCallback(
    (field: "key_nuances_and_conditions" | ViewpointField, index: number) => {
      setDraftData(
        produce((draft) => {
          if (!draft?.global_contextual_briefing?.briefing_data) return;

          // Access .briefing_data to get to the actual content
          const arrayField =
            draft.global_contextual_briefing.briefing_data[field];
          if (Array.isArray(arrayField)) {
            arrayField.splice(index, 1);
          }
        })
      );
    },
    []
  );

  const handleContextualBriefingListItemChange = useCallback(
    (field: "key_nuances_and_conditions", index: number, value: string) => {
      setDraftData(
        produce((draft) => {
          // Access .briefing_data to get to the actual content
          if (
            draft?.global_contextual_briefing?.briefing_data
              ?.key_nuances_and_conditions
          ) {
            draft.global_contextual_briefing.briefing_data.key_nuances_and_conditions[
              index
            ] = value;
          }
        })
      );
    },
    []
  );

  const handleContextualBriefingViewpointChange = useCallback(
    (
      field: ViewpointField,
      index: number,
      prop: ViewpointProperty,
      value: string
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft?.global_contextual_briefing?.briefing_data) return;

          // Access .briefing_data to get to the actual content
          const viewpointArray =
            draft.global_contextual_briefing.briefing_data[field];
          if (viewpointArray?.[index]) {
            (viewpointArray[index] as any)[prop] = value;
          }
        })
      );
    },
    []
  );

  const handleBlogPostChange = useCallback((newContent: string) => {
    setDraftData(
      produce((draft) => {
        if (draft) {
          draft.generated_blog_post = newContent;
        }
      })
    );
  }, []);

  // --- Handlers for X Thread ---
  const handleXThreadChange = useCallback(
    (index: number, newContent: string) => {
      setDraftData(
        produce((draft) => {
          if (draft?.generated_overall_x_thread) {
            draft.generated_overall_x_thread[index] = newContent;
          }
        })
      );
    },
    []
  );

  const handleXThreadAddItem = useCallback(() => {
    setDraftData(
      produce((draft) => {
        if (draft) {
          if (!draft.generated_overall_x_thread) {
            draft.generated_overall_x_thread = [];
          }
          draft.generated_overall_x_thread.push("New tweet...");
        }
      })
    );
  }, []);

  const handleXThreadDeleteItem = useCallback((index: number) => {
    setDraftData(
      produce((draft) => {
        if (draft?.generated_overall_x_thread) {
          draft.generated_overall_x_thread.splice(index, 1);
        }
      })
    );
  }, []);

  // --- Handlers for the Slide Deck ---
  const handleAddSlide = useCallback(() => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const newSlide: Slide = {
          slide_title: "New Slide",
          slide_bullets: [""],
        };
        if (!draft.generated_slide_outline) {
          draft.generated_slide_outline = [newSlide];
        } else {
          draft.generated_slide_outline.push(newSlide);
        }
      })
    );
  }, []);

  const handleDeleteSlide = useCallback((slideIndex: number) => {
    setDraftData(
      produce((draft) => {
        if (draft?.generated_slide_outline) {
          draft.generated_slide_outline.splice(slideIndex, 1);
        }
      })
    );
  }, []);

  const handleSlideTitleChange = useCallback(
    (slideIndex: number, newTitle: string) => {
      setDraftData(
        produce((draft) => {
          if (draft?.generated_slide_outline) {
            draft.generated_slide_outline[slideIndex].slide_title = newTitle;
          }
        })
      );
    },
    []
  );

  const handleAddBullet = useCallback((slideIndex: number) => {
    setDraftData(
      produce((draft) => {
        if (draft?.generated_slide_outline) {
          draft.generated_slide_outline[slideIndex].slide_bullets.push("");
        }
      })
    );
  }, []);

  const handleDeleteBullet = useCallback(
    (slideIndex: number, bulletIndex: number) => {
      setDraftData(
        produce((draft) => {
          if (draft?.generated_slide_outline) {
            draft.generated_slide_outline[slideIndex].slide_bullets.splice(
              bulletIndex,
              1
            );
          }
        })
      );
    },
    []
  );

  const handleSlideChange = useCallback(
    (slideIndex: number, bulletIndex: number, newValue: string) => {
      setDraftData(
        produce((draft) => {
          if (draft?.generated_slide_outline) {
            draft.generated_slide_outline[slideIndex].slide_bullets[
              bulletIndex
            ] = newValue;
          }
        })
      );
    },
    []
  );

  const handleArgumentStructureFieldChange = useCallback(
    (field: "main_thesis", value: string) => {
      setDraftData(
        produce((draft) => {
          if (draft?.argument_structure) {
            draft.argument_structure[field] = value;
          }
        })
      );
    },
    []
  );

  const handleArgumentStructureListChange = useCallback(
    (
      field: "supporting_arguments" | "counterarguments_mentioned",
      index: number,
      value: string
    ) => {
      setDraftData(
        produce((draft) => {
          if (draft?.argument_structure) {
            draft.argument_structure[field][index] = value;
          }
        })
      );
    },
    []
  );

  const handleArgumentStructureAddItem = useCallback(
    (field: "supporting_arguments" | "counterarguments_mentioned") => {
      setDraftData(
        produce((draft) => {
          if (!draft?.argument_structure) {
            draft!.argument_structure = {
              main_thesis: "",
              supporting_arguments: [],
              counterarguments_mentioned: [],
            };
          }
          draft?.argument_structure[field].push("New Item");
        })
      );
    },
    []
  );

  const handleArgumentStructureDeleteItem = useCallback(
    (
      field: "supporting_arguments" | "counterarguments_mentioned",
      index: number
    ) => {
      setDraftData(
        produce((draft) => {
          if (draft?.argument_structure) {
            draft.argument_structure[field].splice(index, 1);
          }
        })
      );
    },
    []
  );

  const handleTitleChange = useCallback((newTitle: string) => {
    setDraftData(
      produce((draft) => {
        if (draft) {
          draft.job_title = newTitle;
        }
      })
    );
  }, []);

  return {
    // --- Core Data & State ---
    jobData,
    isLoading,
    error,
    isEditMode,
    setIsEditMode,
    originalData, // For the useShareDialog hook
    mutate, // For the useShareDialog hook

    // --- Top-Level Actions ---
    handleSave,
    handleCancel,
    handleTitleChange,

    // --- Executive Synthesis Handlers ---
    handleSynthesisChange,
    handleSynthesisListChange,
    handleSynthesisContradictionChange,
    handleSynthesisAddItem,
    handleSynthesisDeleteItem,

    // --- Section & Item Handlers (for both General & Consultant reports) ---
    handleFieldChange,
    handleAddItem,
    handleDeleteItem,
    handleItemChange,
    handleQaChange,

    // --- Contextual Briefing Handlers ---
    handleContextualBriefingChange,
    handleContextualBriefingAddItem,
    handleContextualBriefingDeleteItem,
    handleContextualBriefingListItemChange,
    handleContextualBriefingViewpointChange,

    // --- Slide Deck Handlers ---
    handleAddSlide,
    handleDeleteSlide,
    handleSlideTitleChange,
    handleAddBullet,
    handleDeleteBullet,
    handleSlideChange,

    // --- Argument Structure Handlers ---
    handleArgumentStructureFieldChange,
    handleArgumentStructureListChange,
    handleArgumentStructureAddItem,
    handleArgumentStructureDeleteItem,

    // --- Blog Post & X-Thread Handlers ---
    handleBlogPostChange,
    handleXThreadChange,
    handleXThreadAddItem,
    handleXThreadDeleteItem,
  };
};
