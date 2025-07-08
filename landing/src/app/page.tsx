// Filename: /app/page.tsx
"use client";

import {
  AlertTriangle,
  Award,
  BarChart,
  BookCopy,
  BookOpen,
  Briefcase,
  ChevronDown,
  FileText,
  Key,
  Lightbulb,
  Mail,
  MessageSquare,
  Quote,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
// Adjust the import path if your `lib` folder is not in the parent directory
import {
  allDemoAnalyses,
  DemoAnalysisPayload,
  demoTranscripts,
  InteractiveConsultantSection,
  InteractiveGeneralSection,
} from "./lib/data";

const Button = ({
  children,
  className,
  variant = "primary",
  type = "button",
  href,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "persona";
  type?: "button" | "submit";
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
}) => {
  const baseClasses =
    "inline-flex items-center justify-center px-6 py-3 font-semibold text-base rounded-lg shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950";

  const variantClasses = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "text-slate-800 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:ring-slate-500",
    persona:
      "text-slate-600 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600",
  };

  const interactiveClasses = disabled
    ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed text-white"
    : "transform hover:-translate-y-1";

  const commonProps = {
    className: `${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`,
    disabled,
    onClick,
  };

  if (href && !disabled) {
    return (
      <a href={href} className={commonProps.className}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} {...commonProps}>
      {children}
    </button>
  );
};

const WaitlistForm = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        // Try to get the error message from the response body
        const errorData = await response.json();
        setErrorMessage(errorData.error || "Something went wrong.");
        setState("error");
        return;
      }

      // If successful
      setState("success");
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
        <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
          You're on the list!
        </h3>
        <p className="text-green-700 dark:text-green-400">
          Thanks for joining. We've sent a confirmation email to you.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg mx-auto flex flex-col sm:flex-row gap-4 items-center"
    >
      <div className="w-full">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="youremail@company.com"
            required
            className="w-full pl-12 pr-4 py-3 text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white"
          />
        </div>
        {state === "error" && (
          <p className="text-red-500 text-sm mt-2 text-left">{errorMessage}</p>
        )}
      </div>
      <Button
        type="submit"
        variant="primary"
        className="w-full sm:w-auto h-[54px] flex-shrink-0"
        disabled={state === "loading"}
      >
        {state === "loading" ? "Submitting..." : "Join Waitlist"}
      </Button>
    </form>
  );
};

const AnalysisBlock = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div>
    <h6 className="font-semibold text-sm text-slate-600 dark:text-slate-300 flex items-center mb-2">
      {icon}
      {title}
    </h6>
    {children}
  </div>
);

