"use client";

import { useState, useEffect, useRef } from "react";
import { useWebLLM } from "./hooks/useWebLLM";
import { useConfig } from "./hooks/useConfig";
import { ModelSelector } from "./components/ModelSelector";
import { PromptInput } from "./components/PromptInput";
import { ComparisonView } from "./components/ComparisonView";
import { ConfigSidebar } from "./components/ConfigSidebar";
import { useAuth } from "./hooks/useAuth";
import { AuthScreen } from "./components/AuthScreen";
import { HealthIndicator } from "./components/HealthIndicator";

const STORAGE_KEY = "llm-playground-selected-models";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const {
    engineReady,
    modelStatus,
    loadProgress,
    loadStatus,
    isGenerating,
    results,
    error,
    gpuVendor,
    gpuMaxBufferSize,
    loadModel,
    unloadModel,
    generate,
    cancelGeneration,
    clearResults,
    clearError,
  } = useWebLLM();

  const {
    config,
    updateConfig,
    resetConfig,
    resetSingle,
  } = useConfig();

  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const hasHydratedRef = useRef(false);
  const pendingModelsRef = useRef<string[]>([]);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          pendingModelsRef.current = parsed;
        }
      }
    } catch {}
  }, []);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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
    if (hasHydratedRef.current && pendingModelsRef.current.length > 0) {
      setSelectedModels(pendingModelsRef.current);
      pendingModelsRef.current = [];
    }

    if (engineReady && hasHydratedRef.current) {
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
    generate(prompt, selectedModels, config);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sand-50)]">
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[var(--sand-50)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="border-b border-[var(--sand-200)] pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
                LLM Playground
              </h1>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Compare models side-by-side with browser-based inference
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HealthIndicator />
              <button
                onClick={() => setIsConfigOpen(true)}
                className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)] rounded-lg transition-colors cursor-pointer"
                aria-label="Open inference settings"
                title="Inference Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)] rounded-lg transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-[var(--terracotta-light)] border border-[var(--terracotta)]/20 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--terracotta-dark)]">{error}</p>
              <button
                onClick={clearError}
                className="text-[var(--terracotta)] hover:text-[var(--terracotta-dark)] cursor-pointer"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* WebGPU Banner */}
        {!engineReady && !error && (
          <div className="mb-4 p-4 bg-[var(--terracotta-light)] border border-[var(--color-warning)]/20 rounded-lg">
            <p className="text-sm text-[var(--color-warning)]">
              Initializing WebGPU engine... This may take a moment.
            </p>
          </div>
        )}

        {/* GPU Diagnostics */}
        {engineReady && (
          <div className="mb-4 flex items-center gap-3 text-xs text-[var(--ink-faint)]">
            {gpuVendor && <span>GPU: {gpuVendor}</span>}
            {gpuMaxBufferSize != null && (
              <span
                className={
                  gpuMaxBufferSize < 1_073_741_824
                    ? "text-[var(--color-warning)]"
                    : undefined
                }
              >
                Buffer: {(gpuMaxBufferSize / 1_073_741_824).toFixed(1)} GB
              </span>
            )}
          </div>
        )}

        {/* Model Selector */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-[var(--ink)] mb-3">
            Select Models
          </h2>
          <ModelSelector
            selectedModels={selectedModels}
            modelStatus={modelStatus}
            loadProgress={loadProgress}
            loadStatus={loadStatus}
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
          <h2 className="text-sm font-medium text-[var(--ink)] mb-3">
            Responses
          </h2>
          <ComparisonView selectedModels={selectedModels} results={results} />
        </section>
      </div>

      {/* Config Sidebar */}
      <ConfigSidebar
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onUpdate={updateConfig}
        onReset={resetConfig}
        onResetSingle={resetSingle}
      />
    </div>
  );
}
