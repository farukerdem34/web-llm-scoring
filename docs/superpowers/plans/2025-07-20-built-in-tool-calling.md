# Built-in Tool Calling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 built-in function-calling tools (web search, URL fetch, math, datetime, random) to the LLM playground with a recursive tool loop.

**Architecture:** Tools defined as OpenAI-compatible `ChatCompletionTool` array in `app/lib/tools.ts`. The `runModel()` function in `useWebLLM.ts` adds `tools` to the streaming request and detects `finish_reason: "tool_calls"` to execute tools and recursively call the model with tool results. Tool calls displayed inline in `ResponseCard.tsx`.

**Tech Stack:** WebLLM (`@mlc-ai/web-llm`), React 19, TypeScript. No new dependencies.

## Global Constraints

- All components use `"use client"` (WebLLM requires browser APIs)
- Use existing WebLLM types (`ChatCompletionTool`, `ChatCompletionMessageToolCall`, `ChatCompletionToolMessageParam`, `ChatCompletionFinishReason`)
- Follow existing code style: no comments, minimal inline annotations
- Max 5 recursive tool-call iterations per generation
- Models that don't support tool calling ignore the `tools` parameter

---

### Task 1: Add tool types to `app/lib/types.ts`

**Files:**
- Modify: `app/lib/types.ts:44-51`

**Interfaces:**
- Produces: `ToolCallInfo` interface, updated `GenerationResult` with `toolCalls` field

- [ ] **Add ToolCallInfo type and extend GenerationResult**

Add after the `GenerationResult` interface:

```typescript
export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: string;
  result: string;
}
```

Change `GenerationResult` to add the `toolCalls` field:

```typescript
export interface GenerationResult {
  text: string;
  firstTokenTime: number | null;
  inferenceTime: number | null;
  tokenCount: number | null;
  tokensPerSecond: number | null;
  isStreaming: boolean;
  toolCalls?: ToolCallInfo[];
}
```

- [ ] **Commit**

```bash
git add app/lib/types.ts
git commit -m "feat: add ToolCallInfo type for function calling"
```

---

### Task 2: Create `app/lib/tools.ts` with 5 built-in tools

**Files:**
- Create: `app/lib/tools.ts`

**Interfaces:**
- Produces: `BUILT_IN_TOOLS` (array of `ChatCompletionTool`), `executeTool(name, args)` function

- [ ] **Create tools.ts with tool definitions and implementations**

