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
          className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:disabled:bg-slate-950"
        />
        <div className="absolute bottom-2 right-2 text-xs text-slate-400">
          {prompt.length}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isDisabled || isEmpty}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700 transition-colors"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        {isGenerating && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
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
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
