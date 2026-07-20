"use client";

import { useRef } from "react";

interface ConfigSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (value: number) => void;
  onReset: () => void;
}

export function ConfigSlider({
  label,
  description,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
  onReset,
}: ConfigSliderProps) {
  const sliderRef = useRef<HTMLInputElement>(null);

  const handleChange = (newValue: number) => {
    const clamped = Math.min(max, Math.max(min, newValue));
    onChange(Math.round(clamped / step) * step);
  };

  const isDefault = value === defaultValue;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <label className="truncate text-sm font-medium text-[var(--ink)]">
            {label}
          </label>
          {description && (
            <span
              className="shrink-0 text-xs text-[var(--ink-faint)] cursor-help"
              title={description}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <circle cx="7" cy="7" r="6" />
                <path d="M7 6v4M7 4.5v0" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => handleChange(parseFloat(e.target.value) || min)}
            className="w-20 rounded-[var(--radius-md)] border border-[var(--sand-200)] bg-[var(--sand-50)] px-2 py-1 text-right font-[family-name:var(--font-mono)] text-sm text-[var(--ink)] focus:border-[var(--terracotta)] focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/20"
          />
          {!isDefault && (
            <button
              onClick={onReset}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--ink-faint)] transition-colors hover:bg-[var(--terracotta-light)] hover:text-[var(--terracotta)]"
              title="Reset to default"
              aria-label={`Reset ${label} to default`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: "transform 200ms ease",
                }}
              >
                <path d="M1.5 7a5.5 5.5 0 1 1 1 3.2" />
                <path d="M1.5 10.2V7h3.2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Track background */}
        <div className="absolute top-1/2 left-0 h-[6px] w-full -translate-y-1/2 rounded-full bg-[var(--sand-200)]" />
        {/* Filled track */}
        <div
          className="absolute top-1/2 left-0 h-[6px] -translate-y-1/2 rounded-full bg-[var(--terracotta)]"
          style={{ width: `${percentage}%` }}
        />
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="config-slider relative h-[6px] w-full cursor-pointer appearance-none bg-transparent"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
    </div>
  );
}
