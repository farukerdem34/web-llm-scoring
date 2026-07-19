"use client";

import { GenerationResult } from "@/app/lib/types";
import { ResponseCard } from "./ResponseCard";

interface ComparisonViewProps {
  selectedModel: string | null;
  results: Record<string, GenerationResult>;
}

export function ComparisonView({
  selectedModel,
  results,
}: ComparisonViewProps) {
  if (!selectedModel) {
    return (
      <div className="text-center py-12 text-slate-400">
        Select a model to see its response
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1">
      <ResponseCard
        modelId={selectedModel}
        result={results[selectedModel] || createEmptyResult()}
      />
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
