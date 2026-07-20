"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  WebWorkerMLCEngine,
  prebuiltAppConfig,
  type AppConfig,
} from "@mlc-ai/web-llm";
import { MODEL_IDS, MODELS } from "@/app/lib/models";
import { ModelStatus, GenerationResult, InferenceConfig, ModelEngineEntry, ToolCallInfo } from "@/app/lib/types";
import { BUILT_IN_TOOLS, executeTool } from "@/app/lib/tools";

const appConfig: AppConfig = { ...prebuiltAppConfig, cacheBackend: "indexeddb" };

function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const msg = err.message.toLowerCase();
  if (msg.includes("out of memory") || msg.includes("insufficient memory")) {
    return "GPU ran out of memory. Close other GPU-heavy tabs or try a smaller model.";
  }
  if (msg.includes("webgpu") && msg.includes("not supported")) {
    return "WebGPU is not supported in this browser. Use Chrome 113+ or Edge 113+.";
  }
  if (msg.includes("model") && (msg.includes("not found") || msg.includes("not loaded"))) {
    return `${err.message} — make sure the model finished loading before sending a message.`;
  }
  return err.message;
}

export function useWebLLM() {
  const enginesRef = useRef<Map<string, ModelEngineEntry>>(new Map());
  const loadingModelRef = useRef<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [modelStatus, setModelStatus] = useState<Record<string, ModelStatus>>(
    () => Object.fromEntries(MODEL_IDS.map((id) => [id, "idle"]))
  );
  const [loadProgress, setLoadProgress] = useState<Record<string, number>>(
    () => Object.fromEntries(MODEL_IDS.map((id) => [id, 0]))
  );
  const [loadStatus, setLoadStatus] = useState<Record<string, string>>(
    () => Object.fromEntries(MODEL_IDS.map((id) => [id, ""]))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, GenerationResult>>(
    () => Object.fromEntries(MODEL_IDS.map((id) => [id, createEmptyResult()]))
  );
  const [error, setError] = useState<string | null>(null);
  const [gpuVendor, setGpuVendor] = useState<string | null>(null);
  const [gpuMaxBufferSize, setGpuMaxBufferSize] = useState<number | null>(null);

  useEffect(() => {
    const gpu = (navigator as Navigator & { gpu?: unknown }).gpu;
    if (!gpu) {
      setError(
        "WebGPU is not supported in this browser. Please use a WebGPU-compatible browser (Chrome 113+, Edge 113+)."
      );
      return;
    }
    setEngineReady(true);

    const engines = enginesRef.current;
    return () => {
      for (const entry of engines.values()) {
        entry.worker.terminate();
      }
      engines.clear();
    };
  }, []);

  const loadModel = useCallback(
    async (modelId: string) => {
      if (enginesRef.current.has(modelId)) return;

      loadingModelRef.current = modelId;
      setModelStatus((prev) => ({ ...prev, [modelId]: "loading" }));

      try {
        const worker = new Worker(
          new URL("../lib/webllm-worker.ts", import.meta.url),
          { type: "module" }
        );

        const engine = new WebWorkerMLCEngine(worker, {
          initProgressCallback: (report: { progress: number; text: string }) => {
            if (loadingModelRef.current === modelId) {
              setLoadProgress((prev) => ({
                ...prev,
                [modelId]: Math.round(report.progress * 100),
              }));
              setLoadStatus((prev) => ({
                ...prev,
                [modelId]: report.text,
              }));
            }
          },
          appConfig,
        });

        await engine.reload(modelId, MODELS[modelId]?.chatOptions);

        enginesRef.current.set(modelId, { worker, engine });
        setModelStatus((prev) => ({ ...prev, [modelId]: "ready" }));

        // Collect GPU info on first model load
        if (!gpuVendor) {
          try {
            const vendor = await engine.getGPUVendor();
            const maxBufferSize = await engine.getMaxStorageBufferBindingSize();
            setGpuVendor(vendor);
            setGpuMaxBufferSize(maxBufferSize);
          } catch {
            // GPU info is non-critical
          }
        }
      } catch (err) {
        enginesRef.current.delete(modelId);
        setModelStatus((prev) => ({ ...prev, [modelId]: "error" }));
        const detail = describeError(err);
        setError(`Could not load ${MODELS[modelId]?.name ?? modelId}: ${detail}`);
      } finally {
        loadingModelRef.current = null;
        setLoadStatus((prev) => ({ ...prev, [modelId]: "" }));
      }
    },
    [gpuVendor]
  );

  const unloadModel = useCallback(
    async (modelId: string) => {
      const entry = enginesRef.current.get(modelId);
      if (!entry) return;

      setModelStatus((prev) => ({ ...prev, [modelId]: "idle" }));
      setLoadProgress((prev) => ({ ...prev, [modelId]: 0 }));

      try {
        await entry.engine.unload();
      } catch {
        // Unload may fail; proceed with cleanup anyway
      }

      entry.worker.terminate();
      enginesRef.current.delete(modelId);
    },
    []
  );

  const cancelGenerationRef = useRef(false);
  const deviceLostRetryRef = useRef(false);

  const isDeviceLostError = useCallback((err: unknown): boolean => {
    if (!(err instanceof Error)) return false;
    const msg = err.message.toLowerCase();
    const name = err.name?.toLowerCase() ?? "";
    return (
      name.includes("gpudevlost") ||
      (name.includes("device") && name.includes("lost")) ||
      (msg.includes("device") && (msg.includes("lost") || msg.includes("removed"))) ||
      msg.includes("webgpu device") ||
      msg.includes("gpu device")
    );
  }, []);

  const reinitializeSingleEngine = useCallback(async (modelId: string) => {
    const oldEntry = enginesRef.current.get(modelId);
    if (oldEntry) {
      oldEntry.worker.terminate();
      enginesRef.current.delete(modelId);
    }

    setModelStatus((prev) => ({ ...prev, [modelId]: "loading" }));
    setLoadProgress((prev) => ({ ...prev, [modelId]: 0 }));

    const worker = new Worker(
      new URL("../lib/webllm-worker.ts", import.meta.url),
      { type: "module" }
    );

    const engine = new WebWorkerMLCEngine(worker, {
      initProgressCallback: (report: { progress: number; text: string }) => {
        if (loadingModelRef.current === modelId) {
          setLoadProgress((prev) => ({
            ...prev,
            [modelId]: Math.round(report.progress * 100),
          }));
          setLoadStatus((prev) => ({
            ...prev,
            [modelId]: report.text,
          }));
        }
      },
      appConfig,
    });

    loadingModelRef.current = modelId;
    await engine.reload(modelId, MODELS[modelId]?.chatOptions);
    enginesRef.current.set(modelId, { worker, engine });
    setModelStatus((prev) => ({ ...prev, [modelId]: "ready" }));
    loadingModelRef.current = null;
    setLoadStatus((prev) => ({ ...prev, [modelId]: "" }));
  }, []);

  const generate = useCallback(
    async (prompt: string, modelIds: string[], config?: InferenceConfig) => {
      if (modelIds.length === 0 || !prompt.trim()) return;

      const readyModels = modelIds.filter((id) => {
        const status = modelStatus[id];
        return status === "ready" && enginesRef.current.has(id);
      });
      const skippedModels = modelIds.filter((id) => {
        const status = modelStatus[id];
        return status !== "ready" || !enginesRef.current.has(id);
      });

      if (readyModels.length === 0) {
        setError(
          "No models are ready. Wait for loading to finish before sending a message."
        );
        return;
      }

      if (skippedModels.length > 0) {
        const skippedNames = skippedModels
          .map((id) => `${MODELS[id]?.name ?? id} (${modelStatus[id]})`)
          .join(", ");
        setError(
          `Skipping ${skippedNames} — not loaded yet. Generation continues with the remaining model(s).`
        );
      }

      setIsGenerating(true);
      cancelGenerationRef.current = false;
      deviceLostRetryRef.current = false;

      setResults((prev) => {
        const next = { ...prev };
        for (const id of readyModels) {
          next[id] = { ...createEmptyResult(), isStreaming: true };
        }
        return next;
      });

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
                  text: `Error: Recovery failed after device loss. Please refresh the page.`,
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
              // invalid JSON from model — pass empty args
            }

            const result = await executeTool(tc.name, parsedArgs);

            toolCalls.push({
              id: tc.id,
              name: tc.name,
              arguments: tc.arguments,
              result,
            });

            followUpMessages.push({
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: tc.id,
                  type: "function",
                  function: { name: tc.name, arguments: tc.arguments },
                },
              ],
            });

            followUpMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: result,
            });
          }

          setResults((prev) => ({
            ...prev,
            [modelId]: {
              ...prev[modelId],
              toolCalls: [...(prev[modelId].toolCalls || []), ...toolCalls],
            },
          }));

          await runModel(modelId, [...conversationMessages, ...followUpMessages], toolDepth + 1);
          return;
        }
      };

      await Promise.all(readyModels.map((id) => runModel(id)));
      setIsGenerating(false);
    },
    [isDeviceLostError, reinitializeSingleEngine, modelStatus]
  );

  const cancelGeneration = useCallback(() => {
    cancelGenerationRef.current = true;
    for (const entry of enginesRef.current.values()) {
      try {
        entry.engine.interruptGenerate();
      } catch {
        // Ignore errors on interrupt
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

  return {
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
