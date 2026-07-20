"use client";

import { useEffect, useRef } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        style={{ animation: "fade-in 200ms ease-out" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-label="Inference settings"
        className="fixed top-0 right-0 z-50 flex h-full w-[384px] flex-col overflow-hidden border-l border-[var(--sand-200)] bg-white shadow-[var(--shadow-xl)] dark:bg-[var(--ink)]"
        style={{ animation: "slide-in-right 300ms ease-out" }}
      >
        {/* Fixed Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--sand-200)] px-5">
          <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">
            Inference Settings
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="cursor-pointer rounded-[var(--radius-md)] px-2.5 py-1 text-xs font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--sand-100)] hover:text-[var(--ink)]"
            >
              Reset All
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--ink-faint)] transition-colors hover:bg-[var(--sand-100)] hover:text-[var(--ink)]"
              aria-label="Close settings"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
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
              description="Nucleus sampling — considers only top probability mass tokens"
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
              description="MLC-specific: penalizes repeated tokens. &gt;1 encourages new tokens"
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
      </aside>
    </>
  );
}
