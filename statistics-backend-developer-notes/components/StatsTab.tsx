"use client";

import { useState, useEffect, useCallback } from "react";
import { useStats } from "@/app/hooks/useStats";
import { MODELS } from "@/app/lib/models";
import { StatsSummary } from "./StatsSummary";
import { ModelBreakdownCard } from "./ModelBreakdownCard";

export function StatsTab() {
  const { data, loading, error, fetchStats } = useStats();
  const [modelFilter, setModelFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const loadStats = useCallback(() => {
    const filters: Record<string, string | number> = { page, per_page: perPage };
    if (modelFilter) filters.model_id = modelFilter;
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;
    fetchStats(filters);
  }, [modelFilter, startDate, endDate, page, fetchStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalPages = data ? Math.ceil(data.total / perPage) : 0;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
            Model
          </label>
          <select
            value={modelFilter}
            onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}
            className="border border-[var(--sand-200)] rounded-lg px-3 py-1.5 text-sm text-[var(--ink)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30"
          >
            <option value="">All models</option>
            {Object.entries(MODELS).map(([id, m]) => (
              <option key={id} value={id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-[var(--sand-200)] rounded-lg px-3 py-1.5 text-sm text-[var(--ink)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-[var(--sand-200)] rounded-lg px-3 py-1.5 text-sm text-[var(--ink)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30"
          />
        </div>
        <button
          onClick={() => { setModelFilter(""); setStartDate(""); setEndDate(""); setPage(1); }}
          className="px-3 py-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)] rounded-lg transition-colors cursor-pointer"
        >
          Clear filters
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-[var(--terracotta-light)] border border-[var(--terracotta)]/20 rounded-lg">
          <p className="text-sm text-[var(--terracotta-dark)]">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-[var(--ink-muted)] mb-4">
          <div className="w-4 h-4 border-2 border-[var(--terracotta)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading statistics...</span>
        </div>
      )}

      {/* Summary + Breakdown */}
      {data && !loading && (
        <>
          <StatsSummary summary={data.summary} />
          <ModelBreakdownCard breakdown={data.summary.model_breakdown} />

          {/* Records table */}
          <div className="border border-[var(--sand-200)] rounded-xl bg-white">
            <div className="px-4 py-3 border-b border-[var(--sand-200)] bg-[var(--sand-50)] rounded-t-xl">
              <h3 className="text-sm font-medium text-[var(--ink)]">
                Usage Records ({data.total.toLocaleString()} total)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--sand-200)]">
                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">Model</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">Tokens</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">Speed (t/s)</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">Inference</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">1st Token</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-[var(--ink-muted)]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((stat) => {
                    const model = MODELS[stat.model_id];
                    return (
                      <tr key={stat.id} className="border-b border-[var(--sand-100)] last:border-0">
                        <td className="px-4 py-2">
                          <span className="font-medium text-[var(--ink)]">
                            {model?.name ?? stat.model_id}
                          </span>
                        </td>
                        <td className="text-right px-4 py-2 text-[var(--ink)] font-mono">
                          {stat.token_count}
                        </td>
                        <td className="text-right px-4 py-2 text-[var(--ink)] font-mono">
                          {stat.tokens_per_second?.toFixed(1) ?? "—"}
                        </td>
                        <td className="text-right px-4 py-2 text-[var(--ink)] font-mono">
                          {(stat.inference_time_ms / 1000).toFixed(2)}s
                        </td>
                        <td className="text-right px-4 py-2 text-[var(--ink)] font-mono">
                          {stat.first_token_time_ms != null
                            ? `${(stat.first_token_time_ms / 1000).toFixed(2)}s`
                            : "—"}
                        </td>
                        <td className="text-right px-4 py-2 text-[var(--ink-muted)] text-xs">
                          {new Date(stat.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                  {data.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
                        No records found. Generate some responses to see statistics here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-[var(--sand-200)] flex items-center justify-between">
                <span className="text-xs text-[var(--ink-muted)]">
                  Page {data.page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--ink-muted)]">
            No statistics yet. Generate some model responses to see usage data here.
          </p>
        </div>
      )}
    </div>
  );
}
