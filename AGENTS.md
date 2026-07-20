<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: LLM Playground

Browser-based model comparison tool using `@mlc-ai/web-llm` with WebGPU. Users select multiple models, send a prompt, and see streamed responses side-by-side with performance metrics. All inference runs client-side — no backend for AI, but there **is** a remote auth backend.

## Quick Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run start      # Serve production build
npm run lint       # ESLint (run before commits — no test suite exists)
```

## Architecture

- **Framework:** Next.js 16.3.0-canary.89, React 19.2.7, Tailwind CSS v4
- **Inference:** `@mlc-ai/web-llm` with a single `WebWorkerMLCEngine` managing all loaded models
- **Auth:** Cookie-based session (`auth_session` cookie) backed by a remote Go API at `NEXT_PUBLIC_API_BASE_URL`
- **API proxy:** `next.config.ts` rewrites `/api/v1/*` and `/health/*` to the backend
- **All components must use `"use client"`** — WebLLM requires browser APIs (WebGPU)

## Key Files

```
app/
├── page.tsx              # Main page — orchestrates everything
├── layout.tsx            # Root layout (fonts, AuthProvider wrapper)
├── globals.css           # Tailwind v4 + custom CSS variables (sand palette)
├── middleware.ts         # Auth guard — redirects unauthenticated users to /
├── lib/
│   ├── types.ts          # ModelStatus, GenerationResult, InferenceConfig, AuthUser
│   ├── models.ts         # Model registry (5 models, IDs, defaults, context windows)
│   ├── webllm-worker.ts  # Web Worker entry for WebLLM
│   └── auth.ts           # API client: login, register, refresh, logout, healthCheck
├── hooks/
│   ├── useWebLLM.ts      # Engine lifecycle, model loading/unloading, generation, streaming
│   ├── useAuth.tsx        # AuthProvider context — session state, token refresh, login/logout
│   ├── useConfig.ts       # Inference config (temperature, top_p, etc.) persisted in localStorage
│   └── useHealthCheck.ts  # Periodic backend health check (30s interval)
└── components/
    ├── ModelSelector.tsx   # Toggle cards with load progress
    ├── PromptInput.tsx     # Textarea + Generate/Clear/Cancel buttons
    ├── ComparisonView.tsx  # Responsive grid of response cards
    ├── ResponseCard.tsx    # Single model response + metrics
    ├── ProgressBar.tsx     # Loading indicator
    ├── ConfigSidebar.tsx   # Slide-out inference settings panel
    ├── ConfigSection.tsx   # Reusable config section wrapper
    ├── ConfigSlider.tsx    # Labeled range input
    ├── ConfigToggle.tsx    # Boolean config toggle
    ├── AuthScreen.tsx      # Sign in / sign up form
    └── HealthIndicator.tsx # Backend health dot in header
```

## Models

Five models available (defined in `app/lib/models.ts`):

| ID | Name | Params | Context |
|----|------|--------|---------|
| `TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC` | TinyLlama 1.1B | 1.1B | 2,048 |
| `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` | Qwen 2.5 0.5B | 0.5B | 2,048 |
| `Llama-3.2-1B-Instruct-q4f16_1-MLC` | Llama 3.2 1B | 1B | 4,096 |
| `gemma-2-2b-it-q4f32_1-MLC` | Gemma 2B | 2B | 4,096 |
| `gemma-2-9b-it-q4f32_1-MLC` | Gemma 9B | 9B | 8,192 |

## Worker Reference Pattern

```typescript
new Worker(new URL("../lib/webllm-worker.ts", import.meta.url), { type: "module" })
```

## Tailwind CSS v4

Uses `@tailwindcss/postcss` plugin. No `tailwind.config.js` — configure via `app/globals.css` with `@theme inline` blocks. The app uses a custom warm-sand CSS variable palette (`--sand-*`, `--terracotta`, `--ink-*`, `--color-success/warning/error/info`).

## Auth System

- **`app/middleware.ts`**: Checks for `auth_session` cookie; redirects to `/` if missing
- **`app/hooks/useAuth.tsx`**: `AuthProvider` context — stores JWT in `sessionStorage` under `llm-playground-token` / `llm-playground-user`
- **`app/lib/auth.ts`**: API client hitting `/api/v1/auth/{login,register,refresh,logout}` and `/health/live`
- Auth endpoints are proxied via Next.js rewrites to `NEXT_PUBLIC_API_BASE_URL`

## MCP Servers

Configured in `.opencode/opencode.json`:
- **next:** Local Next.js devtools MCP (auto-started)
- **vercel:** Remote Vercel MCP for deployment tasks
- **github:** GitHub Copilot MCP (requires `GITHUB_PERSONAL_ACCESS_TOKEN` env)

## Custom Skills

Two skills in `.agents/skills/`:
- **masterfabric-go-api** — API reference for the Go auth backend (schemas, operations, auth flow)
- **frontend-design** — Design system guidance for UI work

## Environment

`.env` contains:
- `NEXT_PUBLIC_API_BASE_URL` — Backend URL (proxied by Next.js rewrites)
- `RENDER_API_KEY` — For Render MCP deployment
- `GITHUB_PERSONAL_ACCESS_TOKEN` — For GitHub MCP

## Design Spec

Full design: `docs/superpowers/specs/2025-07-19-llm-playground-design.md`
Implementation plan: `docs/superpowers/plans/2025-07-19-llm-playground.md`

## Gotchas

- **Models load on-demand** when toggled; first load downloads weights (~200MB–2GB). Cached in IndexedDB.
- **WebGPU required** — show compatibility error for unsupported browsers (Chrome 113+, Edge 113+)
- **`stream_options: { include_usage: true }`** needed to get token counts in the final streaming chunk
- **`engine.resetChat(false, modelId)`** must be called before each generation to clear prior conversation state per model
- **Model loading strategy**: tries array reload for all models first, falls back to individual reloads if GPU memory is insufficient
- **WebGPU device lost recovery**: `useWebLLM` automatically reinitializes the engine and reloads models
- **Never deselect all models** (UI prevents it, but be careful in code)
- **Selected models persist** in localStorage under `llm-playground-selected-models`
- **Inference config persists** in localStorage under `llm-playground-inference-config`
- **Auth tokens** are in sessionStorage (not localStorage) — cleared on tab close
- **No test suite** exists — only `npm run lint` for verification
