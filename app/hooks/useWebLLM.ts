"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  WebWorkerMLCEngine,
  prebuiltAppConfig,
  type AppConfig,
} from "@mlc-ai/web-llm";
import { MODEL_IDS, MODELS } from "@/app/lib/models";
import { ModelStatus, GenerationResult } from "@/app/lib/types";

const appConfig: AppConfig = { ...prebuiltAppConfig, cacheBackend: "indexeddb" };

export function useWebLLM() {
  const engineRef = useRef<WebWorkerMLCEngine | null>(null);
  const loadingModelRef = useRef<string | null>(null);
  const loadedModelsRef = useRef<Set<string>>(new Set());
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
  const [gpuVendor, setGpuVendor] = useState<string | null>(null);
  const [gpuMaxBufferSize, setGpuMaxBufferSize] = useState<number | null>(null);

  useEffect(() => {
    const initEngine = async () => {
      const gpu = (navigator as Navigator & { gpu?: unknown }).gpu;
      if (!gpu) {
        setError(
          "WebGPU is not supported in this browser. Please use a WebGPU-compatible browser (Chrome 113+, Edge 113+)."
        );
        return;
      }
      try {
        const worker = new Worker(
          new URL("../lib/webllm-worker.ts", import.meta.url),
          { type: "module" }
        );
        workerRef.current = worker;
        const engine = new WebWorkerMLCEngine(worker, {
          initProgressCallback: (report: { progress: number }) => {
            if (loadingModelRef.current) {
              setLoadProgress((prev) => ({
                ...prev,
                [loadingModelRef.current!]: Math.round(report.progress * 100),
              }));
            }
          },
          appConfig,
        });
        engineRef.current = engine;
        try {
          const vendor = await engine.getGPUVendor();
          const maxBufferSize = await engine.getMaxStorageBufferBindingSize();
          setGpuVendor(vendor);
          setGpuMaxBufferSize(maxBufferSize);
          if (maxBufferSize < 1_073_741_824) {
            setError(
              `GPU buffer size (${(maxBufferSize / 1_073_741_824).toFixed(1)} GB) is below 1 GB. The 9B model may not load.`
            );
          }
        } catch {
          // GPU info is non-critical; proceed without it
        }
        setEngineReady(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize engine"
        );
      }
    };
    initEngine();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const loadModel = useCallback(
    async (modelId: string) => {
      if (!engineRef.current) return;
      loadingModelRef.current = modelId;
      setModelStatus((prev) => ({ ...prev, [modelId]: "loading" }));
      try {
        await engineRef.current.reload(modelId);
        loadedModelsRef.current.add(modelId);
        setModelStatus((prev) => ({ ...prev, [modelId]: "ready" }));
      } catch (err) {
        setModelStatus((prev) => ({ ...prev, [modelId]: "error" }));
        setError(
          err instanceof Error
            ? `Failed to load ${MODELS[modelId]?.name}: ${err.message}`
            : `Failed to load model`
        );
      } finally {
        loadingModelRef.current = null;
      }
    },
    []
  );

  const unloadModel = useCallback(
    async (modelId: string) => {
      if (!engineRef.current) return;
      try {
        // Mark the target model as idle immediately for responsive UI
        loadedModelsRef.current.delete(modelId);
        setModelStatus((prev) => ({ ...prev, [modelId]: "idle" }));
        setLoadProgress((prev) => ({ ...prev, [modelId]: 0 }));

        // WebLLM's unload() unloads ALL models from the engine.
        // We must reload every remaining model that should still be loaded.
        const remainingModels = Array.from(loadedModelsRef.current);

        // Mark remaining models as reloading so the UI reflects the brief downtime
        for (const id of remainingModels) {
          setModelStatus((prev) => ({ ...prev, [id]: "loading" }));
        }

        await engineRef.current.unload();

        // Reload each remaining model sequentially to avoid race conditions
        for (const id of remainingModels) {
          try {
            await engineRef.current.reload(id);
            setModelStatus((prev) => ({ ...prev, [id]: "ready" }));
          } catch {
            loadedModelsRef.current.delete(id);
            setModelStatus((prev) => ({ ...prev, [id]: "error" }));
            setError(
              `Failed to reload ${MODELS[id]?.name ?? id} after unloading`
            );
          }
        }
      } catch (err) {
        const remainingModels = Array.from(loadedModelsRef.current);
        for (const id of remainingModels) {
          setModelStatus((prev) => ({ ...prev, [id]: "ready" }));
        }
        setError(
          err instanceof Error ? err.message : "Failed to unload model"
        );
      }
    },
    []
  );

  const cancelGenerationRef = useRef(false);
  const deviceLostRetryRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);

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

  const reinitializeEngine = useCallback(async () => {
    setError("WebGPU device lost. Reinitializing engine...");

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    engineRef.current = null;
    setEngineReady(false);

    for (const id of loadedModelsRef.current) {
      setModelStatus((prev) => ({ ...prev, [id]: "loading" }));
      setLoadProgress((prev) => ({ ...prev, [id]: 0 }));
    }

    const worker = new Worker(
      new URL("../lib/webllm-worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    const engine = new WebWorkerMLCEngine(worker, {
      initProgressCallback: (report: { progress: number }) => {
        if (loadingModelRef.current) {
          setLoadProgress((prev) => ({
            ...prev,
            [loadingModelRef.current!]: Math.round(report.progress * 100),
          }));
        }
      },
      appConfig,
    });
    engineRef.current = engine;
    setEngineReady(true);

    const modelsToReload = Array.from(loadedModelsRef.current);
    for (const modelId of modelsToReload) {
      loadingModelRef.current = modelId;
      try {
        await engine.reload(modelId);
        setModelStatus((prev) => ({ ...prev, [modelId]: "ready" }));
      } catch {
        loadedModelsRef.current.delete(modelId);
        setModelStatus((prev) => ({ ...prev, [modelId]: "error" }));
        setError(
          `Failed to reload ${MODELS[modelId]?.name ?? modelId} after device loss`
        );
      } finally {
        loadingModelRef.current = null;
      }
    }

    setError("Engine reinitialized. Retrying generation...");
  }, []);

  const generate = useCallback(
    async (prompt: string, modelIds: string[]) => {
      if (!engineRef.current || modelIds.length === 0 || !prompt.trim()) return;

      setIsGenerating(true);
      cancelGenerationRef.current = false;
      deviceLostRetryRef.current = false;
      setError(null);

      setResults((prev) => {
        const next = { ...prev };
        for (const id of modelIds) {
          next[id] = { ...createEmptyResult(), isStreaming: true };
        }
        return next;
      });

      const engine = engineRef.current;

      const runModel = async (modelId: string, activeEngine?: WebWorkerMLCEngine) => {
        const currentEngine = activeEngine ?? engine;
        const request: import("@mlc-ai/web-llm").ChatCompletionRequest = {
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
          const stream = await currentEngine.chat.completions.create(request);

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
              await reinitializeEngine();
              const newEngine = engineRef.current;
              if (!newEngine) throw new Error("Engine reinitialization failed");
              setResults((prev) => {
                const next = { ...prev };
                for (const id of modelIds) {
                  next[id] = { ...createEmptyResult(), isStreaming: true };
                }
                return next;
              });
              await newEngine.resetChat();
              await Promise.all(modelIds.map((id) => runModel(id, newEngine)));
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
              text: `Error: ${err instanceof Error ? err.message : "Generation failed"}`,
              isStreaming: false,
            },
          }));
        }
      };

      await engine.resetChat();

      await Promise.all(modelIds.map((id) => runModel(id)));
      setIsGenerating(false);
    },
    [isDeviceLostError, reinitializeEngine]
  );

  const cancelGeneration = useCallback(() => {
    cancelGenerationRef.current = true;
    if (engineRef.current) {
      engineRef.current.interruptGenerate();
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
