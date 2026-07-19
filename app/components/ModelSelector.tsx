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
            className={`flex-1 min-w-[200px] border rounded-lg p-4 transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {model.name}
                </h3>
                <p className="text-sm text-slate-500">{model.params} parameters</p>
              </div>
              <button
                role="switch"
                aria-checked={isSelected}
                aria-label={`Toggle ${model.name}`}
                onClick={() => onToggle(modelId)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSelected ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
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
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 truncate">
                    {statusText}
                  </p>
                )}
              </div>
            )}

            {model.description && (
              <p className="mt-2 text-xs text-slate-400">{model.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  const styles: Record<ModelStatus, string> = {
    idle: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
    loading: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    ready: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
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
            ? "bg-green-500"
            : status === "loading"
              ? "bg-amber-500 animate-pulse"
              : status === "error"
                ? "bg-red-500"
                : "bg-slate-400"
        }`}
      />
      {labels[status]}
    </span>
  );
}
