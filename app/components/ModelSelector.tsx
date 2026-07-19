"use client";

import { MODELS, getModelIds } from "@/app/lib/models";
import { ModelStatus } from "@/app/lib/types";
import { ProgressBar } from "./ProgressBar";

interface ModelSelectorProps {
  selectedModels: string[];
  modelStatus: Record<string, ModelStatus>;
  loadProgress: Record<string, number>;
  onToggle: (modelId: string) => void;
}

export function ModelSelector({
  selectedModels,
  modelStatus,
  loadProgress,
  onToggle,
}: ModelSelectorProps) {
  const modelIds = getModelIds();

  return (
    <div className="flex gap-4 flex-wrap">
      {modelIds.map((modelId) => {
        const model = MODELS[modelId];
        if (!model) return null;
        const status = modelStatus[modelId] || "idle";
        const progress = loadProgress[modelId] || 0;
        const isSelected = selectedModels.includes(modelId);

        return (
          <div
            key={modelId}
            className={`flex-1 min-w-[200px] border rounded-lg p-4 transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {model.name}
                </h3>
                <p className="text-sm text-zinc-500">{model.params} parameters</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(modelId)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="mt-2">
              <StatusBadge status={status} />
            </div>

            {status === "loading" && (
              <div className="mt-3">
                <ProgressBar progress={progress} label="Loading model" />
              </div>
            )}

            {model.description && (
              <p className="mt-2 text-xs text-zinc-400">{model.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  const styles: Record<ModelStatus, string> = {
    idle: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    loading: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
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
              ? "bg-yellow-500 animate-pulse"
              : status === "error"
                ? "bg-red-500"
                : "bg-zinc-400"
        }`}
      />
      {labels[status]}
    </span>
  );
}
