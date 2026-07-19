# LLM Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based Gemma model comparison playground using WebLLM with side-by-side streaming responses and performance metrics.

**Architecture:** Single `WebWorkerMLCEngine` manages both Gemma 2B and 9B models. A custom `useWebLLM` hook wraps the engine for React. Components render model cards, prompt input, and streaming response comparisons.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, `@mlc-ai/web-llm`, TypeScript

## Global Constraints

- Next.js 16.3.0-canary.89, React 19.2.7, Tailwind CSS v4
- All UI components are `"use client"` (WebLLM requires browser APIs)
- Model IDs: `gemma-2-2b-it-q4f32_1-MLC` and `gemma-2-9b-it-q4f32_1-MLC`
- Worker reference: `new Worker(new URL("./webllm-worker.ts", import.meta.url), { type: "module" })`
- No component library — pure Tailwind CSS v4
- No backend — all inference client-side via WebGPU

---

### Task 1: Types & Model Registry

**Files:**
- Create: `app/lib/types.ts`
- Create: `app/lib/models.ts`

**Interfaces:**
- Produces: `ModelStatus`, `GenerationResult`, `ModelConfig` types
- Produces: `MODELS` constant, `getModelConfig()` helper

- [ ] **Step 1: Create types.ts**

```typescript
// app/lib/types.ts
export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface ModelConfig {
  id: string;
  name: string;
  params: string;
  description: string;
  color: string; // Tailwind color class for visual identity
  defaultParams: {
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
}

export interface GenerationResult {
  text: string;
  firstTokenTime: number | null;
  inferenceTime: number | null;
  tokenCount: number | null;
  tokensPerSecond: number | null;
  isStreaming: boolean;
}

export interface AppState {
  selectedModels: string[];
  modelStatus: Record<string, ModelStatus>;
  loadProgress: Record<string, number>;
  isGenerating: boolean;
  results: Record<string, GenerationResult>;
  error: string | null;
}
```

- [ ] **Step 2: Create models.ts**

```typescript
// app/lib/models.ts
import { ModelConfig } from "./types";

export const MODELS: Record<string, ModelConfig> = {
  "gemma-2-2b-it-q4f32_1-MLC": {
    id: "gemma-2-2b-it-q4f32_1-MLC",
    name: "Gemma 2B",
    params: "2B",
    description: "Fast, lightweight",
    color: "blue",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
  },
  "gemma-2-9b-it-q4f32_1-MLC": {
    id: "gemma-2-9b-it-q4f32_1-MLC",
    name: "Gemma 9B",
    params: "9B",
    description: "Balanced quality",
    color: "purple",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
  },
};

export const MODEL_IDS = Object.keys(MODELS);

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODELS[modelId];
}

export function getModelIds(): string[] {
  return MODEL_IDS;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/lib/types.ts app/lib/models.ts
git commit -m "feat: add TypeScript types and Gemma model registry"
```

---

### Task 2: Web Worker Setup

**Files:**
- Create: `app/lib/webllm-worker.ts`

**Interfaces:**
- Produces: Web Worker entry point for WebLLM engine

- [ ] **Step 1: Create webllm-worker.ts**

```typescript
// app/lib/webllm-worker.ts
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();
// Handler automatically listens for messages from main thread
// via CreateWebWorkerMLCEngine()
```

- [ ] **Step 2: Commit**

```bash
git add app/lib/webllm-worker.ts
git commit -m "feat: add Web Worker entry point for WebLLM engine"
```

---

### Task 3: useWebLLM Hook — Engine Init & Model Loading

**Files:**
- Create: `app/hooks/useWebLLM.ts`

**Interfaces:**
- Consumes: `MODELS`, `MODEL_IDS` from `app/lib/models.ts`
- Consumes: `ModelStatus`, `GenerationResult` from `app/lib/types.ts`
- Produces: `useWebLLM()` hook with `engineReady`, `modelStatus`, `loadProgress`, `loadModel`, `unloadModel`

