"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWebLLM } from "./hooks/useWebLLM";
import { useConfig } from "./hooks/useConfig";
import { useStats } from "./hooks/useStats";
import { ModelSelector } from "./components/ModelSelector";
import { PromptInput } from "./components/PromptInput";
import { ComparisonView } from "./components/ComparisonView";
import { ConfigSidebar } from "./components/ConfigSidebar";
import { StatsTab } from "./components/StatsTab";
import { useAuth } from "./hooks/useAuth";
import { AuthScreen } from "./components/AuthScreen";
import { HealthIndicator } from "./components/HealthIndicator";

const STORAGE_KEY = "llm-playground-selected-models";

type TabId = "playground" | "stats";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { recordUsage } = useStats();
  const [activeTab, setActiveTab] = useState<TabId>("playground");

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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSelectedModels(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (hasHydratedRef.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedModels));
    }
  }, [selectedModels]);

  const handleGenerate = useCallback((prompt: string) => {
    generate(prompt);
  }, [generate]);

  // Record usage stats after each generation completes
  useEffect(() => {
    if (isGenerating) return;
    if (!results) return;

    // Find any result that just finished
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[var(--terracotta)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-surface)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">ToFile</h1>
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab("playground")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === "playground"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                Playground
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === "stats"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <HealthIndicator />
            <button
              onClick={logout}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "playground" ? (
          <PlaygroundTab
            selectedModels={selectedModels}
            setSelectedModels={setSelectedModels}
            modelStatus={modelStatus}
            loadProgress={loadProgress}
            loadStatus={loadStatus}
            loadModel={loadModel}
            unloadModel={unloadModel}
            generate={handleGenerate}
            isGenerating={isGenerating}
            results={results}
            error={error}
            clearError={clearError}
            config={config}
            updateConfig={updateConfig}
            resetConfig={resetConfig}
            resetSingle={resetSingle}
          />
        ) : (
          <StatsTab />
        )}
      </main>
    </div>
  );
}

// Playground Tab Component
function PlaygroundTab({
  selectedModels,
  setSelectedModels,
  modelStatus,
  loadProgress,
  loadStatus,
  loadModel,
  unloadModel,
  generate,
  isGenerating,
  results,
  error,
  clearError,
  config,
  updateConfig,
  resetConfig,
  resetSingle,
}: any) {
  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <ModelSelector
        selectedModels={selectedModels}
        setSelectedModels={setSelectedModels}
        modelStatus={modelStatus}
        loadProgress={loadProgress}
        loadStatus={loadStatus}
        loadModel={loadModel}
        unloadModel={unloadModel}
      />

      {/* Prompt Input */}
      <PromptInput
        onGenerate={generate}
        isGenerating={isGenerating}
        hasSelectedModels={selectedModels.length > 0}
      />

      {/* Results */}
      <ComparisonView results={results} />

      {/* Settings Sidebar */}
      <ConfigSidebar
        config={config}
        updateConfig={updateConfig}
        resetConfig={resetConfig}
        resetSingle={resetSingle}
      />
    </div>
  );
}

// Health Indicator Component
function HealthIndicator() {
  const [status, setStatus] = useState<"loading" | "healthy" | "error">("loading");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/health");
        if (response.ok) {
          setStatus("healthy");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "healthy"
            ? "bg-green-500"
            : status === "error"
            ? "bg-red-500"
            : "bg-yellow-500"
        }`}
      />
      <span className="text-xs text-[var(--text-secondary)]">
        {status === "healthy" ? "Connected" : status === "error" ? "Disconnected" : "Checking..."}
      </span>
    </div>
  );
}
