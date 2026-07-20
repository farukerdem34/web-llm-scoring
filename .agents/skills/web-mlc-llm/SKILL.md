---
name: web-mlc-llm
description: Use when implementing browser-based LLM inference with WebLLM/MLC LLM, setting up MLCEngine, handling model loading, chat completions, streaming, Web Workers, Service Workers, or Chrome extensions using @mlc-ai/web-llm
---

# web-mlc-llm

Reference guide for WebLLM (`@mlc-ai/web-llm`) - browser-based LLM inference powered by WebGPU/MLC.

## When to Use

- Building chatbots or AI assistants that run entirely in the browser
- Need local LLM inference without server-side infrastructure
- Implementing streaming chat completions in web apps
- Offloading LLM computation to Web Workers or Service Workers
- Building Chrome extensions with embedded LLM capabilities

## Quick Reference

| Task | Import | Key Method |
|------|--------|------------|
| Basic engine | `CreateMLCEngine` | `await CreateMLCEngine(modelId, config?)` |
| Direct init | `MLCEngine` | `engine.reload(modelId)` |
| Chat | `engine.chat.completions` | `.create({messages})` |
| Streaming | `engine.chat.completions` | `.create({messages, stream: true})` |
| Web Worker | `CreateWebWorkerMLCEngine` | Same API as `MLCEngine` |
| Service Worker | `CreateServiceWorkerMLCEngine` | Same API as `MLCEngine` |

## Core Pattern

```typescript
import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

// Factory function (recommended)
const engine = await CreateMLCEngine("Llama-3.1-8B-Instruct", {
    initProgressCallback: (progress) => console.log(progress),
    appConfig: prebuiltAppConfig,
});

// Chat completion
const reply = await engine.chat.completions.create({
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" }
    ],
});
console.log(reply.choices[0].message);
```

## Key Concepts

**Model Selection:** Models are identified by string IDs from `webllm.prebuiltAppConfig.model_list`. Use `Llama-3.1-8B-Instruct`, `Gemma-2B`, etc.

**Two Initialization Paths:**
1. Factory: `CreateMLCEngine(modelId, config?)` - creates + loads in one call
2. Manual: `new MLCEngine()` → `engine.reload(modelId)` - separates sync/async steps

**The `model` parameter in `chat.completions.create()` is ignored.** Model is set during `reload()` or `CreateMLCEngine()`.

## Streaming

```typescript
const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
    stream_options: { include_usage: true },
});

let reply = "";
for await (const chunk of chunks) {
    reply += chunk.choices[0]?.delta.content || "";
}
// Or use engine.getMessage() for final result
const fullReply = await engine.getMessage();
```

## Workers

**Web Worker (worker.ts):**
```typescript
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
```

**Main script:**
```typescript
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
const engine = await CreateWebWorkerMLCEngine(
    new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
    "Llama-3.1-8B-Instruct"
);
// Same API as MLCEngine
```

**Service Worker:** Similar pattern using `ServiceWorkerMLCEngineHandler` and `CreateServiceWorkerMLCEngine`. Model persists across page refreshes. Browser may kill service worker - implement error handling.

## Configuration

**MLCEngineConfig (optional):**
- `appConfig`: Model list, cache backend (`"indexeddb"`, `"cross-origin"`, or default Cache API)
- `initProgressCallback`: Loading progress updates
- `logitProcessorRegistry`: Custom logit processors

**GenerationConfig:**
- `temperature`, `top_p`, `max_tokens`, `stop`
- `frequency_penalty`, `presence_penalty` (range: [-2, 2])
- `repetition_penalty`, `ignore_eos` (MLC-specific)
- `logit_bias`: Control token generation probabilities

**ChatConfig (via `reload()` chatOpts):**
- `context_window_size`, `sliding_window_size`
- `conv_template`, `conv_config`
- Default generation parameters

## Caching

```typescript
import { AppConfig, prebuiltAppConfig } from "@mlc-ai/web-llm";

// IndexedDB
const appConfig: AppConfig = {
    ...prebuiltAppConfig,
    cacheBackend: "indexeddb",
};

// Cross-Origin (shared across sites with extension)
const appConfig: AppConfig = {
    ...prebuiltAppConfig,
    cacheBackend: "cross-origin",
};

const engine = await CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC", {
    appConfig,
});
```

## GPU Info

```typescript
const vendor = await engine.getGPUVendor(); // "Intel", "NVIDIA", etc.
const maxBuffer = await engine.getMaxStorageBufferBindingSize(); // bytes
```

## Common Mistakes

- **Using `model` in chat.completions.create()** - It's ignored; set model during reload/CreateMLCEngine
- **Forgetting async handling** - Model download is slow on first run; handle loading states
- **Service worker termination** - Browser can kill it anytime; add heartbeat/error handling
- **Wrong cache backend** - IndexedDB is more portable; Cache API is default
- **Missing stream_options** - Need `include_usage: true` to get token usage stats in streaming

## Resources

- [Basic Usage](https://webllm.mlc.ai/docs/user/basic_usage.html)
- [Advanced Usage](https://webllm.mlc.ai/docs/user/advanced_usage.html)
- [API Reference](https://webllm.mlc.ai/docs/user/api_reference.html)
- [Examples](https://github.com/mlc-ai/web-llm/tree/main/examples)
- [WebLLM Chat](https://github.com/mlc-ai/web-llm-chat)
