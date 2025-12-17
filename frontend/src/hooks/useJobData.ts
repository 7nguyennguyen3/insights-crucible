// app/hooks/useJobData.ts

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { produce } from "immer";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import {
  ActionableTakeaway,
  AnalysisSection,
  DeepDiveSection,
  Contradiction,
  LessonConcept,
  NotableQuote,
  OpenEndedQuestion,
  QuizQuestion,
  Slide,
  SynthesisResults,
} from "@/types/analysis";
import {
  JobData,
  JobDataWithShare,
} from "@/types/job";

// Current database structure based on output_result_2.json
type ActionableTakeawayField =
  | "takeaway"
  | "supporting_quote"
  | "type";

type QuizQuestionField =
  | "question"
  | "options"
  | "correct_answer"
  | "explanation";

type SectionField =
  | "actionable_takeaways";

type ItemField = ActionableTakeawayField | QuizQuestionField | SectionField;

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
          const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
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
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section) {
          const arrayField = (section as any)[field];
          if (Array.isArray(arrayField)) {
            if (field === "actionable_takeaways") {
              arrayField.push({
                takeaway: "New takeaway...",
                supporting_quote: "Add supporting quote...",
                type: "Prescriptive Action"
              });
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
          const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
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
          const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
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
          const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId) as any;
          if (section?.questions_and_answers) {
            section.questions_and_answers[index][field] = value;
          }
        })
      );
    },
    []
  );




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

  const handleEntityChange = useCallback(
    (
      sectionId: string,
      index: number,
      field: "name" | "explanation",
      value: string
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
          if (section?.entities) {
            section.entities[index][field] = value;
          }
        })
      );
    },
    []
  );

  const handleAddEntity = useCallback((sectionId: string) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section) {
          if (!section.entities) {
            section.entities = [];
          }
          section.entities.push({
            name: "New Concept",
            explanation: "New explanation...",
          });
        }
      })
    );
  }, []);

  const handleDeleteEntity = useCallback((sectionId: string, index: number) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section?.entities) {
          section.entities.splice(index, 1);
        }
      })
    );
  }, []);

  // --- Learning Accelerator Handlers ---
  const handleLessonChange = useCallback(
    (
      sectionId: string,
      index: number,
      field: keyof LessonConcept,
      value: string | string[]
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
          if (section && 'lessons_and_concepts' in section && section.lessons_and_concepts) {
            (section.lessons_and_concepts[index] as any)[field] = value;
          }
        })
      );
    },
    []
  );

  const handleAddLesson = useCallback((sectionId: string) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section && 'lessons_and_concepts' in section) {
          if (!section.lessons_and_concepts) {
            section.lessons_and_concepts = [];
          }
          (section.lessons_and_concepts as any).push({
            lesson: "New lesson or concept",
            supporting_quote: "Add supporting quote...",
            // timestamp: "00:00", // TODO: Fix type mismatch
            // real_life_examples: ["Add real-life example..."], // TODO: Fix type mismatch
          });
        }
      })
    );
  }, []);

  const handleDeleteLesson = useCallback((sectionId: string, index: number) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section && 'lessons_and_concepts' in section && section.lessons_and_concepts) {
          section.lessons_and_concepts.splice(index, 1);
        }
      })
    );
  }, []);

  // --- Deep Dive Takeaway Handlers ---
  const handleTakeawayChange = useCallback(
    (
      sectionId: string,
      index: number,
      field: keyof ActionableTakeaway,
      value: string
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
          if (section && 'actionable_takeaways' in section && section.actionable_takeaways) {
            (section.actionable_takeaways[index] as any)[field] = value;
          } else if (section && 'lessons_and_concepts' in section && section.lessons_and_concepts) {
            // Handle legacy lessons_and_concepts structure
            const mappedField = field === 'takeaway' ? 'lesson' : field;
            (section.lessons_and_concepts[index] as any)[mappedField] = value;
          }
        })
      );
    },
    []
  );

  const handleAddTakeaway = useCallback((sectionId: string) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section && 'actionable_takeaways' in section) {
          if (!section.actionable_takeaways) {
            section.actionable_takeaways = [];
          }
          section.actionable_takeaways.push({
            type: "Prescriptive Action",
            takeaway: "New actionable takeaway",
            supporting_quote: "Add supporting quote...",
          });
        } else if (section && 'lessons_and_concepts' in section) {
          // Handle legacy structure
          const legacySection = section as any;
          if (!legacySection.lessons_and_concepts) {
            legacySection.lessons_and_concepts = [];
          }
          legacySection.lessons_and_concepts.push({
            lesson: "New lesson or concept",
            supporting_quote: "Add supporting quote...",
            // timestamp: "00:00", // TODO: Fix type mismatch
            // real_life_examples: ["Add real-life example..."], // TODO: Fix type mismatch
          });
        }
      })
    );
  }, []);

  const handleDeleteTakeaway = useCallback((sectionId: string, index: number) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section && 'actionable_takeaways' in section && section.actionable_takeaways) {
          section.actionable_takeaways.splice(index, 1);
        } else if (section && 'lessons_and_concepts' in section) {
          // Handle legacy structure
          const legacySection = section as any;
          if (legacySection.lessons_and_concepts) {
            legacySection.lessons_and_concepts.splice(index, 1);
          }
        }
      })
    );
  }, []);

  const handleQuoteChange = useCallback(
    (
      sectionId: string,
      index: number,
      field: keyof NotableQuote,
      value: string
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
          if (section && 'notable_quotes' in section) {
            const legacySection = section as any;
            if (legacySection.notable_quotes && legacySection.notable_quotes[index]) {
              legacySection.notable_quotes[index][field] = value;
            }
          }
        })
      );
    },
    []
  );

  const handleAddQuote = useCallback((sectionId: string) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section && 'notable_quotes' in section) {
          if (!section.notable_quotes) {
            section.notable_quotes = [];
          }
          // Deep dive sections that use NotableQuote objects
          (section.notable_quotes as any).push({
            quote: "Add notable quote...",
            context: "Add context...",
            timestamp: "00:00",
          });
        }
      })
    );
  }, []);

  const handleDeleteQuote = useCallback((sectionId: string, index: number) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const section = (draft.results as DeepDiveSection[]).find((s) => s.id === sectionId);
        if (section && 'notable_quotes' in section) {
          const legacySection = section as any;
          if (legacySection.notable_quotes) {
            legacySection.notable_quotes.splice(index, 1);
          }
        }
      })
    );
  }, []);

  const handleQuizQuestionChange = useCallback(
    (
      index: number,
      field: keyof QuizQuestion,
      value: string | string[]
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          if (draft.learning_synthesis?.quiz_questions) {
            (draft.learning_synthesis.quiz_questions[index] as any)[field] = value;
          } else if (draft.generated_quiz_questions?.questions) {
            (draft.generated_quiz_questions.questions[index] as any)[field] = value;
          }
        })
      );
    },
    []
  );

  const handleAddQuizQuestion = useCallback(() => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const newQuestion: QuizQuestion = {
          question: "New question...",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correct_answer: "A",
          explanation: "Explanation for correct answer...",
          supporting_quote: "Add supporting quote...",
          related_timestamp: "00:00",
        };
        
        if (draft.learning_synthesis) {
          if (!draft.learning_synthesis.quiz_questions) {
            draft.learning_synthesis.quiz_questions = [];
          }
          draft.learning_synthesis.quiz_questions.push(newQuestion);
        } else if (draft.generated_quiz_questions) {
          if (!draft.generated_quiz_questions.questions) {
            draft.generated_quiz_questions.questions = [];
          }
          draft.generated_quiz_questions.questions.push(newQuestion);
        }
      })
    );
  }, []);

  const handleDeleteQuizQuestion = useCallback((index: number) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        if (draft.generated_quiz_questions?.questions) {
          draft.generated_quiz_questions.questions.splice(index, 1);
        }
      })
    );
  }, []);

  // --- Open-Ended Question Handlers ---
  const handleOpenEndedQuestionChange = useCallback(
    (
      index: number,
      field: string,
      value: string | string[]
    ) => {
      setDraftData(
        produce((draft) => {
          if (!draft) return;
          if (draft.generated_quiz_questions?.open_ended_questions) {
            const question = draft.generated_quiz_questions.open_ended_questions[index];
            if (field.startsWith('metadata.')) {
              const metadataField = field.replace('metadata.', '');
              if (!question.metadata) {
                question.metadata = {
                  evaluation_criteria: [],
                  supporting_quote: '',
                  quote_timestamp: null,
                  timestamp_source: '',
                  insight_principle: ''
                };
              }
              (question.metadata as any)[metadataField] = value;
            } else {
              // Handle special fields that need type conversion
              if (field === 'source_section') {
                (question as any)[field] = typeof value === 'string' ? parseInt(value) || 0 : value;
              } else {
                (question as any)[field] = value;
              }
            }
          }
        })
      );
    },
    []
  );

  const handleAddOpenEndedQuestion = useCallback(() => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        const newQuestion: OpenEndedQuestion = {
          question: "New reflection question...",
          related_timestamp: "00:00",
          metadata: {
            evaluation_criteria: [""],
            supporting_quote: "Add supporting quote...",
            quote_timestamp: null,
            timestamp_source: "manual",
            insight_principle: "Add learning principle..."
          }
        };

        if (draft.generated_quiz_questions) {
          if (!draft.generated_quiz_questions.open_ended_questions) {
            draft.generated_quiz_questions.open_ended_questions = [];
          }
          draft.generated_quiz_questions.open_ended_questions.push(newQuestion);
        }
      })
    );
  }, []);

  const handleDeleteOpenEndedQuestion = useCallback((index: number) => {
    setDraftData(
      produce((draft) => {
        if (!draft) return;
        if (draft.generated_quiz_questions?.open_ended_questions) {
          draft.generated_quiz_questions.open_ended_questions.splice(index, 1);
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

    handleEntityChange,
    handleAddEntity,
    handleDeleteEntity,

    // --- Learning Accelerator Handlers ---
    handleLessonChange,
    handleAddLesson,
    handleDeleteLesson,
    handleQuoteChange,
    handleAddQuote,
    handleDeleteQuote,
    handleQuizQuestionChange,
    handleAddQuizQuestion,
    handleDeleteQuizQuestion,

    // --- Open-Ended Question Handlers ---
    handleOpenEndedQuestionChange,
    handleAddOpenEndedQuestion,
    handleDeleteOpenEndedQuestion,

    // --- Deep Dive Takeaway Handlers ---
    handleTakeawayChange,
    handleAddTakeaway,
    handleDeleteTakeaway,

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

  };
};
