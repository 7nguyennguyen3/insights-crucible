"use client";

import React, { useState } from "react";
import { ShowNotes, Entity } from "@/types/analysis";
import { OverviewTab } from "./OverviewTab";
import { SocialTab } from "./SocialTab";
import { TitlesTab } from "./TitlesTab";
import { QuotesTab } from "./QuotesTab";
import { EntitiesTab } from "./EntitiesTab";
import { FileText, Share2, Type, Quote, Lightbulb } from "lucide-react";

export type TabId = "overview" | "social" | "titles" | "quotes" | "entities";

interface PodcasterAnalysisViewProps {
  showNotes: ShowNotes;
  sectionAnalyses?: any[]; // Array of section analyses with entities
}

export const PodcasterAnalysisView: React.FC<PodcasterAnalysisViewProps> = ({
  showNotes,
  sectionAnalyses = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Extract entities from section analyses
  const entities: Entity[] = React.useMemo(() => {
    if (!sectionAnalyses || sectionAnalyses.length === 0) return [];

    const allEntities: Entity[] = [];
    const seenNames = new Set<string>();

    sectionAnalyses.forEach((section) => {
      if (section.entities && Array.isArray(section.entities)) {
        section.entities.forEach((entity: Entity) => {
          // Deduplicate entities by name
          if (!seenNames.has(entity.name)) {
            seenNames.add(entity.name);
            allEntities.push(entity);
          }
        });
      }
    });

    return allEntities;
  }, [sectionAnalyses]);

  // Build tabs array, only include entities tab if there are entities
  const tabs: { id: TabId; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <FileText size={18} />,
      description: "Summary & timeline"
    },
    {
      id: "social",
      label: "Social Media",
      icon: <Share2 size={18} />,
      description: "Platform content"
    },
    {
      id: "titles",
      label: "Title Variations",
      icon: <Type size={18} />,
      description: "Episode titles"
    },
    {
      id: "quotes",
      label: "Quotes",
      icon: <Quote size={18} />,
      description: "Notable moments"
    },
  ];

  // Only add entities tab if there are entities
  if (entities.length > 0) {
    tabs.push({
      id: "entities",
      label: "Key Concepts",
      icon: <Lightbulb size={18} />,
      description: `${entities.length} concepts`
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-6 space-y-1">
          <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-3">
            Sections
          </h3>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                    ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }
                  `}
                >
                  <span className={`mt-0.5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`}>
                    {tab.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-75 mt-0.5">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {activeTab === "overview" && <OverviewTab showNotes={showNotes} />}
        {activeTab === "social" && <SocialTab socialContent={showNotes.social_content} />}
        {activeTab === "titles" && <TitlesTab titleVariations={showNotes.title_variations} />}
        {activeTab === "quotes" && <QuotesTab quotes={showNotes.notable_quotes} />}
        {activeTab === "entities" && <EntitiesTab entities={entities} />}
      </main>
    </div>
  );
};
