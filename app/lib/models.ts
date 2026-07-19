// app/lib/models.ts
import { ModelConfig } from "./types";

export const MODELS: Record<string, ModelConfig> = {
  "gemma-2-2b-it-q4f32_1-MLC": {
    id: "gemma-2-2b-it-q4f32_1-MLC",
    name: "Gemma 2B",
    params: "2B",
    description: "Fast, lightweight",
    color: "blue",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
  },
  "gemma-2-9b-it-q4f32_1-MLC": {
    id: "gemma-2-9b-it-q4f32_1-MLC",
    name: "Gemma 9B",
    params: "9B",
    description: "Balanced quality",
    color: "purple",
    defaultParams: { temperature: 0.7, top_p: 0.9, max_tokens: 200 },
  },
};

export const MODEL_IDS = Object.keys(MODELS);

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODELS[modelId];
}

export function getModelIds(): string[] {
  return MODEL_IDS;
}
