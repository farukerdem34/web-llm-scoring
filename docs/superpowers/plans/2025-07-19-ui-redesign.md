# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ad-hoc Tailwind utilities with a consistent Blue-Slate design system across all components.

**Architecture:** Update `globals.css` with design tokens, then apply token-based classes to each component. Same layout, better visual consistency.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Geist fonts

## Global Constraints

- Tailwind CSS v4 with `@tailwindcss/postcss` — configure via `app/globals.css` with `@theme inline` blocks, no `tailwind.config.js`
- All components must use `"use client"` — WebLLM requires browser APIs
- Primary color: `blue-600` (#2563eb), hover: `blue-700`
- Neutrals: Slate scale (slate-50 through slate-950)
- Spacing: 4px base unit
- Border radius: `rounded-md` (0.375rem) for buttons/inputs, `rounded-lg` (0.5rem) for cards
- Focus ring: `ring-2 ring-blue-500 ring-offset-2`
- Dark mode: `slate-900` backgrounds, `slate-800` cards, `blue-400` primary

---

### Task 1: Update Design Tokens in globals.css

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: None
- Produces: CSS custom properties used by all components

- [ ] **Step 1: Replace globals.css with design tokens**

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0f172a;

  /* Primary — Blue */
  --blue-50: #eff6ff;
  --blue-100: #dbeafe;
  --blue-200: #bfdbfe;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;

  /* Neutrals — Slate */
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1e293b;
  --slate-900: #0f172a;
  --slate-950: #020617;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;
    --foreground: #f1f5f9;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add Blue-Slate design tokens to globals.css"
```

---

### Task 2: Update Page Layout and Header

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: Design tokens from Task 1
- Produces: Updated page structure with token classes

- [ ] **Step 1: Replace page.tsx content**

```tsx
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
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update page layout with Blue-Slate tokens"
```

---

### Task 3: Update ModelSelector Component

**Files:**
- Modify: `app/components/ModelSelector.tsx`

**Interfaces:**
- Consumes: Design tokens from Task 1
- Produces: Updated model cards with pill toggle and refined styling

- [ ] **Step 1: Replace ModelSelector.tsx content**

```tsx
"use client";

import { MODELS, getModelIds } from "@/app/lib/models";
import { ModelStatus } from "@/app/lib/types";
import { ProgressBar } from "./ProgressBar";

interface ModelSelectorProps {
  selectedModels: string[];
  modelStatus: Record<string, ModelStatus>;
  loadProgress: Record<string, number>;
  onToggle: (modelId: string) => void;
}

export function ModelSelector({
  selectedModels,
  modelStatus,
  loadProgress,
  onToggle,
}: ModelSelectorProps) {
  const modelIds = getModelIds();

  return (
    <div className="flex gap-4 flex-col sm:flex-row">
      {modelIds.map((modelId) => {
        const model = MODELS[modelId];
        if (!model) return null;
        const status = modelStatus[modelId] || "idle";
        const progress = loadProgress[modelId] || 0;
        const isSelected = selectedModels.includes(modelId);

        return (
          <div
            key={modelId}
            className={`flex-1 min-w-[200px] border rounded-lg p-4 transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {model.name}
                </h3>
                <p className="text-sm text-slate-500">{model.params} parameters</p>
              </div>
              <button
                role="switch"
                aria-checked={isSelected}
                aria-label={`Toggle ${model.name}`}
                onClick={() => onToggle(modelId)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isSelected ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isSelected ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="mt-2">
              <StatusBadge status={status} />
            </div>

            {status === "loading" && (
              <div className="mt-3">
                <ProgressBar progress={progress} label="Loading model" />
              </div>
            )}

            {model.description && (
              <p className="mt-2 text-xs text-slate-400">{model.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  const styles: Record<ModelStatus, string> = {
    idle: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
    loading: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    ready: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  const labels: Record<ModelStatus, string> = {
    idle: "Idle",
    loading: "Loading...",
    ready: "Ready",
    error: "Error",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "ready"
            ? "bg-green-500"
            : status === "loading"
              ? "bg-amber-500 animate-pulse"
              : status === "error"
                ? "bg-red-500"
                : "bg-slate-400"
        }`}
      />
      {labels[status]}
    </span>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/components/ModelSelector.tsx
git commit -m "feat: update ModelSelector with pill toggle and Blue-Slate tokens"
```

---

### Task 4: Update PromptInput Component

**Files:**
- Modify: `app/components/PromptInput.tsx`

**Interfaces:**
- Consumes: Design tokens from Task 1
- Produces: Updated prompt input with refined buttons

- [ ] **Step 1: Replace PromptInput.tsx content**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface PromptInputProps {
  isGenerating: boolean;
  hasReadyModel: boolean;
  onGenerate: (prompt: string) => void;
  onClear: () => void;
  onCancel: () => void;
}

const MAX_CHARS = 4096;

export function PromptInput({
  isGenerating,
  hasReadyModel,
  onGenerate,
  onClear,
  onCancel,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (prompt.trim() && hasReadyModel && !isGenerating) {
      onGenerate(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape" && isGenerating) {
      onCancel();
    }
  };

  const isDisabled = !hasReadyModel || isGenerating;
  const isEmpty = prompt.trim().length === 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setPrompt(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={
            hasReadyModel
              ? "Enter your prompt here... (Enter to submit, Shift+Enter for newline)"
              : "Load at least one model to start..."
          }
          className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:disabled:bg-slate-950"
        />
        <div className="absolute bottom-2 right-2 text-xs text-slate-400">
          {prompt.length}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isDisabled || isEmpty}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700 transition-colors"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        {isGenerating && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        )}

        <button
          onClick={() => {
            onClear();
            setPrompt("");
          }}
          disabled={isGenerating}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/components/PromptInput.tsx
git commit -m "feat: update PromptInput with Blue-Slate tokens"
```

---

### Task 5: Update ResponseCard Component

**Files:**
- Modify: `app/components/ResponseCard.tsx`

**Interfaces:**
- Consumes: Design tokens from Task 1
- Produces: Updated response card with refined styling

- [ ] **Step 1: Replace ResponseCard.tsx content**

```tsx
"use client";

import { useState, useEffect } from "react";
import { MODELS } from "@/app/lib/models";
import { GenerationResult } from "@/app/lib/types";

interface ResponseCardProps {
  modelId: string;
  result: GenerationResult;
}

export function ResponseCard({ modelId, result }: ResponseCardProps) {
  const model = MODELS[modelId];
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState("0.0");

  useEffect(() => {
    if (!result.isStreaming) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(((Date.now() - start) / 1000).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [result.isStreaming, result.text]);

  const handleCopy = async () => {
    if (result.text) {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const colorClasses: Record<string, string> = {
    blue: "border-l-4 border-l-blue-500",
    purple: "border-l-4 border-l-slate-400 dark:border-l-slate-500",
  };

  return (
    <div
      className={`flex flex-col border border-slate-200 rounded-lg bg-white dark:border-slate-700 dark:bg-slate-800 ${colorClasses[model?.color] || ""}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
              {model?.name || modelId}
            </h3>
            <span className="text-xs text-slate-500">{model?.params} parameters</span>
          </div>
          {result.text && !result.isStreaming && (
            <button
              onClick={handleCopy}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      </div>

      {/* Response Body */}
      <div className="flex-1 p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        {!result.text && !result.isStreaming && (
          <p className="text-slate-400 text-sm italic">
            Response will appear here...
          </p>
        )}

        {result.isStreaming && result.text === "" && (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Waiting for first token...</span>
          </div>
        )}

        {result.text && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 dark:text-slate-200">
              {result.text}
            </pre>
            {result.isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5" />
            )}
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      {(result.inferenceTime !== null || result.isStreaming) && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-lg">
          <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
            {result.isStreaming ? (
              <>
                <span>
                  ⏱ {elapsed}s
                </span>
                <span className="animate-pulse">Generating...</span>
              </>
            ) : (
              <>
                {result.inferenceTime !== null && (
                  <span>⏱ {(result.inferenceTime / 1000).toFixed(2)}s</span>
                )}
                {result.tokensPerSecond !== null && (
                  <span>🚀 {result.tokensPerSecond.toFixed(1)} t/s</span>
                )}
                {result.tokenCount !== null && (
                  <span>📝 {result.tokenCount} tokens</span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/components/ResponseCard.tsx
git commit -m "feat: update ResponseCard with Blue-Slate tokens"
```

---

### Task 6: Update ComparisonView and ProgressBar

**Files:**
- Modify: `app/components/ComparisonView.tsx`
- Modify: `app/components/ProgressBar.tsx`

**Interfaces:**
- Consumes: Design tokens from Task 1
- Produces: Updated comparison view and progress bar

- [ ] **Step 1: Replace ComparisonView.tsx content**

```tsx
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
          : "grid-cols-1 md:grid-cols-2"
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
```

- [ ] **Step 2: Replace ProgressBar.tsx content**

```tsx
"use client";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/components/ComparisonView.tsx app/components/ProgressBar.tsx
git commit -m "feat: update ComparisonView and ProgressBar with Blue-Slate tokens"
```

---

### Task 7: Final Verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All tasks above
- Produces: Verified build and lint

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: address lint/build issues from UI redesign"
```
