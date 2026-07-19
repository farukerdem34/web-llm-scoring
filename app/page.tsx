"use client";

import { useState, useEffect, useRef } from "react";
import { useWebLLM } from "./hooks/useWebLLM";
import { ModelSelector } from "./components/ModelSelector";
import { PromptInput } from "./components/PromptInput";
import { ComparisonView } from "./components/ComparisonView";
import { MODEL_IDS } from "./lib/models";

const STORAGE_KEY = "llm-playground-selected-models";

export default function Home() {
  const {
    engineReady,
    modelStatus,
    loadProgress,
    isGenerating,
    results,
    error,
    loadModel,
    unloadModel,
    generate,
    cancelGeneration,
    clearResults,
    clearError,
  } = useWebLLM();

  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    if (typeof window === "undefined") return MODEL_IDS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MODEL_IDS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedModels));
  }, [selectedModels]);

  const hasReadyModel = selectedModels.some(
    (id) => modelStatus[id] === "ready"
  );

  const handleToggle = (modelId: string) => {
    setSelectedModels((prev) => {
      const isSelected = prev.includes(modelId);
      if (isSelected) {
        if (prev.length === 1) return prev;
        unloadModel(modelId);
        return prev.filter((id) => id !== modelId);
      } else {
        loadModel(modelId);
        return [...prev, modelId];
      }
    });
  };

  const autoLoadRequestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (engineReady) {
      for (const modelId of selectedModels) {
        if (
          modelStatus[modelId] === "idle" &&
          !autoLoadRequestedRef.current.has(modelId)
        ) {
          autoLoadRequestedRef.current.add(modelId);
          loadModel(modelId);
        }
      }
    }
  }, [engineReady, loadModel, modelStatus, selectedModels]);

  const handleGenerate = (prompt: string) => {
    generate(prompt, selectedModels);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            LLM Playground
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Compare Gemma models side-by-side with browser-based inference
          </p>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* WebGPU Warning */}
        {!engineReady && !error && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Initializing WebGPU engine... This may take a moment.
            </p>
          </div>
        )}

        {/* Model Selector */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Select Models
          </h2>
          <ModelSelector
            selectedModels={selectedModels}
            modelStatus={modelStatus}
            loadProgress={loadProgress}
            onToggle={handleToggle}
          />
        </section>

        {/* Prompt Input */}
        <section className="mb-6">
          <PromptInput
            isGenerating={isGenerating}
            hasReadyModel={hasReadyModel}
            onGenerate={handleGenerate}
            onClear={clearResults}
            onCancel={cancelGeneration}
          />
        </section>

        {/* Comparison View */}
        <section>
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Responses
          </h2>
          <ComparisonView selectedModels={selectedModels} results={results} />
        </section>
      </div>
    </div>
  );
}
