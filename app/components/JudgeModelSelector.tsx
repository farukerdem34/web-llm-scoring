"use client";

import { type ModelStatus } from "@/app/lib/types";
import { MODELS } from "@/app/lib/models";

interface JudgeModelSelectorProps {
  selectedModelId: string;
  modelStatus: Record<string, ModelStatus>;
  onSelect: (modelId: string) => void;
}

export function JudgeModelSelector({
  selectedModelId,
  modelStatus,
  onSelect,
}: JudgeModelSelectorProps) {
  const readyModels = Object.entries(modelStatus)
    .filter(([, status]) => status === "ready")
    .map(([id]) => id);

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="judge-model"
        className="text-xs text-[var(--ink-muted)] whitespace-nowrap"
      >
        Judge:
      </label>
      <select
        id="judge-model"
        value={selectedModelId}
        onChange={(e) => onSelect(e.target.value)}
        disabled={readyModels.length === 0}
        className="h-8 px-2 text-xs border border-[var(--sand-200)] rounded-lg bg-white dark:bg-[var(--sand-100)] text-[var(--ink)] focus:outline-none focus:border-[var(--terracotta)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {readyModels.length === 0 ? (
          <option value="">No models ready</option>
        ) : (
          readyModels.map((id) => (
            <option key={id} value={id}>
              {MODELS[id]?.name || id}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