- [ ] **Step 1: Create useWebLLM.ts with engine initialization**

```typescript
// app/hooks/useWebLLM.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as webllm from "@mlc-ai/web-llm";
import { MODEL_IDS, MODELS } from "@/app/lib/models";
import { ModelStatus, GenerationResult } from "@/app/lib/types";

export function useWebLLM() {
  const engineRef = useRef<webllm.WebWorkerMLCEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [modelStatus, setModelStatus] = useState<Record<string, ModelStatus>>(
    () => Object.fromEntries(MODEL_IDS.map((id) => [id, "idle"]))
  );
  const [loadProgress, setLoadProgress] = useState<Record<string, number>>(
    () => Object.fromEntries(MODEL_IDS.map((id) => [id, 0]))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, GenerationResult>>(
    () => Object.fromEntries(MODEL_IDS.map((id) => [id, createEmptyResult()]))
  );
  const [error, setError] = useState<string | null>(null);

  // Initialize engine on mount
  useEffect(() => {
    const initEngine = async () => {
      try {
        const engine = await webllm.CreateWebWorkerMLCEngine(
          new Worker(
            new URL("../lib/webllm-worker.ts", import.meta.url),
            { type: "module" }
          ),
          MODEL_IDS,
          {
            initProgressCallback: (report: webllm.InitProgressReport) => {
              // Engine-level init progress (not model-specific)
            },
          }
        );
        engineRef.current = engine;
        setEngineReady(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize engine"
        );
      }
    };
    initEngine();
  }, []);

  const loadModel = useCallback(
    async (modelId: string) => {
      if (!engineRef.current) return;
      setModelStatus((prev) => ({ ...prev, [modelId]: "loading" }));
      try {
        await engineRef.current.loadModel(modelId, {
          progressCallback: (report: webllm.LoadProgressReport) => {
            setLoadProgress((prev) => ({
              ...prev,
              [modelId]: Math.round(report.progress * 100),
            }));
          },
        });
        setModelStatus((prev) => ({ ...prev, [modelId]: "ready" }));
      } catch (err) {
        setModelStatus((prev) => ({ ...prev, [modelId]: "error" }));
        setError(
          err instanceof Error
            ? `Failed to load ${MODELS[modelId]?.name}: ${err.message}`
            : `Failed to load model`
        );
      }
    },
    []
  );

  const unloadModel = useCallback(
    async (modelId: string) => {
      if (!engineRef.current) return;
      try {
        await engineRef.current.unloadModel(modelId);
        setModelStatus((prev) => ({ ...prev, [modelId]: "idle" }));
        setLoadProgress((prev) => ({ ...prev, [modelId]: 0 }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to unload model"
        );
      }
    },
    []
  );

  return {
    engineReady,
    modelStatus,
    loadProgress,
    isGenerating,
    results,
    error,
    loadModel,
    unloadModel,
    clearError: () => setError(null),
  };
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

- [ ] **Step 2: Commit**

```bash
git add app/hooks/useWebLLM.ts
git commit -m "feat: add useWebLLM hook with engine init and model loading"
```

---

### Task 4: useWebLLM Hook — Generation & Streaming

**Files:**
- Modify: `app/hooks/useWebLLM.ts`

**Interfaces:**
- Consumes: WebWorkerMLCEngine from Task 3
- Produces: `generate()`, `cancelGeneration()`, `clearResults()` methods

- [ ] **Step 1: Add generate method to useWebLLM**

Append to the hook (after `unloadModel`):

```typescript
  const cancelGenerationRef = useRef(false);

  const generate = useCallback(
    async (prompt: string, modelIds: string[]) => {
      if (!engineRef.current || modelIds.length === 0 || !prompt.trim()) return;

      setIsGenerating(true);
      cancelGenerationRef.current = false;
      setError(null);

      // Reset results for selected models
      setResults((prev) => {
        const next = { ...prev };
        for (const id of modelIds) {
          next[id] = createEmptyResult();
        }
        return next;
      });

      // Mark models as streaming
      setResults((prev) => {
        const next = { ...prev };
        for (const id of modelIds) {
          next[id] = { ...next[id], isStreaming: true };
        }
        return next;
      });

      const engine = engineRef.current;

      const runModel = async (modelId: string) => {
        const request: webllm.ChatCompletionRequest = {
          stream: true,
          stream_options: { include_usage: true },
          messages: [{ role: "user", content: prompt }],
          model: modelId,
          max_tokens: MODELS[modelId]?.defaultParams.max_tokens ?? 200,
          temperature: MODELS[modelId]?.defaultParams.temperature ?? 0.7,
          top_p: MODELS[modelId]?.defaultParams.top_p ?? 0.9,
        };

        const startTime = Date.now();
        let firstTokenCaptured = false;

        try {
          const stream = await engine.chat.completions.create(request);

          for await (const chunk of stream) {
            if (cancelGenerationRef.current) break;

            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              if (!firstTokenCaptured) {
                firstTokenCaptured = true;
                setResults((prev) => ({
                  ...prev,
                  [modelId]: {
                    ...prev[modelId],
                    firstTokenTime: Date.now() - startTime,
                  },
                }));
              }

              setResults((prev) => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  text: prev[modelId].text + content,
                },
              }));
            }

            // Final chunk has usage data
            if (chunk.usage) {
              const inferenceTime = Date.now() - startTime;
              const tokenCount = chunk.usage.completion_tokens;
              setResults((prev) => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  inferenceTime,
                  tokenCount,
                  tokensPerSecond: tokenCount / (inferenceTime / 1000),
                  isStreaming: false,
                },
              }));
            }
          }
        } catch (err) {
          setResults((prev) => ({
            ...prev,
            [modelId]: {
              ...prev[modelId],
              text: `Error: ${err instanceof Error ? err.message : "Generation failed"}`,
              isStreaming: false,
            },
          }));
        }
      };

      // Run all models concurrently
      await Promise.all(modelIds.map(runModel));
      setIsGenerating(false);
    },
    []
  );

  const cancelGeneration = useCallback(() => {
    cancelGenerationRef.current = true;
    if (engineRef.current) {
      // Interrupt all active generations
      for (const modelId of MODEL_IDS) {
        engineRef.current.interruptGenerate();
      }
    }
    setIsGenerating(false);
    setResults((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key].isStreaming) {
          next[key] = { ...next[key], isStreaming: false };
        }
      }
      return next;
    });
  }, []);

  const clearResults = useCallback(() => {
    setResults((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = createEmptyResult();
      }
      return next;
    });
  }, []);
