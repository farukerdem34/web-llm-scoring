// app/lib/models.ts
import { ModelConfig } from "./types";

export const MODELS: Record<string, ModelConfig> = {
  "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC": {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    name: "TinyLlama 1.1B",
    params: "1.1B",
    description: "Lightest, fastest",
    color: "green",
    group: "base",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
    chatOptions: { context_window_size: 2048 },
  },
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC": {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 0.5B",
    params: "0.5B",
    description: "Compact, multilingual",
    color: "cyan",
    group: "base",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
    chatOptions: { context_window_size: 2048 },
  },
  "Llama-3.2-1B-Instruct-q4f16_1-MLC": {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    params: "1B",
    description: "Balanced, Meta",
    color: "blue",
    group: "base",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
    chatOptions: { context_window_size: 4096 },
  },
  "gemma-2-2b-it-q4f32_1-MLC": {
    id: "gemma-2-2b-it-q4f32_1-MLC",
    name: "Gemma 2B",
    params: "2B",
    description: "Fast, Google",
    color: "amber",
    group: "gemma",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
    chatOptions: { context_window_size: 4096 },
  },
  "gemma-2-9b-it-q4f32_1-MLC": {
    id: "gemma-2-9b-it-q4f32_1-MLC",
    name: "Gemma 9B",
    params: "9B",
    description: "Highest quality",
    color: "purple",
    group: "gemma",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
    chatOptions: { context_window_size: 8192 },
  },
  "gemma3-1b-it-q4f16_1-MLC": {
    id: "gemma3-1b-it-q4f16_1-MLC",
    name: "Gemma 3 1B",
    params: "1B",
    description: "Stable, prebuilt",
    color: "rose",
    group: "gemma",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
    chatOptions: { context_window_size: 8192, sliding_window_size: -1 },
  },
  "mlc-ai/gemma3-1b-it-q4f16_1-MLC": {
    id: "mlc-ai/gemma3-1b-it-q4f16_1-MLC",
    name: "Gemma 3 1B (alternate)",
    params: "1B",
    description: "Alt. q4f16 build",
    color: "cyan",
    group: "gemma",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
    chatOptions: { context_window_size: 8192, sliding_window_size: -1 },
  },
};

export const MODEL_IDS = Object.keys(MODELS);

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODELS[modelId];
}

export function getModelIds(): string[] {
  return MODEL_IDS;
}

export const GROUP_ORDER: Record<string, { label: string; order: number }> = {
  base: { label: "Models", order: 0 },
  gemma: { label: "Gemma", order: 1 },
};

export function getModelsByGroup(): [string, ModelConfig[]][] {
  const groups = new Map<string, ModelConfig[]>();
  for (const model of Object.values(MODELS)) {
    const g = groups.get(model.group) || [];
    g.push(model);
    groups.set(model.group, g);
  }
  return Array.from(groups.entries()).sort(
    (a, b) => (GROUP_ORDER[a[0]]?.order ?? 99) - (GROUP_ORDER[b[0]]?.order ?? 99)
  );
}
