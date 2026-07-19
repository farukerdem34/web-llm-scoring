# LLM Playground: Gemma Model Comparison Tool — Design Spec

**Date:** 2025-07-19
**Scope:** Phases 1-2 (Core inference + multi-model comparison)
**Models:** Gemma 2B and 9B only (27B deferred, lighter alternative TBD)

---

## Overview

A browser-based playground that runs Gemma 2B and 9B models using `@mlc-ai/web-llm` with WebGPU acceleration. Users select models, enter a prompt, and see side-by-side streaming responses with performance metrics.

All inference runs client-side — no backend, no API keys, no data leaves the browser.

---

## Architecture

### Engine: Single WebWorkerMLCEngine

One `WebWorkerMLCEngine` manages both models. WebLLM handles model loading, switching, and parallel inference across different models.

```
UI (React) ←→ useWebLLM hook ←→ WebWorkerMLCEngine (1 worker)
                                      ├── gemma-2-2b-it-q4f32_1-MLC
                                      └── gemma-2-9b-it-q4f32_1-MLC
```

- Worker runs in a separate thread — UI never freezes during inference
- Different models can generate concurrently via `Promise.all()`
- Same-model concurrent requests are sequential (FCFS) — acceptable since we compare across models

### Dependencies

| Package | Purpose |
|---|---|
| `@mlc-ai/web-llm` | Browser LLM inference engine with WebGPU |
| `next` (16.3.0-canary.89) | Framework (existing) |
| `react` (19.2.7) | UI (existing) |
| `tailwindcss` (v4) | Styling (existing) |

---

## File Structure

```
app/
├── layout.tsx              — Root layout (update metadata)
├── page.tsx                — Main playground page ("use client")
├── globals.css             — Tailwind styles
├── components/
│   ├── ModelSelector.tsx   — Toggle cards for model selection
│   ├── PromptInput.tsx     — Textarea + generate/clear buttons
│   ├── ResponseCard.tsx    — Single model response + metrics
│   ├── ComparisonView.tsx  — Responsive grid of ResponseCards
│   └── ProgressBar.tsx     — Loading/progress indicator
├── hooks/
│   └── useWebLLM.ts        — Engine wrapper, loading, inference, streaming
└── lib/
    ├── webllm-worker.ts    — Web Worker entry point (referenced via `new Worker(new URL("./webllm-worker.ts", import.meta.url), { type: "module" })`)
    ├── models.ts           — Model registry (IDs, names, defaults)
    └── types.ts            — Shared TypeScript types
```

---

## Model Registry

```ts
// lib/models.ts
const MODELS = {
  "gemma-2-2b-it-q4f32_1-MLC": {
    name: "Gemma 2B",
    params: "2B",
    description: "Fast, lightweight",
    // defaultParams: placeholder for Phase 3 parameter adjustment
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
  },
  "gemma-2-9b-it-q4f32_1-MLC": {
    name: "Gemma 9B",
    params: "9B",
    description: "Balanced quality",
    // defaultParams: placeholder for Phase 3 parameter adjustment
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
  },
};
```

---

## Core Hook: `useWebLLM`

### Responsibilities
- Initialize `WebWorkerMLCEngine` on mount
- Load/unload models on demand
- Send prompts and stream results
- Collect metrics (latency, tokens/sec, token counts)
- Cancel active generations

### API

```ts
function useWebLLM() {
  return {
    // Engine state
    engineReady: boolean;
    modelStatus: Record<string, ModelStatus>;
    loadProgress: Record<string, number>;
    isGenerating: boolean;
    results: Record<string, GenerationResult>;
    error: string | null;

    // Actions
    loadModel: (modelId: string) => Promise<void>;
    unloadModel: (modelId: string) => Promise<void>;
    generate: (prompt: string, modelIds: string[]) => Promise<void>;
    cancelGeneration: () => void;
    clearResults: () => void;
  };
}
```

### Types

```ts
type ModelStatus = "idle" | "loading" | "ready" | "error";

interface GenerationResult {
  text: string;
  firstTokenTime: number | null;   // ms from request to first chunk
  inferenceTime: number | null;    // ms from request to final chunk
  tokenCount: number | null;
  tokensPerSecond: number | null;
  isStreaming: boolean;
}
```

### Streaming Flow

1. User clicks Generate → `generate(prompt, ["model-a", "model-b"])`
2. For each model, call `engine.chat.completions.create()` with `stream: true`
3. Both run concurrently via `Promise.all()`
4. Each chunk updates `results[modelId].text` incrementally
5. Final chunk provides `usage` with token counts
6. Metrics calculated from timing + token count

### Metrics Calculation