const AnalysisResult = ({
  currentAnalysis,
  selectedPersona,
  activeTabId,
  setActiveTabId,
  openSectionIds,
  setOpenSectionIds,
  setHighlightedId,
  highlightedId,
}: {
  currentAnalysis: DemoAnalysisPayload;
  selectedPersona: "consultant" | "general";
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  openSectionIds: Set<string>;
  setOpenSectionIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setHighlightedId: (id: string | null) => void;
  highlightedId: string | null;
}) => {
  const consultantTabContent = useMemo(() => {
    if (
      selectedPersona !== "consultant" ||
      !currentAnalysis?.synthesis_results
    ) {
      return null;
    }
    switch (activeTabId) {
      case "synthesis":
        return (
          <div className="space-y-4 animate-fade-in-short">
            <AnalysisBlock
              title="Strategic Narrative Arc"
              icon={<Sparkles className="w-4 h-4 mr-2" />}
            >
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {currentAnalysis.synthesis_results.narrative_arc}
              </p>
            </AnalysisBlock>
            <AnalysisBlock
              title="Overarching Themes"
              icon={<BookCopy className="w-4 h-4 mr-2" />}
            >
              <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                {currentAnalysis.synthesis_results.overarching_themes.map(
                  (theme) => (
                    <li key={theme}>{theme}</li>
                  )
                )}
              </ul>
            </AnalysisBlock>
          </div>
        );
      case "unifying_insights":
        return (
          <div className="animate-fade-in-short">
            <AnalysisBlock
              title="Unifying Insights"
              icon={<Lightbulb className="w-4 h-4 mr-2" />}
            >
              <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                {currentAnalysis.synthesis_results.unifying_insights.map(
                  (insight) => (
                    <li key={insight}>{insight}</li>
                  )
                )}
              </ul>
            </AnalysisBlock>
          </div>
        );
      case "contradictions":
        return (
          <div className="animate-fade-in-short">
            <AnalysisBlock
              title="Key Contradictions"
              icon={<AlertTriangle className="w-4 h-4 mr-2" />}
            >
              <div className="space-y-3">
                {currentAnalysis.synthesis_results.key_contradictions.map(
                  (c, i) => (
                    <div
                      key={i}
                      className="text-sm p-2 bg-white dark:bg-slate-800 rounded"
                    >
                      <p className="text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-red-600 dark:text-red-400">
                          A:
                        </span>{" "}
                        {c.point_a}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 my-4">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          B:
                        </span>{" "}
                        {c.point_b}
                      </p>
                      <p className="mt-1 border-t border-slate-200 dark:border-slate-700 pt-1 text-slate-800 dark:text-slate-200">
                        {c.analysis}
                      </p>
                    </div>
                  )
                )}
              </div>
            </AnalysisBlock>
          </div>
        );
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersona, activeTabId, currentAnalysis]);

  const generalTabContent = useMemo(() => {
    if (selectedPersona !== "general" || !currentAnalysis?.argument_structure) {
      return null;
    }
    return (
      <div className="space-y-4 animate-fade-in-short">
        <AnalysisBlock
          title="Main Thesis"
          icon={<Award className="w-4 h-4 mr-2" />}
        >
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {currentAnalysis.argument_structure.main_thesis}
          </p>
        </AnalysisBlock>
        <AnalysisBlock
          title="Supporting Arguments"
          icon={<BarChart className="w-4 h-4 mr-2" />}
        >
          <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
            {currentAnalysis.argument_structure.supporting_arguments.map(
              (arg) => (
                <li key={arg}>{arg}</li>
              )
            )}
          </ul>
        </AnalysisBlock>
        <AnalysisBlock
          title="Counterarguments Mentioned"
          icon={<MessageSquare className="w-4 h-4 mr-2" />}
        >
          <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
            {currentAnalysis.argument_structure.counterarguments_mentioned.map(
              (c) => (
                <li key={c}>{c}</li>
              )
            )}
          </ul>
        </AnalysisBlock>
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersona, currentAnalysis]);

  const toggleSection = (sectionId: string) => {
    setOpenSectionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const renderSection = (
    section: InteractiveConsultantSection | InteractiveGeneralSection
  ) => {
    const isOpen = openSectionIds.has(section.id);
    const SectionTitle = () => (
      <div className="flex justify-between items-center w-full text-left">
        <h5 className="font-bold text-slate-900 dark:text-slate-100 pr-4">
          {section.analysis_persona === "consultant"
            ? section.section_title
            : section.generated_title}
        </h5>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
            {section.start_time} - {section.end_time}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-slate-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
    );

    if (section.analysis_persona === "consultant") {
      return (
        <div
          key={section.id}
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            <SectionTitle />
          </button>
          {isOpen && (
            <div className="space-y-4 p-4 border-t border-slate-200 dark:border-slate-700">
              <AnalysisBlock
                title="Executive Summary"
                icon={<MessageSquare className="w-4 h-4 mr-2" />}
              >
                <p
                  className="text-sm text-slate-700 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded"
                  onClick={() =>
                    setHighlightedId(
                      highlightedId === section.executive_summary.highlightId
                        ? null
                        : section.executive_summary.highlightId
                    )
                  }
                >
                  {section.executive_summary.text}
                </p>
              </AnalysisBlock>
              <AnalysisBlock
                title="Client Pain Points"
                icon={<AlertTriangle className="w-4 h-4 mr-2" />}
              >
                <ul className="flex flex-wrap gap-2">
                  {section.client_pain_points.map((point) => (
                    <li
                      key={point.highlightId}
                      className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-red-900/50 dark:text-red-300 cursor-pointer transition-all hover:brightness-95 hover:shadow-sm"
                      onClick={() =>
                        setHighlightedId(
                          highlightedId === point.highlightId
                            ? null
                            : point.highlightId
                        )
                      }
                    >
                      {point.text}
                    </li>
                  ))}
                </ul>
              </AnalysisBlock>
              <AnalysisBlock
                title="Strategic Opportunities"
                icon={<Lightbulb className="w-4 h-4 mr-2" />}
              >
                <ul className="flex flex-wrap gap-2">
                  {section.strategic_opportunities.map((opp) => (
                    <li
                      key={opp.highlightId}
                      className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-green-900/50 dark:text-green-300 cursor-pointer transition-all hover:brightness-95 hover:shadow-sm"
                      onClick={() =>
                        setHighlightedId(
                          highlightedId === opp.highlightId
                            ? null
                            : opp.highlightId
                        )
                      }
                    >
                      {opp.text}
                    </li>
                  ))}
                </ul>
              </AnalysisBlock>
            </div>
          )}
        </div>
      );
    }

    if (section.analysis_persona === "general") {
      return (
        <div
          key={section.id}
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            <SectionTitle />
          </button>
          {isOpen && (
            <div className="space-y-4 p-4 border-t border-slate-200 dark:border-slate-700">
              <AnalysisBlock
                title="Summary Points"
                icon={<BookOpen className="w-4 h-4 mr-2" />}
              >
                <ul className="list-disc list-inside space-y-1">
                  {section.summary_points.map((point) => (
                    <li
                      key={point.highlightId}
                      className="text-sm text-slate-700 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded"
                      onClick={() =>
                        setHighlightedId(
                          highlightedId === point.highlightId
                            ? null
                            : point.highlightId
                        )
                      }
                    >
                      {point.text}
                    </li>
                  ))}
                </ul>
              </AnalysisBlock>
              <AnalysisBlock
                title="Actionable Advice"
                icon={<Target className="w-4 h-4 mr-2" />}
              >
                <ul className="list-disc list-inside space-y-1">
                  {section.actionable_advice.map((item) => (
                    <li
                      key={item.highlightId}
                      className="text-sm text-slate-700 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded"
                      onClick={() =>
                        setHighlightedId(
                          highlightedId === item.highlightId
                            ? null
                            : item.highlightId
                        )
                      }
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              </AnalysisBlock>
              {section.questions_and_answers &&
                section.questions_and_answers.length > 0 && (
                  <AnalysisBlock
                    title="Questions & Answers"
                    icon={<MessageSquare className="w-4 h-4 mr-2" />}
                  >
                    <div className="space-y-3">
                      {section.questions_and_answers.map((qa, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            Q: {qa.question}
                          </p>
                          <p
                            className="text-slate-700 dark:text-slate-400 pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-1 mt-1 py-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            onClick={() =>
                              setHighlightedId(
                                highlightedId === qa.answer.highlightId
                                  ? null
                                  : qa.answer.highlightId
                              )
                            }
                          >
                            <span className="font-semibold text-slate-500 dark:text-slate-300">
                              A:{" "}
                            </span>
                            {qa.answer.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AnalysisBlock>
                )}
              <AnalysisBlock
                title="Key Entities"
                icon={<Key className="w-4 h-4 mr-2" />}
              >
                <ul className="flex flex-wrap gap-2">
                  {section.key_entities.map((entity) => (
                    <li
                      key={entity.highlightId}
                      className="bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-sky-900/50 dark:text-sky-300 cursor-pointer transition-all hover:brightness-95 hover:shadow-sm"
                      onClick={() =>
                        setHighlightedId(
                          highlightedId === entity.highlightId
                            ? null
                            : entity.highlightId
                        )
                      }
                    >
                      {entity.text}
                    </li>
                  ))}
                </ul>
              </AnalysisBlock>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const synthesisTabs = [
    { id: "synthesis", label: "Narrative & Themes" },
    { id: "unifying_insights", label: "Unifying Insights" },
    { id: "contradictions", label: "Contradictions" },
  ];
  const argumentTabs = [{ id: "argument", label: "Thesis & Arguments" }];
  const tabs = selectedPersona === "consultant" ? synthesisTabs : argumentTabs;

  return (
    <div
      className="text-left animate-fade-in space-y-4"
      onMouseLeave={() => setHighlightedId(null)}
    >
      <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-2 border-b border-blue-200 dark:border-blue-700 pb-2 mb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition ${
                activeTabId === tab.id
                  ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedPersona === "consultant" && consultantTabContent}
        {selectedPersona === "general" && generalTabContent}
      </div>

      <div className="space-y-2">
        {currentAnalysis.sections.map(renderSection)}
      </div>
    </div>
  );
};

const InstantInteractiveDemo = () => {
  const [demoState, setDemoState] = useState<"idle" | "loading" | "finished">(
    "idle"
  );
  const [selectedTranscriptId, setSelectedTranscriptId] = useState(
    demoTranscripts[0].id
  );
  const [selectedPersona, setSelectedPersona] = useState<
    "consultant" | "general"
  >("consultant");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const [activeTabId, setActiveTabId] = useState<string>("synthesis");
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(new Set());

  const currentTranscript = useMemo(
    () => demoTranscripts.find((t) => t.id === selectedTranscriptId),
    [selectedTranscriptId]
  );

  const currentAnalysis = useMemo(
    () => allDemoAnalyses[selectedTranscriptId]?.[selectedPersona],
    [selectedTranscriptId, selectedPersona]
  );

  useEffect(() => {
    setActiveTabId(selectedPersona === "consultant" ? "synthesis" : "argument");
    setOpenSectionIds(new Set());
    setDemoState("idle");
  }, [selectedPersona, selectedTranscriptId]);

  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (!container) return;

    container.querySelectorAll("span.highlight").forEach((span) => {
      span.classList.remove("highlight");
    });

    if (highlightedId) {
      const elementToHighlight = container.querySelector(
        `[data-highlight-id="${highlightedId}"]`
      );
      if (elementToHighlight) {
        elementToHighlight.classList.add("highlight");

        elementToHighlight.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [highlightedId]);

  const handleRunDemo = () => {
    setDemoState("loading");
    setTimeout(() => {
      setDemoState("finished");
    }, 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <label
            htmlFor="transcript-select"
            className="text-sm font-bold mr-2 text-slate-600 dark:text-slate-300"
          >
            Select Demo:
          </label>
          <select
            id="transcript-select"
            value={selectedTranscriptId}
            onChange={(e) => {
              setSelectedTranscriptId(e.target.value);
            }}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {demoTranscripts.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
          <Button
            variant={selectedPersona === "consultant" ? "primary" : "persona"}
            onClick={() => setSelectedPersona("consultant")}
            className="px-4 py-2 text-sm"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Consultant View
          </Button>
          <Button
            variant={selectedPersona === "general" ? "primary" : "persona"}
            onClick={() => setSelectedPersona("general")}
            className="px-4 py-2 text-sm"
          >
            <Users className="w-4 h-4 mr-2" />
            General View
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">
            1. Raw Interview Excerpt
          </h3>
          <div
            ref={transcriptContainerRef}
            className="flex-grow bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 font-mono text-sm text-slate-600 dark:text-slate-400 prose dark:prose-invert prose-p:my-2 prose-div:my-2 overflow-y-auto h-[450px]"
          >
            <style>
              {`
                .highlight {
                  background-color: rgba(250, 204, 21, 0.5);
                  border-radius: 3px;
                  transition: background-color 0.2s ease-in-out;
                }
                .animate-fade-in-short {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
              `}
            </style>
            <div
              dangerouslySetInnerHTML={{
                __html: currentTranscript?.transcript || "",
              }}
            />
          </div>
          <Button
            onClick={handleRunDemo}
            disabled={demoState !== "idle"}
            variant="primary"
            className="w-full mt-4"
          >
            {demoState === "idle" && "► Run Instant Demo"}
            {demoState === "loading" && "Analyzing..."}
            {demoState === "finished" && "✓ Analysis Complete"}
          </Button>
        </div>

        <div className="flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">
            2. Structured Intelligence
          </h3>
          <div className="flex-grow bg-slate-100 dark:bg-slate-800/50 rounded-lg p-2 relative overflow-y-auto h-[450px]">
            {demoState === "idle" && (
              <div className="flex items-center justify-center h-full text-slate-500">
                Click "Run Instant Demo" to see the results...
              </div>
            )}
            {demoState === "loading" && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            {demoState === "finished" && currentAnalysis && (
              <AnalysisResult
                currentAnalysis={currentAnalysis}
                selectedPersona={selectedPersona}
                activeTabId={activeTabId}
                setActiveTabId={setActiveTabId}
                openSectionIds={openSectionIds}
                setOpenSectionIds={setOpenSectionIds}
                setHighlightedId={setHighlightedId}
                highlightedId={highlightedId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const WaitlistLandingPage = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* 1. Hero Section */}
      <header className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-20 md:py-32 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto">
            From 1-Hour Interview to Actionable Insights in Minutes.
          </h1>
          <div className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            <span className="font-semibold text-2xl text-slate-800 dark:text-slate-200 block mb-2">
              Insights Crucible
            </span>
            <em className="block mb-4 text-slate-500 dark:text-slate-400">
              Where raw data is forged into strategic clarity.
            </em>
            <p>
              An AI-powered force multiplier for management consultants,
              researchers, and knowledge workers. Stop manually processing data.
              Start delivering high-impact strategic output, faster.
            </p>
          </div>
          <div className="mt-12">
            <WaitlistForm />
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Join the waitlist for a chance to become a founding member and lock
            in exclusive lifetime pricing.
          </p>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32 bg-slate-50 dark:bg-slate-950/70">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
                Your Biggest Bottleneck is Manual Analysis.
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                You spend hours transcribing audio, coding transcripts, and
                finding themes in research notes. This low-level work drains
                your most valuable asset—your time to think, strategize, and
                create.
              </p>
            </div>
            <div className="mt-16">
              <InstantInteractiveDemo />
            </div>
            <div className="mt-20 max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
                <div className="w-full md:w-1/3 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    1. Upload Your Data
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Accepts messy audio files, transcripts, interview notes, and
                    any unstructured text.
                  </p>
                </div>
                <div className="flex-shrink-0 w-full md:w-auto h-8 md:h-auto md:mx-4 flex items-center justify-center">
                  <div className="w-px h-full md:w-20 md:h-px bg-slate-300 dark:bg-slate-600 border-t-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                </div>
                <div className="w-full md:w-1/3 p-6 bg-white dark:bg-slate-900 rounded-xl border-2 border-blue-500 shadow-2xl text-center scale-105">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg mb-4">
                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    2. Run the Crucible
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Our AI pipeline deconstructs, analyzes, and synthesizes key
                    insights, themes, and contradictions.
                  </p>
                </div>
                <div className="flex-shrink-0 w-full md:w-auto h-8 md:h-auto md:mx-4 flex items-center justify-center">
                  <div className="w-px h-full md:w-20 md:h-px bg-slate-300 dark:bg-slate-600 border-t-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                </div>
                <div className="w-full md:w-1/3 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                    <BarChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    3. Get Actionable Output
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Receive structured intelligence you can immediately use in
                    reports and presentations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-8 md:p-12 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Quote className="w-12 h-12 mx-auto mb-6 text-slate-400 dark:text-slate-500" />
              <blockquote className="text-xl md:text-2xl font-medium text-slate-800 dark:text-slate-200">
                &ldquo;This is the force multiplier I've been waiting for. It
                automates 90% of the analytical grunt work, letting me focus
                entirely on strategy and client impact. It doesn't just save
                time—it makes my final output better.&rdquo;
              </blockquote>
              <p className="mt-6 font-semibold text-slate-600 dark:text-slate-400">
                — A Future Top-Tier Management Consultant
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
                An Exclusive Invitation to Our First 100 Partners
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                We're looking for our founding members to partner with. Your
                feedback is the most critical ingredient to building a tool that
                truly solves your problems.
              </p>
              <div className="mt-12 bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-xl transform hover:scale-105 transition-transform">
                <Award className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  The Charter Member Offer
                </h3>
                <p className="text-5xl font-extrabold my-4 text-blue-600 dark:text-blue-400">
                  $15/month{" "}
                  <span className="text-xl font-normal line-through text-slate-400 dark:text-slate-500">
                    $49/month
                  </span>
                </p>
                <ul className="text-lg text-slate-700 dark:text-blue-100 space-y-3 max-w-md mx-auto text-left">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✔</span>
                    <span>
                      <b>Lifetime Pricing.</b> Lock in this discounted rate on
                      the Professional Plan, forever.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✔</span>
                    <span>
                      <b>Shape the Roadmap.</b> Have a genuine voice in our
                      product development and feature priority.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✔</span>
                    <span>
                      <b>Direct Founder Access.</b> Get a direct line to the
                      builder for feedback, ideas, and support.
                    </span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Button
                    href="#waitlist"
                    variant="primary"
                    className="text-lg w-full sm:w-auto"
                  >
                    Secure Your Charter Spot
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
                Built for the Modern Knowledge Professional
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                If you wrestle with large volumes of qualitative data, this is
                for you.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <Briefcase className="w-10 h-10 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold">Management Consultants</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Instantly generate insights, pain points, and opportunities
                  for client presentations and reports. Your ultimate force
                  multiplier.
                </p>
              </div>
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <BookCopy className="w-10 h-10 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold">Academic Researchers</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Drastically accelerate literature reviews and qualitative
                  analysis. Focus on discovery, not manual processing.
                </p>
              </div>
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <Users className="w-10 h-10 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-bold">UX Researchers & PMs</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Distill user interviews into actionable themes, pain points,
                  and feature ideas in minutes, not days.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center gap-8 border border-slate-200 dark:border-slate-700">
              <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
                <span className="text-slate-400 dark:text-slate-500 text-sm">
                  Your Photo
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  A Note from the Founder
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  "I'm not from a big tech company. I'm a builder who has
                  personally felt the pain of spending dozens of hours manually
                  turning rich conversations into sharp, strategic insights. I
                  built Insights Crucible to solve my own problem.
                </p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  My goal is simple: to give you back your time to think. As a
                  Charter Member, you're not just a customer; you're my most
                  valued design partner. Let's build this together."
                </p>
                <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                  — Jimmy, Founder of Insights Crucible
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="waitlist" className="py-20 md:py-32">
          <div className="container px-6 max-w-4xl mx-auto">
            <div className="text-center bg-blue-600 dark:bg-blue-700 p-10 md:p-16 rounded-2xl shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to Join the Crucible?
              </h2>
              <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
                Help us build the tool you&apos;ve always needed. Join the
                waitlist for your chance to become a Charter Member and get
                exclusive lifetime pricing.
              </p>
              <div className="mt-10">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-8 text-center text-slate-500 dark:text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Insights Crucible. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WaitlistLandingPage;
