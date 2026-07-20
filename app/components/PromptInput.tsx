"use client";

import { useState, useRef, useEffect } from "react";

interface PromptInputProps {
  isGenerating: boolean;
  hasReadyModel: boolean;
  onGenerate: (prompt: string) => void;
  onClear: () => void;
  onCancel: () => void;
}

const MAX_CHARS = 4096;

export function PromptInput({
  isGenerating,
  hasReadyModel,
  onGenerate,
  onClear,
  onCancel,
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
          className="w-full h-32 p-4 border border-[var(--sand-200)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30 focus:border-[var(--terracotta)] disabled:bg-[var(--sand-100)] disabled:text-[var(--ink-faint)] bg-white text-[var(--ink)] placeholder-[var(--ink-faint)] transition-colors"
        />
        <div className="absolute bottom-2 right-2 text-xs text-[var(--ink-faint)]">
          {prompt.length}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isDisabled || isEmpty}
          className="px-6 py-2 bg-[var(--terracotta)] text-white rounded-lg font-medium hover:bg-[var(--terracotta-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30 focus:ring-offset-2 disabled:bg-[var(--sand-300)] disabled:text-[var(--ink-faint)] disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        {isGenerating && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[var(--sand-200)] text-[var(--ink-muted)] rounded-lg font-medium hover:bg-[var(--sand-100)] focus:outline-none focus:ring-2 focus:ring-[var(--sand-400)] focus:ring-offset-2 transition-colors cursor-pointer"
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
          className="px-4 py-2 border border-[var(--sand-200)] text-[var(--ink-muted)] rounded-lg font-medium hover:bg-[var(--sand-100)] focus:outline-none focus:ring-2 focus:ring-[var(--sand-400)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