```

- [ ] **Step 2: Update the return statement to include new methods**

```typescript
  return {
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
    clearError: () => setError(null),
  };
```

- [ ] **Step 3: Commit**

```bash
git add app/hooks/useWebLLM.ts
git commit -m "feat: add generation, streaming, and cancellation to useWebLLM"
```

---

### Task 5: ProgressBar Component

**Files:**
- Create: `app/components/ProgressBar.tsx`

**Interfaces:**
- Consumes: `progress: number` (0-100), optional `label: string`
- Produces: Thin progress bar with percentage

- [ ] **Step 1: Create ProgressBar.tsx**

```tsx
// app/components/ProgressBar.tsx
"use client";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-700">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ProgressBar.tsx
git commit -m "feat: add ProgressBar component"
```

---

### Task 6: ModelSelector Component

**Files:**
- Create: `app/components/ModelSelector.tsx`

**Interfaces:**
- Consumes: `modelStatus`, `loadProgress`, `loadModel`, `unloadModel` from useWebLLM
- Consumes: `selectedModels`, `onToggle` from parent
- Produces: Horizontal card row with toggle checkboxes

- [ ] **Step 1: Create ModelSelector.tsx**

```tsx
// app/components/ModelSelector.tsx
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
    <div className="flex gap-4 flex-wrap">
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
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {model.name}
                </h3>
                <p className="text-sm text-zinc-500">{model.params} parameters</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(modelId)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
              </label>
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
              <p className="mt-2 text-xs text-zinc-400">{model.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  const styles: Record<ModelStatus, string> = {
    idle: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    loading: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
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
              ? "bg-yellow-500 animate-pulse"
              : status === "error"
                ? "bg-red-500"
                : "bg-zinc-400"
        }`}
      />
      {labels[status]}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/ModelSelector.tsx
git commit -m "feat: add ModelSelector component with toggles and status"
```

---

### Task 7: PromptInput Component

**Files:**
- Create: `app/components/PromptInput.tsx`

**Interfaces:**
- Consumes: `isGenerating: boolean`, `hasReadyModel: boolean`
- Produces: `onGenerate(prompt: string)`, `onClear()`, `onCancel()`

- [ ] **Step 1: Create PromptInput.tsx**

```tsx
// app/components/PromptInput.tsx
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

  // Auto-focus on mount
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
          className="w-full h-32 p-4 border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500 dark:disabled:bg-zinc-950"
        />
        <div className="absolute bottom-2 right-2 text-xs text-zinc-400">
          {prompt.length}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isDisabled || isEmpty}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed dark:disabled:bg-zinc-700"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        {isGenerating && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
          className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/PromptInput.tsx
git commit -m "feat: add PromptInput component with keyboard shortcuts"
```

---

### Task 8: ResponseCard Component

**Files:**
- Create: `app/components/ResponseCard.tsx`

**Interfaces:**
- Consumes: `modelId: string`, `result: GenerationResult`
- Produces: Streaming response display with metrics and copy button

- [ ] **Step 1: Create ResponseCard.tsx**

```tsx
// app/components/ResponseCard.tsx
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
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer during streaming
  useEffect(() => {
    if (!result.isStreaming) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(((Date.now() - start) / 1000).toFixed(1) as unknown as number);
    }, 100);
    return () => clearInterval(interval);
  }, [result.isStreaming, result.text]);

  // Reset elapsed when new generation starts
  useEffect(() => {
    if (result.isStreaming && result.text === "") {
      setElapsed(0);
    }
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
    purple: "border-l-4 border-l-purple-500",
  };

  return (
    <div
      className={`flex flex-col border border-zinc-200 rounded-lg bg-white dark:border-zinc-700 dark:bg-zinc-900 ${colorClasses[model?.color] || ""}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {model?.name || modelId}
            </h3>
            <span className="text-xs text-zinc-500">{model?.params} parameters</span>
          </div>
          {result.text && !result.isStreaming && (
            <button
              onClick={handleCopy}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      </div>

      {/* Response Body */}
      <div className="flex-1 p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        {!result.text && !result.isStreaming && (
          <p className="text-zinc-400 text-sm italic">
            Response will appear here...
          </p>
        )}

        {result.isStreaming && result.text === "" && (
          <div className="flex items-center gap-2 text-zinc-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Waiting for first token...</span>
          </div>
        )}

        {result.text && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-800 dark:text-zinc-200">
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
        <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-b-lg">
          <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
            {result.isStreaming ? (
              <>
                <span>
                  ⏱ {typeof elapsed === "number" ? elapsed.toFixed(1) : elapsed}s
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

- [ ] **Step 2: Commit**

```bash
git add app/components/ResponseCard.tsx
git commit -m "feat: add ResponseCard component with streaming and metrics"
```

---

### Task 9: ComparisonView Component

**Files:**
- Create: `app/components/ComparisonView.tsx`

**Interfaces:**
- Consumes: `selectedModels: string[]`, `results: Record<string, GenerationResult>`
- Produces: Responsive grid of ResponseCards

- [ ] **Step 1: Create ComparisonView.tsx**

```tsx
// app/components/ComparisonView.tsx
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
      <div className="text-center py-12 text-zinc-400">
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

- [ ] **Step 2: Commit**

```bash
git add app/components/ComparisonView.tsx
git commit -m "feat: add ComparisonView component with responsive grid"
```

---

### Task 10: Main Page Integration

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: All components from Tasks 5-9
- Consumes: `useWebLLM` hook from Task 3-4
- Produces: Complete playground UI

- [ ] **Step 1: Update layout.tsx metadata**

```tsx
// app/layout.tsx — replace metadata export
export const metadata: Metadata = {
  title: "LLM Playground - Gemma Model Comparison",
  description:
    "Compare Gemma 2B and 9B models side-by-side with browser-based inference using WebLLM",
};
```

- [ ] **Step 2: Rewrite page.tsx**

```tsx
// app/page.tsx
"use client";

import { useState, useEffect } from "react";
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

  // Load selected models from localStorage
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

  // Persist selected models
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
        // Don't allow deselecting all
        if (prev.length === 1) return prev;
        unloadModel(modelId);
        return prev.filter((id) => id !== modelId);
      } else {
        loadModel(modelId);
        return [...prev, modelId];
      }
    });
  };

  // Load models on initial mount
  useEffect(() => {
    if (engineReady) {
      for (const modelId of selectedModels) {
        if (modelStatus[modelId] === "idle") {
          loadModel(modelId);
        }
      }
    }
  }, [engineReady]);

  const handleGenerate = (prompt: string) => {
    generate(prompt, selectedModels);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            LLM Playground
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
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
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* WebGPU Warning */}
        {!engineReady && !error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Initializing WebGPU engine... This may take a moment.
            </p>
          </div>
        )}

        {/* Model Selector */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
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
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Responses
          </h2>
          <ComparisonView selectedModels={selectedModels} results={results} />
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: integrate all components into main playground page"
```

---

### Task 11: Install Dependencies & Verify Build

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: All previous tasks
- Produces: Working build

- [ ] **Step 1: Install web-llm**

```bash
npm install @mlc-ai/web-llm
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected: Build succeeds (may have warnings about client components, which is fine)

- [ ] **Step 3: Run dev server and test manually**

```bash
npm run dev
```

Open http://localhost:3000 and verify:
- Page loads with "LLM Playground" header
- Model cards appear for Gemma 2B and 9B
- Models start loading (progress bars visible)
- After loading, prompt input becomes active
- Enter a prompt and click Generate
- Streaming responses appear in cards
- Metrics show after completion
- Copy button works
- Clear button resets responses

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues from integration"
```

---

### Task 12: ESLint & Final Polish

**Files:**
- Various files as needed

**Interfaces:**
- Consumes: All previous tasks
- Produces: Clean, lint-free codebase

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

- [ ] **Step 2: Fix any lint errors**

Fix any reported issues.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: fix lint issues and final polish"
```

---

## Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Types & Model Registry | None |
| 2 | Web Worker Setup | None |
| 3 | useWebLLM Hook — Init & Loading | Tasks 1, 2 |
| 4 | useWebLLM Hook — Generation | Task 3 |
| 5 | ProgressBar Component | None |
| 6 | ModelSelector Component | Task 5 |
| 7 | PromptInput Component | None |
| 8 | ResponseCard Component | None |
| 9 | ComparisonView Component | Task 8 |
| 10 | Main Page Integration | Tasks 3, 4, 6, 7, 9 |
| 11 | Install & Verify Build | Task 10 |
| 12 | ESLint & Polish | Task 11 |

**Parallelizable tasks:** 1-2, 5-9 can be done in parallel. Tasks 3-4 must be sequential. Task 10 depends on all component tasks.
