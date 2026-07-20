"use client";

import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";

export interface UsageStat {
  id: string;
  user_id: string;
  model_id: string;
  token_count: number;
  first_token_time_ms: number | null;
  inference_time_ms: number;
  tokens_per_second: number | null;
  created_at: string;
}

export interface ModelBreakdown {
  model_id: string;
  count: number;
  avg_tokens_per_second: number;
}

export interface UsageSummary {
  total_generations: number;
  total_tokens: number;
  avg_tokens_per_second: number;
  models_used: string[];
  model_breakdown: ModelBreakdown[];
}

export interface UsageStatsResponse {
  data: UsageStat[];
  total: number;
  page: number;
  per_page: number;
  summary: UsageSummary;
}

export interface StatsFilters {
  model_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export function useStats() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const [data, setData] = useState<UsageStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (filters: StatsFilters = {}) => {
      if (!isAuthenticated) return;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.model_id) params.set("model_id", filters.model_id);
        if (filters.start_date) params.set("start_date", filters.start_date);
        if (filters.end_date) params.set("end_date", filters.end_date);
        if (filters.page) params.set("page", String(filters.page));
        if (filters.per_page) params.set("per_page", String(filters.per_page));

        const qs = params.toString();
        const url = `/api/v1/statistics/usage${qs ? `?${qs}` : ""}`;

        const res = await fetch(url, {
          headers: getAuthHeaders(),
          credentials: "include",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? `Request failed (${res.status})`);
        }

        const result: UsageStatsResponse = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, isAuthenticated]
  );

  const recordUsage = useCallback(
    async (stat: {
      model_id: string;
      token_count: number;
      first_token_time_ms?: number | null;
      inference_time_ms: number;
      tokens_per_second?: number | null;
    }) => {
      if (!isAuthenticated) return;

      try {
        const res = await fetch("/api/v1/statistics/usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
          body: JSON.stringify(stat),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? `Request failed (${res.status})`);
        }
      } catch (err) {
        // Silently fail — stats submission is best-effort
        console.warn("Failed to record usage stats:", err);
      }
    },
    [getAuthHeaders, isAuthenticated]
  );

  return {
    data,
    loading,
    error,
    fetchStats,
    recordUsage,
  };
}
