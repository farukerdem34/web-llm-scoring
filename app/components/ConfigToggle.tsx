"use client";

interface ConfigToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  defaultChecked: boolean;
  onChange: (checked: boolean) => void;
  onReset: () => void;
}

export function ConfigToggle({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  onReset,
}: ConfigToggleProps) {
  const isDefault = checked === defaultChecked;

  return (
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
        <button
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            checked
              ? "bg-blue-500"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
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
  );
}
