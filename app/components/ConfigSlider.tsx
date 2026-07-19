"use client";

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
  const handleChange = (newValue: number) => {
    const clamped = Math.min(max, Math.max(min, newValue));
    onChange(Math.round(clamped / step) * step);
  };

  const isDefault = value === defaultValue;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
          {description && (
            <span className="text-xs text-slate-400 dark:text-slate-500" title={description}>
              ⓘ
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => handleChange(parseFloat(e.target.value) || min)}
            className="w-20 px-2 py-1 text-sm text-right border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isDefault && (
            <button
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Reset to default"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}
