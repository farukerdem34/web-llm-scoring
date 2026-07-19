"use client";

import { useState, useEffect } from "react";
import { useWebLLM } from "./hooks/useWebLLM";
import { ModelSelector } from "./components/ModelSelector";
import { PromptInput } from "./components/PromptInput";
import { ComparisonView } from "./components/ComparisonView";

const STORAGE_KEY = "llm-playground-selected-model";

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

  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedModel(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem(STORAGE_KEY, selectedModel);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedModel]);

  const hasReadyModel = selectedModel !== null && modelStatus[selectedModel] === "ready";

  const handleToggle = (modelId: string) => {
    if (modelId === selectedModel) {
      unloadModel();
      setSelectedModel(null);
    } else {
      setSelectedModel(modelId);
      loadModel(modelId);
    }
  };

  const handleGenerate = (prompt: string) => {
    if (selectedModel) {
      generate(prompt, [selectedModel]);
    }
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
            Select Model
          </h2>
          <ModelSelector
            selectedModel={selectedModel}
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
            Response
          </h2>
          <ComparisonView selectedModel={selectedModel} results={results} />
        </section>
      </div>
    </div>
  );
}
