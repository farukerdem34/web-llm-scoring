"use client";

interface EvaluateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isScoring: boolean;
}

export function EvaluateButton({
  onClick,
  disabled,
  isScoring,
}: EvaluateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isScoring}
      className="h-12 px-4 border border-[var(--sand-200)] text-[var(--ink-muted)] rounded-xl font-medium hover:bg-[var(--sand-100)] focus:outline-none focus:ring-2 focus:ring-[var(--sand-400)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
      title={
        isScoring
          ? "Evaluating responses..."
          : disabled
            ? "Load a model to use as judge"
            : "Evaluate all responses"
      }
    >
      {isScoring ? (
        <>
          <div className="w-4 h-4 border-2 border-[var(--terracotta)] border-t-transparent rounded-full animate-spin" />
          Scoring...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          Evaluate
        </>
      )}
    </button>
  );
}