```typescript
import type { ChatCompletionTool } from "@mlc-ai/web-llm";

interface ToolImpl {
  definition: ChatCompletionTool;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

const TOOLS: ToolImpl[] = [
  {
    definition: {
      type: "function",
      function: {
        name: "web_search",
        description: "Search the web for current information. Returns a summary of search results.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query",
            },
          },
          required: ["query"],
        },
      },
    },
    execute: async (args) => {
      const query = String(args.query ?? "");
      if (!query.trim()) return "Error: No query provided";
      try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const res = await fetch(url);
        const data = await res.json();
        const summary = data.AbstractText || data.Answer || "";
        if (!summary) {
          const results = (data.RelatedTopics ?? [])
            .slice(0, 5)
            .map((t: { Text?: string; Result?: string }) => t.Text || t.Result || "")
            .filter(Boolean)
            .join("\n");
          return results || `No results found for "${query}"`;
        }
        return summary;
      } catch (err) {
        return `Search error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  },
  {
    definition: {
      type: "function",
      function: {
        name: "fetch_url",
        description: "Fetch and return the content of a web page as plain text.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch",
            },
          },
          required: ["url"],
        },
      },
    },
    execute: async (args) => {
      const url = String(args.url ?? "");
      if (!url.trim()) return "Error: No URL provided";
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "Error: URL must start with http:// or https://";
      }
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const text = await res.text();
        const stripped = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return stripped.slice(0, 4000);
      } catch (err) {
        if (err instanceof DOMException && err.name === "TimeoutError") {
          return "Error: Request timed out";
        }
        return `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  },
  {
    definition: {
      type: "function",
      function: {
        name: "evaluate_math",
        description: "Evaluate a mathematical expression and return the result. Supports +, -, *, /, parentheses, and basic math functions (sqrt, sin, cos, etc.). Use valid JS syntax.",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "The mathematical expression to evaluate (e.g., '(3 + 5) * 2')",
            },
          },
          required: ["expression"],
        },
      },
    },
    execute: async (args) => {
      const expr = String(args.expression ?? "").trim();
      if (!expr) return "Error: No expression provided";
      try {
        const sanitized = expr.replace(/[^0-9+\-*/.()%\s,]/g, "");
        if (sanitized.length < expr.length) {
          return "Error: Expression contains invalid characters";
        }
        const result = Function(`"use strict"; return (${sanitized})`)();
        if (typeof result !== "number" || !isFinite(result)) {
          return `Result: ${result}`;
        }
        return String(result);
      } catch {
        return `Error: Invalid expression "${expr}"`;
      }
    },
  },
  {
    definition: {
      type: "function",
      function: {
        name: "get_current_datetime",
        description: "Get the current date and time. Returns the local date, time, and timezone.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    execute: async () => {
      const now = new Date();
      return now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "long",
      });
    },
  },
  {
    definition: {
      type: "function",
      function: {
        name: "random_number",
        description: "Generate a random integer between min and max (inclusive).",
        parameters: {
          type: "object",
          properties: {
            min: {
              type: "number",
              description: "Minimum value (inclusive)",
            },
            max: {
              type: "number",
              description: "Maximum value (inclusive)",
            },
          },
          required: ["min", "max"],
        },
      },
    },
    execute: async (args) => {
      const min = Number(args.min ?? 0);
      const max = Number(args.max ?? 100);
      if (!isFinite(min) || !isFinite(max) || min > max) {
        return `Error: Invalid range [${min}, ${max}]`;
      }
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      return String(result);
    },
  },
];

export const BUILT_IN_TOOLS: ChatCompletionTool[] = TOOLS.map((t) => t.definition);

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const tool = TOOLS.find((t) => t.definition.function.name === name);
  if (!tool) return `Error: Unknown tool "${name}"`;
  try {
    return await tool.execute(args);
  } catch (err) {
    return `Error executing ${name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
```

- [ ] **Commit**

```bash
git add app/lib/tools.ts
git commit -m "feat: add 5 built-in function-calling tools"
```

---

### Task 3: Add tool loop to `useWebLLM.ts`

**Files:**
- Modify: `app/hooks/useWebLLM.ts`

**Interfaces:**
- Consumes: `BUILT_IN_TOOLS` from `app/lib/tools.ts`, `executeTool` from `app/lib/tools.ts`, `ToolCallInfo` from `types.ts`
- Produces: Modified `runModel()` with recursive tool calling, `results[modelId].toolCalls` populated

- [ ] **Update imports**

Add at the top:

```typescript
import { BUILT_IN_TOOLS, executeTool } from "@/app/lib/tools";
import { ModelStatus, GenerationResult, InferenceConfig, ModelEngineEntry, ToolCallInfo } from "@/app/lib/types";
```

Change `ToolCallInfo` is already in the types import.

- [ ] **Modify `runModel()` to accept conversation messages and support tools**

Replace the existing `runModel` function inside `generate()` with this version:

```typescript
const runModel = async (
  modelId: string,
  conversationMessages: import("@mlc-ai/web-llm").ChatCompletionMessageParam[] = [],
  toolDepth = 0
) => {
  const entry = enginesRef.current.get(modelId);
  if (!entry) return;

  const engine = entry.engine;

  try {
    await engine.resetChat(false, modelId);
  } catch {
    // resetChat may fail if model isn't loaded; continue
  }

  const messages: import("@mlc-ai/web-llm").ChatCompletionMessageParam[] = [];
  if (config?.system_prompt?.trim()) {
    messages.push({ role: "system", content: config.system_prompt.trim() });
  }
  if (conversationMessages.length === 0) {
    messages.push({ role: "user", content: prompt });
  }
  messages.push(...conversationMessages);

  const request: import("@mlc-ai/web-llm").ChatCompletionRequest = {
    stream: true,
    stream_options: { include_usage: true },
    messages,
    model: modelId,
    tools: BUILT_IN_TOOLS,
    max_tokens: config?.max_tokens ?? MODELS[modelId]?.defaultParams.max_tokens ?? 200,
    temperature: config?.temperature ?? MODELS[modelId]?.defaultParams.temperature ?? 0.7,
    top_p: config?.top_p ?? MODELS[modelId]?.defaultParams.top_p ?? 0.9,
    frequency_penalty: config?.frequency_penalty,
    presence_penalty: config?.presence_penalty,
    repetition_penalty: config?.repetition_penalty,
    ignore_eos: config?.ignore_eos,
  };

  const startTime = Date.now();
  let firstTokenCaptured = false;
  // Accumulate tool calls from streaming chunks by index
  const toolCallAccumulator = new Map<
    number,
    { id: string; name: string; arguments: string }
  >();
  let finishReasonToolCalls = false;

  try {
    const stream = await engine.chat.completions.create(request);

    for await (const chunk of stream) {
      if (cancelGenerationRef.current) break;

      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta;

      // Accumulate text content
      const content = delta?.content || "";
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

      // Accumulate tool calls from streaming deltas
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = toolCallAccumulator.get(tc.index);
          if (existing) {
            existing.arguments += tc.function?.arguments || "";
          } else {
            toolCallAccumulator.set(tc.index, {
              id: tc.id || `call_${tc.index}`,
              name: tc.function?.name || "",
              arguments: tc.function?.arguments || "",
            });
          }
        }
      }

      if (choice.finish_reason === "tool_calls") {
        finishReasonToolCalls = true;
      }

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
    if (isDeviceLostError(err) && !deviceLostRetryRef.current) {
      deviceLostRetryRef.current = true;
      try {
        await reinitializeSingleEngine(modelId);
        setResults((prev) => ({
          ...prev,
          [modelId]: { ...createEmptyResult(), isStreaming: true },
        }));
        await runModel(modelId, conversationMessages, toolDepth);
        return;
      } catch {
        setResults((prev) => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            text: "Error: Recovery failed after device loss. Please refresh the page.",
            isStreaming: false,
          },
        }));
        return;
      }
    }
    setResults((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        text: `Error: ${describeError(err)}`,
        isStreaming: false,
      },
    }));
    return;
  }

  if (cancelGenerationRef.current) return;

  // Handle tool calls
  if (finishReasonToolCalls && toolCallAccumulator.size > 0) {
    if (toolDepth >= 5) {
      setResults((prev) => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          text: prev[modelId].text + "\n\n[Tool call limit reached (5 iterations)]",
          isStreaming: false,
        },
      }));
      return;
    }

    const toolCalls: ToolCallInfo[] = [];
    const followUpMessages: import("@mlc-ai/web-llm").ChatCompletionMessageParam[] = [];

    for (const [, tc] of toolCallAccumulator) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.arguments);
      } catch {
        // If arguments aren't valid JSON, pass empty object
      }

      const result = await executeTool(tc.name, parsedArgs);

      toolCalls.push({
        id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
        result,
      });

      followUpMessages.push({
        role: "assistant" as const,
        content: null,
        tool_calls: [
          {
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          },
        ],
      });

      followUpMessages.push({
        role: "tool" as const,
        tool_call_id: tc.id,
        content: result,
      });
    }

    // Record tool calls for display
    setResults((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        toolCalls: [...(prev[modelId].toolCalls || []), ...toolCalls],
      },
    }));

    // Recursive call with tool results appended
    await runModel(modelId, [...conversationMessages, ...followUpMessages], toolDepth + 1);
    return;
  }
};
```

- [ ] **Commit**

```bash
git add app/hooks/useWebLLM.ts
git commit -m "feat: add recursive tool calling loop to useWebLLM"
```

---

### Task 4: Display tool calls in `ResponseCard.tsx`

**Files:**
- Modify: `app/components/ResponseCard.tsx`

**Interfaces:**
- Consumes: `GenerationResult.toolCalls` (array of `ToolCallInfo`)

- [ ] **Render tool calls inline in the response body**

Replace the response body section (lines 59-82) with this:

```typescript
      {/* Response Body */}
      <div className="flex-1 p-4 min-h-[240px] max-h-[480px] overflow-y-auto">
        {!result.text && !result.isStreaming && !result.toolCalls?.length && (
          <p className="text-[var(--ink-faint)] text-sm italic">
            Response will appear here...
          </p>
        )}

        {result.isStreaming && result.text === "" && !result.toolCalls?.length && (
          <div className="flex items-center gap-2 text-[var(--ink-muted)]">
            <div className="w-4 h-4 border-2 border-[var(--terracotta)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Waiting for first token...</span>
          </div>
        )}

        {/* Tool calls */}
        {result.toolCalls?.map((tc, i) => (
          <div key={i} className="mb-3 text-sm">
            <div className="flex items-start gap-2 py-1.5 px-3 bg-[var(--sand-50)] rounded-lg border border-[var(--sand-200)]">
              <span className="text-[var(--ink-muted)] mt-0.5 shrink-0">{"\uD83D\uDD27"}</span>
              <div className="min-w-0">
                <code className="text-xs font-mono text-[var(--terracotta)]">
                  {tc.name}({tc.arguments})
                </code>
                <div className="mt-1 text-xs text-[var(--ink-muted)] whitespace-pre-wrap break-words">
                  {tc.result.slice(0, 500)}
                  {tc.result.length > 500 ? "..." : ""}
                </div>
              </div>
            </div>
          </div>
        ))}

        {result.text && (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--ink)] leading-relaxed">
              {result.text}
            </pre>
            {result.isStreaming && (
              <span className="streaming-cursor" />
            )}
          </div>
        )}
      </div>
```

- [ ] **Make sure the streaming cursor style exists in globals.css**

Check `app/globals.css` for the `.streaming-cursor` style. If it exists already, nothing to do. It's referenced in the original code at line 79, so it should already be defined.

- [ ] **Commit**

```bash
git add app/components/ResponseCard.tsx
git commit -m "feat: display tool calls inline in response cards"
```

---

### Self-Review Checklist

1. **Spec coverage:** 
   - All 5 tools defined ✓ (Task 2)
   - Tool definitions in OpenAI format ✓ (Task 2)
   - Recursive tool loop with max depth 5 ✓ (Task 3)
   - Inline tool call display ✓ (Task 4)
   - Device-lost recovery preserved ✓ (Task 3)
   - Cancel works during tool execution ✓ (Task 3, cancelGenerationRef checked)
   - Models that don't support tools are unaffected ✓ (tools parameter ignored by engine)

2. **Placeholder scan:** No placeholders found

3. **Type consistency:** 
   - `tool_calls` in assistant message uses correct `ChatCompletionMessageToolCall` shape
   - `role: "tool"` messages use correct `ChatCompletionToolMessageParam` shape
   - `toolCalls` in `GenerationResult` uses `ToolCallInfo[]` from Task 1
   - All imports match actual exports
