"use client";

import { useState, useEffect, useRef } from "react";
import { useWebLLM } from "./hooks/useWebLLM";
import { useConfig } from "./hooks/useConfig";
import { ModelSelector } from "./components/ModelSelector";
import { PromptInput } from "./components/PromptInput";
import { ComparisonView } from "./components/ComparisonView";
import { ConfigSidebar } from "./components/ConfigSidebar";
import { SystemPromptInput } from "./components/SystemPromptInput";
import { useAuth } from "./hooks/useAuth";
import { AuthScreen } from "./components/AuthScreen";
import { HealthIndicator } from "./components/HealthIndicator";
import { StatsTab } from "./components/StatsTab";
import { useStats } from "./hooks/useStats";
import { useScoring } from "./hooks/useScoring";
import { MODELS } from "./lib/models";

const STORAGE_KEY = "llm-playground-selected-models";
const THEME_KEY = "llm-playground-theme";

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
    getEngine,
    setResults,
  } = useWebLLM();

  const {
    config,
    updateConfig,
    resetConfig,
    resetSingle,
  } = useConfig();

  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"playground" | "stats">("playground");
  const { recordUsage } = useStats();
  const {
    evaluationResult,
    isScoring,
    scoringError,
    judgeModelId,
    setJudgeModel,
    evaluateAll,
    clearScores,
    clearScoringError,
  } = useScoring();
  const hasHydratedRef = useRef(false);
  const pendingModelsRef = useRef<string[]>([]);

  // Dark mode state — lazy initializer reads localStorage / system preference
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") return stored === "dark";
    } catch {}
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const hasHydratedTheme = useRef(false);

  // Apply dark class to <html> and persist
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    if (hasHydratedTheme.current) {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    }
    hasHydratedTheme.current = true;
  }, [dark]);

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

  const hasResponses = Object.values(results).some(
    (r) => r.text && !r.isStreaming
  );

  useEffect(() => {
    if (judgeModelId && modelStatus[judgeModelId] === "ready") return;

    const readyModels = selectedModels.filter(
      (id) => modelStatus[id] === "ready"
    );
    if (readyModels.length === 0) return;

    const largestReady = readyModels.reduce((best, id) => {
      const bestConfig = MODELS[best];
      const idConfig = MODELS[id];
      const bestParams = parseFloat(bestConfig?.params || "0");
      const idParams = parseFloat(idConfig?.params || "0");
      return idParams > bestParams ? id : best;
    }, readyModels[0]);

    setJudgeModel(largestReady);
  }, [selectedModels, modelStatus, judgeModelId, setJudgeModel]);

  const handleClear = () => {
    clearResults();
    clearScores();
  };

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

  const lastPromptRef = useRef("");

  const handleGenerate = (prompt: string) => {
    lastPromptRef.current = prompt;
    clearScores();
    generate(prompt, selectedModels, config);
  };

  const handleEvaluate = async () => {
    const judgeEngine = getEngine(judgeModelId);
    if (!judgeEngine) return;
    await evaluateAll(
      lastPromptRef.current,
      config.system_prompt,
      results,
      judgeEngine
    );
  };

  useEffect(() => {
    if (!evaluationResult) {
      setResults((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key].scores) {
            next[key] = { ...next[key], scores: undefined };
          }
        }
        return next;
      });
      return;
    }
    setResults((prev) => {
      const next = { ...prev };
      for (const score of evaluationResult.scores) {
        if (next[score.modelId]) {
          next[score.modelId] = { ...next[score.modelId], scores: score };
        }
      }
      return next;
    });
  }, [evaluationResult, setResults]);

  // Record usage stats after generation completes
  useEffect(() => {
    if (isGenerating || !results) return;
    for (const [modelId, result] of Object.entries(results)) {
      if (result && !result.isStreaming && result.inferenceTime !== null) {
        recordUsage({
          model_id: modelId,
          token_count: result.tokenCount || 0,
          first_token_time_ms: result.firstTokenTime || null,
          inference_time_ms: result.inferenceTime,
          tokens_per_second: result.tokensPerSecond || null,
        });
      }
    }
  }, [results, isGenerating, recordUsage]);

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
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--sand-50)]/80 backdrop-blur-md border-b border-[var(--sand-200)] shadow-[var(--shadow-sm)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo — left */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--terracotta)] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              LLM Playground
            </h1>
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab("playground")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                activeTab === "playground"
                  ? "bg-[var(--terracotta)] text-white"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)]"
              }`}
            >
              Playground
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                activeTab === "stats"
                  ? "bg-[var(--terracotta)] text-white"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)]"
              }`}
            >
              Statistics
            </button>
          </nav>

          {/* Actions — right */}
          <div className="flex items-center gap-2">
            <HealthIndicator />

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)] rounded-lg transition-colors cursor-pointer"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)] rounded-lg transition-colors cursor-pointer"
              aria-label="Open inference settings"
              title="Inference Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)] rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page content — offset for fixed header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {activeTab === "playground" ? (
          <>
            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-4 bg-[var(--terracotta-light)] border border-[var(--terracotta)]/20 rounded-xl error-banner">
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

            {scoringError && (
              <div className="mb-4 p-4 bg-[var(--terracotta-light)] border border-[var(--terracotta)]/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--terracotta-dark)]">
                    {scoringError}
                  </p>
                  <button
                    onClick={clearScoringError}
                    className="text-[var(--terracotta)] hover:text-[var(--terracotta-dark)] cursor-pointer"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* WebGPU Banner */}
            {!engineReady && !error && (
              <div className="mb-4 p-4 bg-[var(--terracotta-light)] border border-[var(--color-warning)]/20 rounded-xl">
                <p className="text-sm text-[var(--color-warning)]">
                  Initializing WebGPU engine... This may take a moment.
                </p>
              </div>
            )}

            {/* GPU Diagnostics */}
            {engineReady && (
              <div className="mb-4 flex items-center gap-3 text-xs text-[var(--ink-faint)] stagger-child">
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
            <section className="mb-6 stagger-child">
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

            {/* System Prompt */}
            <section className="mb-4 stagger-child">
              <SystemPromptInput
                value={config.system_prompt}
                onChange={(v) => updateConfig("system_prompt", v)}
                disabled={isGenerating}
              />
            </section>

            {/* Prompt Input */}
            <section className="mb-6 stagger-child">
              <PromptInput
                isGenerating={isGenerating}
                hasReadyModel={hasReadyModel}
                hasResponses={hasResponses}
                isScoring={isScoring}
                judgeModelId={judgeModelId}
                modelStatus={modelStatus}
                onGenerate={handleGenerate}
                onClear={handleClear}
                onCancel={cancelGeneration}
                onEvaluate={handleEvaluate}
                onSetJudgeModel={setJudgeModel}
              />
            </section>

            {/* Comparison View */}
            <section className="stagger-child">
              <h2 className="text-sm font-medium text-[var(--ink)] mb-3">
                Responses
              </h2>
              <ComparisonView selectedModels={selectedModels} results={results} />
            </section>
          </>
        ) : (
          <StatsTab />
        )}
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
