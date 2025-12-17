import React from "react";

interface EntitiesTabProps {
  entities: Array<{
    name: string;
    explanation: string;
  }>;
}

export const EntitiesTab: React.FC<EntitiesTabProps> = ({ entities }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
          Key Concepts
        </h2>
        <p className="text-zinc-500 mt-1">
          Core topics extracted from the analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {entities.map((entity, index) => (
          <div
            key={index}
            className="group bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm hover:border-zinc-300 transition-colors flex flex-col md:flex-row md:items-baseline gap-4"
          >
            <div className="md:w-1/4 flex-shrink-0">
              <span className="inline-block text-zinc-900 font-semibold text-base border-b-2 border-zinc-100 pb-1 group-hover:border-zinc-900 transition-colors">
                {entity.name}
              </span>
            </div>
            <div className="md:w-3/4">
              <p className="text-zinc-600 leading-relaxed text-sm md:text-base">
                {entity.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
