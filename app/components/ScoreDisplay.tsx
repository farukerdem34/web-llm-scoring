"use client";

import { useState } from "react";
import {
  type ScoreResult,
  SCORE_CRITERIA,
  SCORE_CRITERIA_LABELS,
} from "@/app/lib/types";

interface ScoreDisplayProps {
  score: ScoreResult;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  return (
    <div className="border-t border-[var(--sand-200)] px-4 py-3 bg-[var(--sand-50)] rounded-b-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--ink-muted)]">
          Scores
        </span>
        <span className="text-sm font-semibold text-[var(--ink)] tabular-nums">
          {score.overallScore.toFixed(1)}/10
        </span>
      </div>

      <div className="space-y-1.5">
        {SCORE_CRITERIA.map((criterion) => (
          <div key={criterion} className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--ink-muted)] w-20 shrink-0">
              {SCORE_CRITERIA_LABELS[criterion]}
            </span>
            <div className="flex-1 h-1.5 bg-[var(--sand-200)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(score.scores[criterion] / 10) * 100}%`,
                  background: "var(--gradient-primary)",
                }}
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--ink-muted)] w-4 text-right tabular-nums">
              {score.scores[criterion]}
            </span>
          </div>
        ))}
      </div>

      {score.reasoning && (
        <div className="mt-2">
          <button
            onClick={() => setIsReasoningOpen(!isReasoningOpen)}
            className="flex items-center gap-1 text-[10px] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3 w-3 transition-transform ${isReasoningOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Reasoning
          </button>
          {isReasoningOpen && (
            <p className="mt-1 text-[10px] text-[var(--ink-muted)] leading-relaxed">
              {score.reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
