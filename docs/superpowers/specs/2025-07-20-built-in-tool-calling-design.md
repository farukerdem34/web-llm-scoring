# Built-in Tool Calling for LLM Playground

**Date:** 2025-07-20
**Status:** Draft

## Summary

Add OpenAI-compatible function calling (tool use) to the WebLLM playground with 5 built-in tools. Models that support function calling (Llama 3.2, Qwen 2.5, Gemma 2) can invoke tools during generation; models that don't (TinyLlama) ignore the tool definitions and generate text normally.

## Architecture

### Tool Definitions

Each tool follows the OpenAI `tools` parameter format (JSON Schema):

```typescript
interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface ToolImplementation {
  definition: ToolDefinition;
  execute: (args: Record<string, unknown>) => Promise<string>;
}
```

Tools are defined in a single registry (`app/lib/tools.ts`) as an array of `ToolImplementation` objects.

### Five Built-in Tools

| Tool | Description | Implementation |
|------|-------------|---------------|
| `web_search` | Search the web for current information | DuckDuckGo Instant Answer API (`/api.duckduckgo.com/?q=&format=json&no_html=1`) |
| `fetch_url` | Fetch content from a URL | `fetch()` with CORS handling; returns text/markdown content |
| `evaluate_math` | Evaluate a mathematical expression | `mathjs` evaluate or safe expression parser |
| `get_current_datetime` | Get the current date and time | `new Date().toLocaleString()` with timezone |
| `random_number` | Generate a random number in a range | `Math.random()` based |

### Tool Execution Loop

The loop is implemented inside `runModel()` in `useWebLLM.ts`. The existing single-pass streaming flow becomes a recursive loop. The `runModel()` function accepts an optional `conversationMessages` parameter — empty on first call, populated on recursive calls.

```
runModel(modelId, conversationMessages = []):
  messages = [system?, user] + conversationMessages   // system+user only on first call

  1. Call engine.chat.completions.create({ messages, stream: true, tools })
  2. Iterate over streaming chunks:
     a. If delta.content → append to accumulated text, update UI
     b. If delta.tool_calls → accumulate by index (build full arguments string)
     c. If finish_reason === "tool_calls":
        - Parse accumulated tool_calls (name + arguments)
        - Execute each tool via executeTool(name, args)
        - Build tool result messages: { role: "tool", tool_call_id, content }
        - Set results[modelId].toolCalls for display
        - Recursively: runModel(modelId, [...conversationMessages, assistant_msg, ...toolResults])
        - Max recursion depth: 5
     d. If finish_reason === "stop":
        - Set final results with text, token counts, etc.
        - Return (end recursion)
  3. On cancel: break stream loop, set isGenerating = false
```

**Note:** On recursive calls, the assistant message containing `tool_calls` must also be appended to conversationMessages (not just the tool results), as the model needs to see its own tool call output in context.

**Key behaviors:**
- `isGenerating` stays `true` throughout tool execution + final response
- Tool calls are recorded per-model in `results[modelId].toolCalls`
- `cancelGeneration()` works during any phase (streaming or tool execution)
- Device-lost recovery still applies: if GPU is lost mid-generation, reinitialize and retry
- Max recursion depth guard (default: 5 iterations) to prevent infinite loops

### Data Types

Added to `app/lib/types.ts`:

```typescript
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: string; // JSON string of parsed args
  result: string;
}

// Extended in GenerationResult:
export interface GenerationResult {
  // ...existing fields...
  toolCalls?: ToolCallInfo[]; // NEW
}
```

### UI: Tool Calls Inline in ResponseCard

Tool calls are displayed within `ResponseCard` as inline entries between tool call and final response:

```
🔧 web_search("days in 2024")
   → 366 days (leap year)

2024 has 366 days because it is a leap year...
```

Each tool call entry shows:
- Tool name and parsed arguments
- Result (truncated if long; expandable via click)
- Visual separation from text content

The `text` field of `GenerationResult` contains only the final assistant response (not tool call metadata). Tool calls are displayed from the separate `toolCalls` array.

## Files Changed

| File | Change | Type |
|------|--------|------|
| `app/lib/types.ts` | Add `ToolDefinition`, `ToolCallInfo`, update `GenerationResult` | Edit |
| `app/lib/tools.ts` | Tool definitions + implementations + `executeTool()` | New |
| `app/hooks/useWebLLM.ts` | Tool loop in `runModel()`, tool state management | Edit |
| `app/components/ResponseCard.tsx` | Tool call inline display | Edit |

## Edge Cases

- **Model doesn't support tools** → `tools` parameter ignored by engine; behaves as today
- **Tool execution fails** → Return error message as tool result; model can retry or apologise
- **CORS on fetch_url** → Wrap in try/catch; return CORS error message to model
- **Deep recursion** → Hard limit of 5 tool-call iterations per generation
- **Cancel during tool execution** → Check cancel flag before/after each tool execution; skip follow-up call
- **Empty tool result** → Return "No result" to model rather than empty string
- **Web search rate limit** → Return rate limit message; model can fall back gracefully

## Non-goals

- No MCP server integration
- No custom tool definition UI
- No persistent conversation history (single-prompt + tool calls only)
- No parallel tool execution (sequential per tool call turn)
