"use client";

import { GenerationResult } from "@/app/lib/types";
import { ResponseCard } from "./ResponseCard";

interface ComparisonViewProps {
  selectedModels: string[];
  results: Record<string, GenerationResult>;
}

export function ComparisonView({
  selectedModels,
  results,
}: ComparisonViewProps) {
  if (selectedModels.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        Select at least one model to see responses
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${
        selectedModels.length === 1
          ? "grid-cols-1"
          : selectedModels.length <= 2
            ? "grid-cols-1 md:grid-cols-2"
            : selectedModels.length <= 4
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      }`}
    >
      {selectedModels.map((modelId) => (
        <ResponseCard
          key={modelId}
          modelId={modelId}
          result={results[modelId] || createEmptyResult()}
        />
      ))}
    </div>
  );
}

function createEmptyResult(): GenerationResult {
  return {
    text: "",
    firstTokenTime: null,
    inferenceTime: null,
    tokenCount: null,
    tokensPerSecond: null,
    isStreaming: false,
  };
}
