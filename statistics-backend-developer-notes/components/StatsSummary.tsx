"use client";

import type { UsageSummary } from "@/app/hooks/useStats";
import { MODELS } from "@/app/lib/models";

interface StatsSummaryProps {
  summary: UsageSummary;
}

export function StatsSummary({ summary }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="border border-[var(--sand-200)] rounded-xl bg-white p-4">
        <p className="text-xs text-[var(--ink-muted)] mb-1">Total Generations</p>
        <p className="text-2xl font-semibold text-[var(--ink)]">
          {summary.total_generations.toLocaleString()}
        </p>
      </div>
      <div className="border border-[var(--sand-200)] rounded-xl bg-white p-4">
        <p className="text-xs text-[var(--ink-muted)] mb-1">Total Tokens</p>
        <p className="text-2xl font-semibold text-[var(--ink)]">
          {summary.total_tokens.toLocaleString()}
        </p>
      </div>
      <div className="border border-[var(--sand-200)] rounded-xl bg-white p-4">
        <p className="text-xs text-[var(--ink-muted)] mb-1">Avg Speed</p>
        <p className="text-2xl font-semibold text-[var(--ink)]">
          {summary.avg_tokens_per_second.toFixed(1)} <span className="text-sm font-normal text-[var(--ink-muted)]">t/s</span>
        </p>
      </div>
    </div>
  );
}
