"use client";

import { useState, useRef, useEffect } from "react";
import { EvaluateButton } from "./EvaluateButton";
import { JudgeModelSelector } from "./JudgeModelSelector";
import { type ModelStatus } from "@/app/lib/types";

interface PromptInputProps {
  isGenerating: boolean;
  hasReadyModel: boolean;
  hasResponses: boolean;
  isScoring: boolean;
  judgeModelId: string;
  modelStatus: Record<string, ModelStatus>;
  onGenerate: (prompt: string) => void;
  onClear: () => void;
  onCancel: () => void;
  onEvaluate: () => void;
  onSetJudgeModel: (modelId: string) => void;
}

const MAX_CHARS = 4096;

export function PromptInput({
  isGenerating,
  hasReadyModel,
  hasResponses,
  isScoring,
  judgeModelId,
  modelStatus,
  onGenerate,
  onClear,
  onCancel,
  onEvaluate,
  onSetJudgeModel,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (prompt.trim() && hasReadyModel && !isGenerating) {
      onGenerate(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape" && isGenerating) {
      onCancel();
    }
  };

  const isDisabled = !hasReadyModel || isGenerating;
  const isEmpty = prompt.trim().length === 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setPrompt(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={
            hasReadyModel
              ? "Enter your prompt here... (Enter to submit, Shift+Enter for newline)"
              : "Load at least one model to start..."
          }
          className="w-full h-40 p-4 border border-[var(--sand-200)] rounded-xl resize-none focus:outline-none focus:border-[var(--terracotta)] focus:ring-4 focus:ring-[rgba(217,119,87,0.1)] disabled:bg-[var(--sand-100)] disabled:text-[var(--ink-faint)] bg-white dark:bg-[var(--sand-100)] text-[var(--ink)] placeholder-[var(--ink-faint)] transition-colors"
        />
        <div className="absolute bottom-3 right-3 text-xs text-[var(--ink-faint)] select-none">
          {prompt.length}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isDisabled || isEmpty}
          className="h-12 px-6 text-white rounded-xl font-medium hover:shadow-[var(--shadow-terracotta)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30 focus:ring-offset-2 disabled:bg-[var(--sand-300)] disabled:text-[var(--ink-faint)] disabled:cursor-not-allowed disabled:shadow-none transition-all cursor-pointer"
          style={!isDisabled && !isEmpty ? { background: 'var(--gradient-primary)' } : undefined}
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        {isGenerating && (
          <button
            onClick={onCancel}
            className="h-12 px-4 border border-[var(--sand-200)] text-[var(--ink-muted)] rounded-xl font-medium hover:bg-[var(--sand-100)] focus:outline-none focus:ring-2 focus:ring-[var(--sand-400)] focus:ring-offset-2 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        <button
          onClick={() => {
            onClear();
            setPrompt("");
          }}
          disabled={isGenerating}
          className="h-12 px-4 border border-[var(--sand-200)] text-[var(--ink-muted)] rounded-xl font-medium hover:bg-[var(--sand-100)] focus:outline-none focus:ring-2 focus:ring-[var(--sand-400)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>

      {hasResponses && !isGenerating && (
        <div className="flex items-center gap-3">
          <JudgeModelSelector
            selectedModelId={judgeModelId}
            modelStatus={modelStatus}
            onSelect={onSetJudgeModel}
          />
          <EvaluateButton
            onClick={onEvaluate}
            disabled={!hasReadyModel || !judgeModelId}
            isScoring={isScoring}
          />
        </div>
      )}
    </div>
  );
}
