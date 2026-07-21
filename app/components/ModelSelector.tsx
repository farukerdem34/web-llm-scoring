"use client";

import { getModelsByGroup, GROUP_ORDER } from "@/app/lib/models";
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
  const grouped = getModelsByGroup();

  return (
    <div className="space-y-6">
      {grouped.map(([group, models]) => (
        <div key={group}>
          <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-faint)] mb-3">
            {GROUP_ORDER[group]?.label ?? group}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {models.map((model) => {
              const status = modelStatus[model.id] || "idle";
              const progress = loadProgress[model.id] || 0;
              const statusText = loadStatus[model.id] || "";
              const isSelected = selectedModels.includes(model.id);

              return (
                <div
                  key={model.id}
                  className={`border rounded-xl p-5 transition-all card-hover ${
                    isSelected
                      ? "border-[var(--terracotta)] bg-[var(--terracotta-light)] shadow-[var(--shadow-terracotta)]"
                      : "border-[var(--sand-200)] bg-white dark:bg-[var(--sand-100)]"
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
                      onClick={() => onToggle(model.id)}
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

                  <p className="mt-2 text-xs text-[var(--ink-faint)]">
                    {model.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  const styles: Record<ModelStatus, string> = {
    idle: "bg-[var(--sand-100)] text-[var(--ink-muted)]",
    loading: "bg-[var(--terracotta-light)] text-[var(--terracotta-dark)]",
    ready: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    error: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
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
