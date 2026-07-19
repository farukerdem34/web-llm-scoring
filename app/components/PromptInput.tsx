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
          className="w-full h-32 p-4 border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500 dark:disabled:bg-zinc-950"
        />
        <div className="absolute bottom-2 right-2 text-xs text-zinc-400">
          {prompt.length}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isDisabled || isEmpty}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-300 disabled:cursor-not-allowed dark:disabled:bg-zinc-700"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        {isGenerating && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
          className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
