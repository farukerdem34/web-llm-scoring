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
}

export const DEFAULT_INFERENCE_CONFIG: InferenceConfig = {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 200,
  frequency_penalty: 0,
  presence_penalty: 0,
  repetition_penalty: 1.0,
  ignore_eos: false,
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

