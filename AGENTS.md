<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: LLM Playground

Browser-based Gemma model comparison tool using `@mlc-ai/web-llm` with WebGPU. All inference runs client-side — no backend, no API keys.

## Quick Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint (next/core-web-vitals + typescript)
```

No test suite exists yet. Run `npm run lint` before commits.

## Architecture

- **Framework:** Next.js 16.3.0-canary.89, React 19.2.7, Tailwind CSS v4
- **Inference:** `@mlc-ai/web-llm` with single `WebWorkerMLCEngine` managing both models
- **Models:** Gemma 2B (`gemma-2-2b-it-q4f32_1-MLC`) and 9B (`gemma-2-9b-it-q4f32_1-MLC`)
- **All components must use `"use client"`** — WebLLM requires browser APIs (WebGPU)

## Key Files (Planned)

```
app/
├── lib/
│   ├── types.ts            # ModelStatus, GenerationResult, ModelConfig
│   ├── models.ts           # Model registry (IDs, defaults)
│   └── webllm-worker.ts    # Web Worker entry for WebLLM
├── hooks/
│   └── useWebLLM.ts        # Engine wrapper, loading, inference, streaming
└── components/
    ├── ModelSelector.tsx   # Toggle cards with status
    ├── PromptInput.tsx     # Textarea + buttons
    ├── ResponseCard.tsx    # Single response + metrics
    ├── ComparisonView.tsx  # Responsive grid
    └── ProgressBar.tsx     # Loading indicator
```

## Worker Reference Pattern

```typescript
new Worker(new URL("../lib/webllm-worker.ts", import.meta.url), { type: "module" })
```

## Tailwind CSS v4

Uses `@tailwindcss/postcss` plugin. Configure via `app/globals.css` with `@theme inline` blocks — no `tailwind.config.js` file.

## MCP Servers

Two MCP servers configured in `opencode.json`:
- **next:** Local Next.js devtools MCP (auto-started)
- **vercel:** Remote Vercel MCP for deployment tasks

## Design Spec

Full design: `docs/superpowers/specs/2025-07-19-llm-playground-design.md`
Implementation plan: `docs/superpowers/plans/2025-07-19-llm-playground.md` (12 tasks)

## Implementation Approach

Executed via **subagent-driven-development** — fresh subagent per task with spec review after each.

## Gotchas

- Models load on-demand when toggled; first load downloads weights (~1-2GB)
- WebGPU required — show compatibility error for unsupported browsers
- `stream_options: { include_usage: true }` needed to get token counts in final chunk
- Never deselect all models (UI prevents it)
- Selected models persist in localStorage across refreshes
