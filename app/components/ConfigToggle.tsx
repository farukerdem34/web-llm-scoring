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
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
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
      <div className="flex shrink-0 items-center gap-2">
        <button
          role="switch"
          aria-checked={checked}
          aria-label={`${label} toggle`}
          onClick={() => onChange(!checked)}
          className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--terracotta)]"
          style={{
            backgroundColor: checked
              ? "var(--terracotta)"
              : "var(--sand-300)",
          }}
        >
          <span
            className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"
            style={{
              transform: checked
                ? "translateX(22px)"
                : "translateX(2px)",
              transition: "transform 150ms ease",
            }}
          />
        </button>
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
            >
              <path d="M1.5 7a5.5 5.5 0 1 1 1 3.2" />
              <path d="M1.5 10.2V7h3.2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
