// app/lib/types.ts
export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface InferenceConfig {
  temperature: number;
  top_p: number;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
  repetition_penalty: number;
  ignore_eos: boolean;
  system_prompt: string;
}

export const DEFAULT_INFERENCE_CONFIG: InferenceConfig = {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 200,
  frequency_penalty: 0,
  presence_penalty: 0,
  repetition_penalty: 1.0,
  ignore_eos: false,
  system_prompt: "",
};

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
  chatOptions?: {
    context_window_size?: number;
    sliding_window_size?: number;
    repetition_penalty?: number;
  };
}

export interface GenerationResult {
  text: string;
  firstTokenTime: number | null;
  inferenceTime: number | null;
  tokenCount: number | null;
  tokensPerSecond: number | null;
  isStreaming: boolean;
  scores?: ScoreResult;
}

export type ScoreCriterion = "accuracy" | "helpfulness" | "coherence" | "completeness";

export const SCORE_CRITERIA: ScoreCriterion[] = [
  "accuracy",
  "helpfulness",
  "coherence",
  "completeness",
];

export const SCORE_CRITERIA_LABELS: Record<ScoreCriterion, string> = {
  accuracy: "Accuracy",
  helpfulness: "Helpfulness",
  coherence: "Coherence",
  completeness: "Completeness",
};

export const SCORE_CRITERIA_DESCRIPTIONS: Record<ScoreCriterion, string> = {
  accuracy: "Is the information correct and factual?",
  helpfulness: "Does it effectively address the user's needs?",
  coherence: "Is it well-structured and logical?",
  completeness: "Does it cover all aspects of the question?",
};

export interface ScoreResult {
  modelId: string;
  scores: Record<ScoreCriterion, number>;
  overallScore: number;
  reasoning: string;
}

export interface EvaluationResult {
  prompt: string;
  judgeModelId: string;
  scores: ScoreResult[];
  timestamp: number;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "active" | "inactive" | "suspended";
  created_at?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiError {
  error: string;
  message: string;
  code: number;
}

// Multi-worker engine types
export interface ModelEngineEntry {
  worker: Worker;
  engine: import("@mlc-ai/web-llm").WebWorkerMLCEngine;
}

