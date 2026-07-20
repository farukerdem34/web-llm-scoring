"use client";

import { useHealthCheck } from "@/app/hooks/useHealthCheck";

export function HealthIndicator() {
  const { isHealthy } = useHealthCheck(30_000);

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          isHealthy === null
            ? "bg-slate-300 dark:bg-slate-600"
            : isHealthy
              ? "bg-green-500"
              : "bg-red-500"
        }`}
      />
      <span>Backend</span>
    </div>
  );
}
