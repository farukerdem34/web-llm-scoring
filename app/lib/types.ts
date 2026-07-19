// app/lib/types.ts
export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface ModelConfig {
  id: string;
  name: string;
  params: string;
  description: string;
  color: string; // Tailwind color class for visual identity
  defaultParams: {
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
}

export interface GenerationResult {
  text: string;
  firstTokenTime: number | null;
  inferenceTime: number | null;
  tokenCount: number | null;
  tokensPerSecond: number | null;
  isStreaming: boolean;
}

export interface AppState {
  selectedModels: string[];
  modelStatus: Record<string, ModelStatus>;
  loadProgress: Record<string, number>;
  isGenerating: boolean;
  results: Record<string, GenerationResult>;
  error: string | null;
}
