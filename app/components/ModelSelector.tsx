"use client";

import { MODELS, getModelIds } from "@/app/lib/models";
import { ModelStatus } from "@/app/lib/types";
import { ProgressBar } from "./ProgressBar";

interface ModelSelectorProps {
  selectedModels: string[];
  modelStatus: Record<string, ModelStatus>;
  loadProgress: Record<string, number>;
  loadStatus: Record<string, string>;
  onToggle: (modelId: string) => void;
}

export function ModelSelector({
  selectedModels,
  modelStatus,
  loadProgress,
  loadStatus,
  onToggle,
}: ModelSelectorProps) {
  const modelIds = getModelIds();

  return (
    <div className="flex gap-4 flex-col sm:flex-row">
      {modelIds.map((modelId) => {
        const model = MODELS[modelId];
        if (!model) return null;
        const status = modelStatus[modelId] || "idle";
        const progress = loadProgress[modelId] || 0;
        const statusText = loadStatus[modelId] || "";
        const isSelected = selectedModels.includes(modelId);

        return (
          <div
            key={modelId}
            className={`flex-1 min-w-[200px] border rounded-xl p-4 transition-all ${
              isSelected
                ? "border-[var(--terracotta)] bg-[var(--terracotta-light)]"
                : "border-[var(--sand-200)] bg-white hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-[var(--ink)]">
                  {model.name}
                </h3>
                <p className="text-sm text-[var(--ink-muted)]">
                  {model.params} parameters
                </p>
              </div>
              <button
                role="switch"
                aria-checked={isSelected}
                aria-label={`Toggle ${model.name}`}
                onClick={() => onToggle(modelId)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30 focus:ring-offset-2 cursor-pointer ${
                  isSelected ? "bg-[var(--terracotta)]" : "bg-[var(--sand-300)]"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isSelected ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="mt-2">
              <StatusBadge status={status} />
            </div>

            {status === "loading" && (
              <div className="mt-3">
                <ProgressBar progress={progress} label="Loading model" />
                {statusText && (
                  <p className="mt-1 text-xs text-[var(--ink-faint)] truncate">
                    {statusText}
                  </p>
                )}
              </div>
            )}

            {model.description && (
              <p className="mt-2 text-xs text-[var(--ink-faint)]">
                {model.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  const styles: Record<ModelStatus, string> = {
    idle: "bg-[var(--sand-100)] text-[var(--ink-muted)]",
    loading: "bg-[var(--terracotta-light)] text-[var(--terracotta-dark)]",
    ready: "bg-emerald-50 text-emerald-700",
    error: "bg-red-50 text-red-700",
  };

  const labels: Record<ModelStatus, string> = {
    idle: "Idle",
    loading: "Loading...",
    ready: "Ready",
    error: "Error",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "ready"
            ? "bg-emerald-500"
            : status === "loading"
              ? "bg-[var(--terracotta)] animate-pulse"
              : status === "error"
                ? "bg-red-500"
                : "bg-[var(--sand-400)]"
        }`}
      />
      {labels[status]}
    </span>
  );
}
