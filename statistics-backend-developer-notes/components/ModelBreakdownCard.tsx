"use client";

import type { ModelBreakdown } from "@/app/hooks/useStats";
import { MODELS } from "@/app/lib/models";

interface ModelBreakdownCardProps {
  breakdown: ModelBreakdown[];
}

export function ModelBreakdownCard({ breakdown }: ModelBreakdownCardProps) {
  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="border border-[var(--sand-200)] rounded-xl bg-white p-6 mb-6">
        <h3 className="text-sm font-medium text-[var(--ink)] mb-3">
          Per-Model Breakdown
        </h3>
        <p className="text-sm text-[var(--ink-muted)]">No data yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--sand-200)] rounded-xl bg-white mb-6">
      <div className="px-4 py-3 border-b border-[var(--sand-200)] bg-[var(--sand-50)] rounded-t-xl">
        <h3 className="text-sm font-medium text-[var(--ink)]">
          Per-Model Breakdown
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--sand-200)]">
              <th className="text-left px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">Model</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">Generations</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">Avg Speed (t/s)</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row) => {
              const model = MODELS[row.model_id];
              return (
                <tr key={row.model_id} className="border-b border-[var(--sand-100)] last:border-0">
                  <td className="px-4 py-2">
                    <span className="font-medium text-[var(--ink)]">
                      {model?.name ?? row.model_id}
                    </span>
                    {model && (
                      <span className="ml-2 text-xs text-[var(--ink-muted)]">
                        {model.params}
                      </span>
                    )}
                  </td>
                  <td className="text-right px-4 py-2 text-[var(--ink)]">
                    {row.count.toLocaleString()}
                  </td>
                  <td className="text-right px-4 py-2 text-[var(--ink)] font-mono">
                    {row.avg_tokens_per_second.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
