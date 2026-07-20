"use client";

import { useState } from "react";

interface SystemPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const MAX_CHARS = 4096;

export function SystemPromptInput({
  value,
  onChange,
  disabled,
}: SystemPromptInputProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--sand-200)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--sand-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-[var(--ink-faint)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>System Prompt</span>
          {value.trim() && (
            <span className="text-xs text-[var(--terracotta)] font-normal bg-[var(--terracotta-light)] px-1.5 py-0.5 rounded">
              Active
            </span>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-[var(--ink-faint)] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  onChange(e.target.value);
                }
              }}
              disabled={disabled}
              placeholder="Set a system prompt to guide model behavior..."
              className="w-full h-24 p-3 border border-[var(--sand-200)] rounded-lg resize-none focus:outline-none focus:border-[var(--terracotta)] focus:ring-4 focus:ring-[rgba(217,119,87,0.1)] disabled:bg-[var(--sand-100)] disabled:text-[var(--ink-faint)] bg-white dark:bg-[var(--sand-100)] text-[var(--ink)] placeholder-[var(--ink-faint)] text-sm transition-colors"
            />
            <div className="absolute bottom-2 right-2 text-xs text-[var(--ink-faint)] select-none">
              {value.length}/{MAX_CHARS}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