- **First token time:** `Date.now()` at request - `Date.now()` at first chunk
- **Inference time:** `Date.now()` at request - `Date.now()` at final chunk
- **Tokens/sec:** `usage.completion_tokens / (inferenceTime / 1000)`

---

## Components

### ModelSelector

Renders a card per model with:
- Model name + parameter count
- Status badge (idle / loading / ready / error)
- Toggle checkbox (at least one must stay selected)
- Load progress bar when loading (uses ProgressBar component)
- Clicking toggle triggers `loadModel()` or `unloadModel()`

### PromptInput

- Multi-line `<textarea>` (max 4096 chars)
- Character count display
- Disabled until at least one model is "ready"
- Enter to submit, Shift+Enter for newline
- Generate button (disabled during generation or empty prompt)
- Clear button (resets results, preserves prompt text)

### ComparisonView

- Responsive CSS grid: 2 columns (both selected) or 1 column (one selected)
- Wraps ResponseCard for each selected model
- Adapts at 768px breakpoint

### ResponseCard

- Model name header with color indicator (blue for 2B, purple for 9B)
- Streaming response text with blinking cursor during generation
- Loading spinner when waiting for first token
- Metrics bar after completion: inference time, tokens/sec, token count
- Copy button (copies response text to clipboard)
- Elapsed timer during generation (updates every 100ms)

### ProgressBar

- Thin progress bar showing download/compilation progress
- Percentage text label
- Used by ModelSelector during model loading

---

## UI Layout

```
┌─────────────────────────────────────────────┐
│  Header: "LLM Playground"                   │
├─────────────────────────────────────────────┤
│  Model Selector (horizontal card row)       │
│  ┌──────────┐  ┌──────────┐                │
│  │ Gemma 2B │  │ Gemma 9B │   [toggle]     │
│  │ ● Ready  │  │ ○ Loading│                │
│  └──────────┘  └──────────┘                │
├─────────────────────────────────────────────┤
│  Prompt Input                               │
│  ┌─────────────────────────────────────┐    │
│  │ Enter your prompt here...           │    │
│  └─────────────────────────────────────┘    │
│  [Generate]  [Clear]                        │
├─────────────────────────────────────────────┤
│  Comparison View (responsive grid)          │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Gemma 2B     │  │ Gemma 9B     │        │
│  │ (streaming   │  │ (streaming   │        │
│  │  response)   │  │  response)   │        │
│  │ ──────────── │  │ ──────────── │        │
│  │ 1.2s │ 45t/s │  │ 3.8s │ 22t/s│        │
│  │ [Copy]       │  │ [Copy]       │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

---

## State Management

### App-level state (in page.tsx or useWebLLM)
- `selectedModels: string[]` — which models are toggled on
- `modelStatus: Record<string, ModelStatus>` — per-model loading status
- `loadProgress: Record<string, number>` — download progress per model
- `isGenerating: boolean` — any model generating
- `results: Record<string, GenerationResult>` — latest results per model
- `error: string | null` — global error message

### Persistence (localStorage)
- `selectedModels` — remembered across page refreshes
- No prompt/response persistence (PRD non-goal)

---

## Concurrency Model

When Generate is clicked with both models selected:
1. `engine.chat.completions.create()` called for each model
2. Both run in parallel via `Promise.all()`
3. Each model's streaming chunks update independently
4. `cancelGeneration()` calls `engine.interruptGenerate()` for each active model

---

## Error Handling

| Scenario | Behavior |
|---|---|
| WebGPU not supported | Show clear message: "WebGPU is required. Use Chrome/Edge." with compatibility check on page load |
| Model download fails | Show error toast with retry option, model status set to "error" |
| Model OOM | Show memory warning, suggest deselecting other models |
| Inference error | Show error in ResponseCard, other models continue |
| Generation cancelled | Show "Cancelled" status in ResponseCards |

---

## Scope边界 (Phases 1-2 Only)

### Included (Phase 1)
- [x] Load Gemma 2B and 9B using WebLLM
- [x] Model selection toggles
- [x] Text input for prompts
- [x] Send prompt to selected models simultaneously
- [x] Display responses side-by-side
- [x] Show inference time
- [x] Loading/progress indicators

### Included (Phase 2)
- [x] Token generation speed (tokens/second)
- [x] Token count for input and response
- [x] Response copy functionality
- [x] Clear/reset button
- [x] Keyboard shortcuts (Enter to submit, Escape to cancel)
- [x] Streaming responses
- [x] Responsive design

### Excluded (Phase 3+)
- Parameter adjustment (temperature, top_p, max_tokens)
- Response rating (thumbs up/down)
- Export functionality (JSON/CSV)
- Prompt library
- Model memory usage display
