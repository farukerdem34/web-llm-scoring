"use client";

import { useHealthCheck } from "@/app/hooks/useHealthCheck";

export function HealthIndicator() {
  const { isHealthy } = useHealthCheck(30_000);

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          isHealthy === null
            ? "bg-[var(--sand-300)]"
            : isHealthy
              ? "bg-[var(--color-success)]"
              : "bg-[var(--color-error)]"
        }`}
      />
      <span>Backend</span>
    </div>
  );
}
