"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as webllm from "@mlc-ai/web-llm";
import { MODEL_IDS, MODELS } from "@/app/lib/models";
import { ModelStatus, GenerationResult } from "@/app/lib/types";

export function useWebLLM() {
  const engineRef = useRef<webllm.WebWorkerMLCEngine | null>(null);
  const loadingModelRef = useRef<string | null>(null);
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

  useEffect(() => {
    const initEngine = async () => {
      try {
        const worker = new Worker(
          new URL("../lib/webllm-worker.ts", import.meta.url),
          { type: "module" }
        );
        const engine = new webllm.WebWorkerMLCEngine(worker, {
          initProgressCallback: (report: webllm.InitProgressReport) => {
            if (loadingModelRef.current) {
              setLoadProgress((prev) => ({
                ...prev,
                [loadingModelRef.current!]: Math.round(report.progress * 100),
              }));
            }
          },
        });
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
      loadingModelRef.current = modelId;
      setModelStatus((prev) => ({ ...prev, [modelId]: "loading" }));
      try {
        await engineRef.current.reload(modelId);
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
        await engineRef.current.unload();
        setModelStatus((prev) => {
          const next = { ...prev };
          for (const id of MODEL_IDS) {
            next[id] = "idle";
          }
          return next;
        });
        setLoadProgress((prev) => {
          const next = { ...prev };
          for (const id of MODEL_IDS) {
            next[id] = 0;
          }
          return next;
        });
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
