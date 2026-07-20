"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiHealthCheck } from "@/app/lib/auth";

export function useHealthCheck(intervalMs = 30_000) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const ok = await apiHealthCheck();
    setIsHealthy(ok);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    check();
    timer.current = setInterval(check, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [check, intervalMs]);

  return { isHealthy, lastChecked, recheck: check };
}
