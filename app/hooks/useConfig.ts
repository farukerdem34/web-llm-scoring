"use client";

import { useState, useEffect, useCallback } from "react";
import {
  InferenceConfig,
  DEFAULT_INFERENCE_CONFIG,
} from "@/app/lib/types";

const STORAGE_KEY = "llm-playground-inference-config";

function loadConfig(): InferenceConfig {
  if (typeof window === "undefined") return DEFAULT_INFERENCE_CONFIG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_INFERENCE_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_INFERENCE_CONFIG;
}

export function useConfig() {
  const [config, setConfig] = useState<InferenceConfig>(() => loadConfig());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const updateConfig = useCallback(
    <K extends keyof InferenceConfig>(key: K, value: InferenceConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_INFERENCE_CONFIG);
  }, []);

  const resetSingle = useCallback((key: keyof InferenceConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: DEFAULT_INFERENCE_CONFIG[key],
    }));
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
    resetSingle,
  };
}
