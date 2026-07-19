"use client";

import { InferenceConfig, DEFAULT_INFERENCE_CONFIG } from "@/app/lib/types";
import { ConfigSlider } from "./ConfigSlider";
import { ConfigToggle } from "./ConfigToggle";
import { ConfigSection } from "./ConfigSection";

interface ConfigSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  config: InferenceConfig;
  onUpdate: <K extends keyof InferenceConfig>(
    key: K,
    value: InferenceConfig[K]
  ) => void;
  onReset: () => void;
  onResetSingle: (key: keyof InferenceConfig) => void;
}

export function ConfigSidebar({
  isOpen,
  onClose,
  config,
  onUpdate,
  onReset,
  onResetSingle,
}: ConfigSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-50 shadow-xl overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Inference Settings
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Reset All
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Sampling Parameters */}
          <ConfigSection title="Sampling">
            <ConfigSlider
              label="Temperature"
              description="Higher values make output more random, lower values more focused"
              value={config.temperature}
              min={0}
              max={2}
              step={0.1}
              defaultValue={DEFAULT_INFERENCE_CONFIG.temperature}
              onChange={(v) => onUpdate("temperature", v)}
              onReset={() => onResetSingle("temperature")}
            />
            <ConfigSlider
              label="Top P"
              description="Nucleus sampling - considers only top probability mass tokens"
              value={config.top_p}
              min={0}
              max={1}
              step={0.05}
              defaultValue={DEFAULT_INFERENCE_CONFIG.top_p}
              onChange={(v) => onUpdate("top_p", v)}
              onReset={() => onResetSingle("top_p")}
            />
            <ConfigSlider
              label="Max Tokens"
              description="Maximum number of tokens to generate"
              value={config.max_tokens}
              min={1}
              max={4096}
              step={1}
              defaultValue={DEFAULT_INFERENCE_CONFIG.max_tokens}
              onChange={(v) => onUpdate("max_tokens", Math.round(v))}
              onReset={() => onResetSingle("max_tokens")}
            />
          </ConfigSection>

          {/* Penalty Parameters */}
          <ConfigSection title="Penalties">
            <ConfigSlider
              label="Frequency Penalty"
              description="Penalizes tokens based on their frequency in text so far"
              value={config.frequency_penalty}
              min={-2}
              max={2}
              step={0.1}
              defaultValue={DEFAULT_INFERENCE_CONFIG.frequency_penalty}
              onChange={(v) => onUpdate("frequency_penalty", v)}
              onReset={() => onResetSingle("frequency_penalty")}
            />
            <ConfigSlider
              label="Presence Penalty"
              description="Penalizes tokens based on whether they appear in text"
              value={config.presence_penalty}
              min={-2}
              max={2}
              step={0.1}
              defaultValue={DEFAULT_INFERENCE_CONFIG.presence_penalty}
              onChange={(v) => onUpdate("presence_penalty", v)}
              onReset={() => onResetSingle("presence_penalty")}
            />
            <ConfigSlider
              label="Repetition Penalty"
              description="MLC-specific: penalizes repeated tokens. >1 encourages new tokens"
              value={config.repetition_penalty}
              min={0.1}
              max={2}
              step={0.1}
              defaultValue={DEFAULT_INFERENCE_CONFIG.repetition_penalty}
              onChange={(v) => onUpdate("repetition_penalty", v)}
              onReset={() => onResetSingle("repetition_penalty")}
            />
          </ConfigSection>

          {/* MLC-Specific */}
          <ConfigSection title="MLC-Specific" defaultOpen={false}>
            <ConfigToggle
              label="Ignore EOS"
              description="Bypasses stop strings, generates until max_tokens"
              checked={config.ignore_eos}
              defaultChecked={DEFAULT_INFERENCE_CONFIG.ignore_eos}
              onChange={(v) => onUpdate("ignore_eos", v)}
              onReset={() => onResetSingle("ignore_eos")}
            />
          </ConfigSection>
        </div>
      </div>
    </>
  );
}
