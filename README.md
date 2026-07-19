<div align="center">

<a href="https://academy.masterfabric.co">
  <img src="https://academy.masterfabric.co/academy-badge.png" width="120" alt="MasterFabric Academy">
</a>

<p>
  <sub>
    academy.masterfabric.co is a
    <a href="https://masterfabric.co">MasterFabric</a>
    subsidiary.
  </sub>
</p>

</div>

# LLM Playground

Compare LLMs side-by-side with browser-based inference. No API keys, no backend — everything runs client-side via [WebLLM](https://github.com/mlc-ai/web-llm) and WebGPU.

## Models

| Model | Parameters | Context Window |
|-------|-----------|----------------|
| TinyLlama 1.1B | 1.1B | 2,048 |
| Qwen 2.5 0.5B | 0.5B | 2,048 |
| Llama 3.2 1B | 1B | 4,096 |
| Gemma 2B | 2B | 4,096 |
| Gemma 9B | 9B | 8,192 |

Select any combination, enter a prompt, and see responses stream in real time with performance metrics (tokens/sec, latency, first-token time).

## Prerequisites

- **WebGPU-capable browser** — Chrome 113+, Edge 113+, or Firefox Nightly
- **Node.js 18+** (for development)
- First model load downloads weights (~200MB–2GB depending on model). Subsequent loads are cached in IndexedDB.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (run before commits) |

## Architecture

All inference runs in a **Web Worker** via `@mlc-ai/web-llm`. The main thread handles UI, streaming, and model state. A single `WebWorkerMLCEngine` manages all loaded models — toggling a model on triggers `engine.reload()`, toggling off unloads and reloads remaining models.

```
app/
├── lib/
│   ├── models.ts              # Model registry (IDs, defaults, context windows)
│   ├── types.ts               # TypeScript types for status, config, results
│   └── webllm-worker.ts       # Web Worker entry point (4 lines)
├── hooks/
│   ├── useWebLLM.ts           # Engine lifecycle, loading, inference, streaming
│   └── useConfig.ts           # Inference config (temperature, top_p, etc.)
├── components/
│   ├── ModelSelector.tsx      # Toggle cards with load progress
│   ├── PromptInput.tsx        # Textarea + Generate/Clear/Cancel buttons
│   ├── ComparisonView.tsx     # Responsive grid of response cards
│   ├── ResponseCard.tsx       # Single model response + metrics
│   ├── ProgressBar.tsx        # Loading indicator
│   ├── ConfigSidebar.tsx      # Slide-out inference settings
│   ├── ConfigSection.tsx      # Reusable config section wrapper
│   ├── ConfigSlider.tsx       # Labeled range input
│   └── ConfigToggle.tsx       # Boolean config toggle
├── page.tsx                   # Main page — orchestrates all components
├── layout.tsx                 # Root layout (Geist font, dark mode support)
└── globals.css                # Tailwind v4 + CSS variables
```

## Key Technical Details

- **WebGPU device lost recovery** — the app automatically reinitializes the engine and reloads models if the GPU device is lost during generation.
- **Model loading** — tries array reload for all models first, falls back to individual reloads if GPU memory is insufficient.
- **Inference config** — global settings (temperature, top_p, max_tokens, penalties) persist in localStorage under `llm-playground-inference-config`.
- **Selected models** — persist in localStorage under `llm-playground-selected-models`.
- **Token counts** — require `stream_options: { include_usage: true }` in the request; usage data arrives in the final streaming chunk.
- **Chat reset** — `engine.resetChat(false, modelId)` is called before each generation to clear prior conversation state per model.

## Tech Stack

- **Next.js** 16.3.0 (canary) — React 19, App Router
- **Tailwind CSS** v4 — configured via `@tailwindcss/postcss`, no `tailwind.config.js`
- **TypeScript** — strict mode, path alias `@/*` → `./*`
- **WebLLM** — `@mlc-ai/web-llm` v0.2.84

## Browser Compatibility

WebGPU is required. On unsupported browsers the app shows a compatibility error on load.

| Browser | Status |
|---------|--------|
| Chrome 113+ | Full support |
| Edge 113+ | Full support |
| Firefox Nightly | Partial (enable `dom.webgpu.enabled`) |
| Safari | Not supported |

## License

See repository for license details.
