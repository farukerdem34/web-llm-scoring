"use client";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
