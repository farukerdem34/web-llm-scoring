# Decision Scoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add LLM-as-Judge automated evaluation that scores all model responses on Accuracy, Helpfulness, Coherence, and Completeness using a user-selected judge model.

**Architecture:** A new `useScoring` hook constructs a judge prompt containing all responses, sends it to the user-selected judge model via WebLLM, parses the JSON output into typed `ScoreResult` objects, and updates each `GenerationResult.scores`. New UI components (EvaluateButton, JudgeModelSelector, ScoreDisplay) integrate into the existing PromptInput and ResponseCard.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, `@mlc-ai/web-llm`

## Global Constraints

- All components must use `"use client"` — WebLLM requires browser APIs
- Follow existing warm-sand CSS variable palette (`--sand-*`, `--terracotta`, `--ink-*`)
- No test suite — only `npm run lint` for verification
- No comments unless asked
- No backend persistence — scores are local state only

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/lib/types.ts` | Modify | Add `ScoreCriterion`, `ScoreResult`, `EvaluationResult`; add optional `scores` to `GenerationResult` |
| `app/hooks/useScoring.ts` | Create | Scoring state, judge prompt construction, evaluation logic, JSON parsing |
| `app/components/ScoreDisplay.tsx` | Create | Score bars + overall badge + reasoning accordion |
| `app/components/EvaluateButton.tsx` | Create | Evaluate button with loading/disabled states |
| `app/components/JudgeModelSelector.tsx` | Create | Dropdown to select judge model from loaded/ready models |
| `app/components/ResponseCard.tsx` | Modify | Integrate ScoreDisplay below metrics footer |
| `app/components/PromptInput.tsx` | Modify | Add Evaluate button and JudgeModelSelector |
| `app/page.tsx` | Modify | Wire up useScoring, pass judge engine, manage score state |

---

### Task 1: Add Scoring Types

**Files:**
- Modify: `app/lib/types.ts:44-51` (add `scores` to `GenerationResult`)
- Modify: `app/lib/types.ts` (add new types after line 51)

**Interfaces:**
- Consumes: nothing (foundation task)
- Produces: `ScoreCriterion`, `ScoreResult`, `EvaluationResult` types; `GenerationResult.scores` field

- [ ] **Step 1: Add scoring types after `GenerationResult`**

At `app/lib/types.ts`, add the following after the `GenerationResult` interface (after line 51):

```typescript
export type ScoreCriterion = "accuracy" | "helpfulness" | "coherence" | "completeness";

export const SCORE_CRITERIA: ScoreCriterion[] = [
  "accuracy",
  "helpfulness",
  "coherence",
  "completeness",
];

export const SCORE_CRITERIA_LABELS: Record<ScoreCriterion, string> = {
  accuracy: "Accuracy",
  helpfulness: "Helpfulness",
  coherence: "Coherence",
  completeness: "Completeness",
};

export const SCORE_CRITERIA_DESCRIPTIONS: Record<ScoreCriterion, string> = {
  accuracy: "Is the information correct and factual?",
  helpfulness: "Does it effectively address the user's needs?",
  coherence: "Is it well-structured and logical?",
  completeness: "Does it cover all aspects of the question?",
};

export interface ScoreResult {
  modelId: string;
  scores: Record<ScoreCriterion, number>;
  overallScore: number;
  reasoning: string;
}

export interface EvaluationResult {
  prompt: string;
  judgeModelId: string;
  scores: ScoreResult[];
  timestamp: number;
}
```

- [ ] **Step 2: Add optional `scores` field to `GenerationResult`**

Change the `GenerationResult` interface at `app/lib/types.ts:44-51` to:

```typescript
export interface GenerationResult {
  text: string;
  firstTokenTime: number | null;
  inferenceTime: number | null;
  tokenCount: number | null;
  tokensPerSecond: number | null;
  isStreaming: boolean;
  scores?: ScoreResult;
}
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS (no existing code uses the new types yet)

- [ ] **Step 4: Commit**

```bash
git add app/lib/types.ts
git commit -m "feat: add scoring types (ScoreResult, EvaluationResult)"
```

---

### Task 2: Create useScoring Hook

**Files:**
- Create: `app/hooks/useScoring.ts`

**Interfaces:**
- Consumes: `GenerationResult`, `ScoreResult`, `EvaluationResult`, `ScoreCriterion`, `SCORE_CRITERIA` from `app/lib/types.ts`; `MODELS` from `app/lib/models.ts`; `WebWorkerMLCEngine` from `@mlc-ai/web-llm`
- Produces: `useScoring()` returning `{ evaluationResult, isScoring, scoringError, judgeModelId, setJudgeModel, evaluateAll, clearScores }`

- [ ] **Step 1: Create the hook file with state and imports**

Create `app/hooks/useScoring.ts`:

```typescript
"use client";

import { useState, useCallback } from "react";
import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import {
  type GenerationResult,
  type ScoreResult,
  type EvaluationResult,
  type ScoreCriterion,
  SCORE_CRITERIA,
} from "@/app/lib/types";
import { MODELS } from "@/app/lib/models";
```

- [ ] **Step 2: Add the judge prompt construction function**

Append to the same file:

```typescript
const MAX_RESPONSE_CHARS = 2000;

function truncateResponse(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n...[truncated]";
}

function buildJudgePrompt(
  prompt: string,
  systemPrompt: string,
  responses: Array<{ modelId: string; text: string }>
): string {
  const responseLabels = "ABCDEFGHIJKLMNOP";

  let judgePrompt = `You are an expert evaluator comparing AI assistant responses.

## User Prompt
${prompt}

## System Prompt
${systemPrompt || "(none)"}

`;

  for (let i = 0; i < responses.length; i++) {
    const label = responseLabels[i] || `${i + 1}`;
    const modelName = MODELS[responses[i].modelId]?.name || responses[i].modelId;
    const text = truncateResponse(responses[i].text, MAX_RESPONSE_CHARS);
    judgePrompt += `## Response ${label} (${modelName})
${text}

`;
  }

  judgePrompt += `## Evaluation Task
Rate each response on these criteria (1-10 scale):
- Accuracy: Is the information correct and factual?
- Helpfulness: Does it effectively address the user's needs?
- Coherence: Is it well-structured and logical?
- Completeness: Does it cover all aspects of the question?

Respond in this exact JSON format:
{
  "responses": [
    {
      "model": "${MODELS[responses[0]?.modelId]?.name || "Model"}",
      "accuracy": 8,
      "helpfulness": 7,
      "coherence": 9,
      "completeness": 6,
      "overall": 7.5,
      "reasoning": "Brief explanation of the evaluation."
    }
  ]
}`;

  return judgePrompt;
}
```

- [ ] **Step 3: Add the JSON parsing function**

Append to the same file:

```typescript
function extractJsonFromResponse(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // fall through
    }
  }

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(text.slice(braceStart, braceEnd + 1));
    } catch {
      // fall through
    }
  }

  return null;
}

function validateScores(data: Record<string, unknown>): ScoreResult[] | null {
  const responses = data.responses;
  if (!Array.isArray(responses)) return null;

  const results: ScoreResult[] = [];
  for (const item of responses) {
    if (typeof item !== "object" || item === null) return null;
    const obj = item as Record<string, unknown>;

    if (typeof obj.model !== "string") return null;

    const scores: Record<ScoreCriterion, number> = {} as Record<
      ScoreCriterion,
      number
    >;
    for (const criterion of SCORE_CRITERIA) {
      const val = obj[criterion];
      if (typeof val !== "number" || val < 1 || val > 10) return null;
      scores[criterion] = Math.round(val);
    }

    const overallVal = obj.overall;
    const overallScore =
      typeof overallVal === "number"
        ? Math.round(overallVal * 10) / 10
        : Math.round(
            (scores.accuracy + scores.helpfulness + scores.coherence + scores.completeness) /
              4 *
              10
          ) / 10;

    const reasoning =
      typeof obj.reasoning === "string" ? obj.reasoning : "";

    results.push({
      modelId: "",
      scores,
      overallScore,
      reasoning,
    });
  }

  return results;
}
```

- [ ] **Step 4: Add the main hook function**

Append to the same file:

```typescript
export function useScoring() {
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);
  const [judgeModelId, setJudgeModel] = useState<string>("");

  const evaluateAll = useCallback(
    async (
      prompt: string,
      systemPrompt: string,
      generationResults: Record<string, GenerationResult>,
      judgeEngine: WebWorkerMLCEngine
    ) => {
      setIsScoring(true);
      setScoringError(null);
      setEvaluationResult(null);

      const responses = Object.entries(generationResults)
        .filter(([_, result]) => result.text && !result.isStreaming)
        .map(([modelId, result]) => ({ modelId, text: result.text }));

      if (responses.length === 0) {
        setScoringError("No completed responses to evaluate.");
        setIsScoring(false);
        return;
      }

      const judgePrompt = buildJudgePrompt(prompt, systemPrompt, responses);
      const responseLabels = "ABCDEFGHIJKLMNOP";

      const judgeMessages: import("@mlc-ai/web-llm").ChatCompletionMessageParam[] = [
        { role: "user", content: judgePrompt },
      ];

      let rawResponse = "";
      let parsedData: Record<string, unknown> | null = null;

      try {
        await judgeEngine.resetChat(false, judgeModelId || undefined);

        const stream = await judgeEngine.chat.completions.create({
          messages: judgeMessages,
          stream: true,
          stream_options: { include_usage: true },
          temperature: 0.3,
          max_tokens: 1024,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          rawResponse += content;
        }

        parsedData = extractJsonFromResponse(rawResponse);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setScoringError(`Evaluation failed: ${msg}`);
        setIsScoring(false);
        return;
      }

      if (!parsedData) {
        try {
          await judgeEngine.resetChat(false, judgeModelId || undefined);
          const retryMessages: import("@mlc-ai/web-llm").ChatCompletionMessageParam[] = [
            {
              role: "user",
              content: judgePrompt + "\n\nRespond ONLY with valid JSON. No extra text.",
            },
          ];

          rawResponse = "";
          const retryStream = await judgeEngine.chat.completions.create({
            messages: retryMessages,
            stream: true,
            stream_options: { include_usage: true },
            temperature: 0.1,
            max_tokens: 1024,
          });

          for await (const chunk of retryStream) {
            const content = chunk.choices[0]?.delta?.content || "";
            rawResponse += content;
          }

          parsedData = extractJsonFromResponse(rawResponse);
        } catch {
          // fall through to error below
        }
      }

      if (!parsedData) {
        setScoringError(
          "Evaluation failed — judge model returned invalid format."
        );
        setIsScoring(false);
        return;
      }

      const validatedScores = validateScores(parsedData);
      if (!validatedScores) {
        setScoringError(
          "Evaluation failed — judge model returned invalid score format."
        );
        setIsScoring(false);
        return;
      }

      const modelIds = responses.map((r) => r.modelId);
      validatedScores.forEach((score, i) => {
        score.modelId = modelIds[i] || "";
      });

      const evaluationResult: EvaluationResult = {
        prompt,
        judgeModelId: judgeModelId || "",
        scores: validatedScores,
        timestamp: Date.now(),
      };

      setEvaluationResult(evaluationResult);
      setIsScoring(false);
    },
    [judgeModelId]
  );

  const clearScores = useCallback(() => {
    setEvaluationResult(null);
    setScoringError(null);
  }, []);

  return {
    evaluationResult,
    isScoring,
    scoringError,
    judgeModelId,
    setJudgeModel,
    evaluateAll,
    clearScores,
  };
}
```

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/hooks/useScoring.ts
git commit -m "feat: add useScoring hook for LLM-as-Judge evaluation"
```

---

### Task 3: Create ScoreDisplay Component

**Files:**
- Create: `app/components/ScoreDisplay.tsx`

**Interfaces:**
- Consumes: `ScoreResult` from `app/lib/types.ts`; `SCORE_CRITERIA`, `SCORE_CRITERIA_LABELS` from `app/lib/types.ts`
- Produces: `<ScoreDisplay score={ScoreResult} />` component

- [ ] **Step 1: Create ScoreDisplay component**

Create `app/components/ScoreDisplay.tsx`:

```typescript
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
    <div className="border-t border-[var(--sand-200)] px-4 py-3 bg-[var(--sand-50)]">
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
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/components/ScoreDisplay.tsx
git commit -m "feat: add ScoreDisplay component for evaluation results"
```

---

### Task 4: Create EvaluateButton Component

**Files:**
- Create: `app/components/EvaluateButton.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (standalone UI component)
- Produces: `<EvaluateButton onClick, disabled, isScoring />` component

- [ ] **Step 1: Create EvaluateButton component**

Create `app/components/EvaluateButton.tsx`:

```typescript
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
      title={disabled ? "Load a model to use as judge" : "Evaluate all responses"}
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
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/components/EvaluateButton.tsx
git commit -m "feat: add EvaluateButton component"
```

---

### Task 5: Create JudgeModelSelector Component

**Files:**
- Create: `app/components/JudgeModelSelector.tsx`

**Interfaces:**
- Consumes: `ModelStatus` from `app/lib/types.ts`; `MODELS` from `app/lib/models.ts`
- Produces: `<JudgeModelSelector selectedModelId, modelStatus, onSelect />` component

- [ ] **Step 1: Create JudgeModelSelector component**

Create `app/components/JudgeModelSelector.tsx`:

```typescript
"use client";

import { type ModelStatus } from "@/app/lib/types";
import { MODELS } from "@/app/lib/models";

interface JudgeModelSelectorProps {
  selectedModelId: string;
  modelStatus: Record<string, ModelStatus>;
  onSelect: (modelId: string) => void;
}

export function JudgeModelSelector({
  selectedModelId,
  modelStatus,
  onSelect,
}: JudgeModelSelectorProps) {
  const readyModels = Object.entries(modelStatus)
    .filter(([_, status]) => status === "ready")
    .map(([id]) => id);

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="judge-model"
        className="text-xs text-[var(--ink-muted)] whitespace-nowrap"
      >
        Judge:
      </label>
      <select
        id="judge-model"
        value={selectedModelId}
        onChange={(e) => onSelect(e.target.value)}
        disabled={readyModels.length === 0}
        className="h-8 px-2 text-xs border border-[var(--sand-200)] rounded-lg bg-white dark:bg-[var(--sand-100)] text-[var(--ink)] focus:outline-none focus:border-[var(--terracotta)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {readyModels.length === 0 ? (
          <option value="">No models ready</option>
        ) : (
          readyModels.map((id) => (
            <option key={id} value={id}>
              {MODELS[id]?.name || id}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/components/JudgeModelSelector.tsx
git commit -m "feat: add JudgeModelSelector component"
```

---

### Task 6: Integrate ScoreDisplay into ResponseCard

**Files:**
- Modify: `app/components/ResponseCard.tsx`

**Interfaces:**
- Consumes: `ScoreResult` from `app/lib/types.ts` (via `result.scores`); `ScoreDisplay` component
- Produces: Updated `ResponseCard` that renders `ScoreDisplay` when scores exist

- [ ] **Step 1: Add import for ScoreDisplay**

At `app/components/ResponseCard.tsx:5`, add the import:

```typescript
import { ScoreDisplay } from "./ScoreDisplay";
```

- [ ] **Step 2: Add ScoreDisplay rendering in the metrics footer**

Replace the entire metrics footer section (lines 86-109) with:

```typescript
      {/* Metrics Footer */}
      {(result.inferenceTime !== null || result.isStreaming) && (
        <div className="px-4 py-2.5 border-t border-[var(--sand-200)] bg-[var(--sand-50)]">
          <div className="flex gap-4 text-xs text-[var(--ink-muted)] font-mono">
            {result.isStreaming ? (
              <>
                <span>{elapsed}s</span>
                <span className="animate-pulse">Generating...</span>
              </>
            ) : (
              <>
                {result.inferenceTime !== null && (
                  <span>{(result.inferenceTime / 1000).toFixed(2)}s</span>
                )}
                {result.tokensPerSecond !== null && (
                  <span>{result.tokensPerSecond.toFixed(1)} t/s</span>
                )}
                {result.tokenCount !== null && (
                  <span>{result.tokenCount} tokens</span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Scores */}
      {result.scores && <ScoreDisplay score={result.scores} />}
```

- [ ] **Step 3: Add rounded-b-xl only when no scores**

The card currently applies `rounded-b-xl` on the metrics footer div. When scores are present, the scores section should be the bottom with rounded corners. Update the metrics footer div's className to conditionally include `rounded-b-xl`:

Change line 87 from:
```typescript
        <div className="px-4 py-2.5 border-t border-[var(--sand-200)] bg-[var(--sand-50)] rounded-b-xl">
```
to:
```typescript
        <div className={`px-4 py-2.5 border-t border-[var(--sand-200)] bg-[var(--sand-50)] ${result.scores ? "" : "rounded-b-xl"}`}>
```

And update the ScoreDisplay's root div to have `rounded-b-xl`:

In `ScoreDisplay.tsx`, change line 9 from:
```typescript
    <div className="border-t border-[var(--sand-200)] px-4 py-3 bg-[var(--sand-50)]">
```
to:
```typescript
    <div className="border-t border-[var(--sand-200)] px-4 py-3 bg-[var(--sand-50)] rounded-b-xl">
```

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/components/ResponseCard.tsx app/components/ScoreDisplay.tsx
git commit -m "feat: integrate ScoreDisplay into ResponseCard"
```

---

### Task 7: Integrate EvaluateButton and JudgeModelSelector into PromptInput

**Files:**
- Modify: `app/components/PromptInput.tsx`

**Interfaces:**
- Consumes: `EvaluateButton` component; `JudgeModelSelector` component; `ModelStatus` from `app/lib/types.ts`
- Produces: Updated `PromptInput` with evaluate controls in the button row

- [ ] **Step 1: Add imports**

At the top of `app/components/PromptInput.tsx`, add:

```typescript
import { EvaluateButton } from "./EvaluateButton";
import { JudgeModelSelector } from "./JudgeModelSelector";
import { type ModelStatus } from "@/app/lib/types";
```

- [ ] **Step 2: Extend PromptInputProps**

Change the interface (lines 6-12) to:

```typescript
interface PromptInputProps {
  isGenerating: boolean;
  hasReadyModel: boolean;
  hasResponses: boolean;
  isScoring: boolean;
  judgeModelId: string;
  modelStatus: Record<string, ModelStatus>;
  onGenerate: (prompt: string) => void;
  onClear: () => void;
  onCancel: () => void;
  onEvaluate: () => void;
  onSetJudgeModel: (modelId: string) => void;
}
```

- [ ] **Step 3: Update the component signature**

Change the function signature (lines 15-21) to:

```typescript
export function PromptInput({
  isGenerating,
  hasReadyModel,
  hasResponses,
  isScoring,
  judgeModelId,
  modelStatus,
  onGenerate,
  onClear,
  onCancel,
  onEvaluate,
  onSetJudgeModel,
}: PromptInputProps) {
```

- [ ] **Step 4: Add evaluate controls after the button row**

After the closing `</div>` of the button row (line 102), add:

```typescript
      {hasResponses && !isGenerating && (
        <div className="flex items-center gap-3">
          <JudgeModelSelector
            selectedModelId={judgeModelId}
            modelStatus={modelStatus}
            onSelect={onSetJudgeModel}
          />
          <EvaluateButton
            onClick={onEvaluate}
            disabled={!hasReadyModel || !judgeModelId}
            isScoring={isScoring}
          />
        </div>
      )}
```

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/components/PromptInput.tsx
git commit -m "feat: add evaluate controls to PromptInput"
```

---

### Task 8: Wire Up useScoring in page.tsx

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useScoring` hook; all components from earlier tasks
- Produces: Fully wired page with scoring functionality

- [ ] **Step 1: Add imports**

At `app/page.tsx`, add after line 15:

```typescript
import { useScoring } from "./hooks/useScoring";
import { MODELS } from "./lib/models";
```

- [ ] **Step 2: Initialize useScoring hook**

After the `useStats()` call (line 50), add:

```typescript
  const {
    evaluationResult,
    isScoring,
    scoringError,
    judgeModelId,
    setJudgeModel,
    evaluateAll,
    clearScores,
  } = useScoring();
```

- [ ] **Step 3: Auto-select default judge model**

After the `useScoring` initialization, add a `useEffect` to auto-select the largest loaded model as judge:

```typescript
  useEffect(() => {
    if (judgeModelId && modelStatus[judgeModelId] === "ready") return;

    const readyModels = selectedModels.filter(
      (id) => modelStatus[id] === "ready"
    );
    if (readyModels.length === 0) return;

    const largestReady = readyModels.reduce((best, id) => {
      const bestConfig = MODELS[best];
      const idConfig = MODELS[id];
      const bestParams = parseFloat(bestConfig?.params || "0");
      const idParams = parseFloat(idConfig?.params || "0");
      return idParams > bestParams ? id : best;
    }, readyModels[0]);

    setJudgeModel(largestReady);
  }, [selectedModels, modelStatus, judgeModelId, setJudgeModel]);
```

- [ ] **Step 4: Create handleEvaluate callback**

After the `handleGenerate` callback (line 136), add:

```typescript
  const handleEvaluate = () => {
    const judgeEntry = enginesRef.current?.get(judgeModelId);
    if (!judgeEntry) {
      return;
    }
    evaluateAll(
      lastPromptRef.current,
      config.system_prompt,
      results,
      judgeEntry.engine
    );
  };
```

Wait — `enginesRef` is inside `useWebLLM`. We need to expose the engine for the judge model. Let me revise this approach.

Instead of accessing `enginesRef` directly, we should add a `getEngine` method to `useWebLLM` and use it in `page.tsx`.

**Revised Step 4:** First, modify `app/hooks/useWebLLM.ts` to expose a `getEngine` method.

In `app/hooks/useWebLLM.ts`, add to the return object (after `clearError`):

```typescript
    getEngine: (modelId: string) => enginesRef.current.get(modelId)?.engine ?? null,
```

Then back in `app/page.tsx`, destructure `getEngine` from `useWebLLM`:

Change the `useWebLLM()` destructure (lines 23-39) to include `getEngine`:

```typescript
  const {
    engineReady,
    modelStatus,
    loadProgress,
    loadStatus,
    isGenerating,
    results,
    error,
    gpuVendor,
    gpuMaxBufferSize,
    loadModel,
    unloadModel,
    generate,
    cancelGeneration,
    clearResults,
    clearError,
    getEngine,
  } = useWebLLM();
```

Now add the `handleEvaluate` callback:

```typescript
  const lastPromptRef = useRef("");

  const handleGenerate = (prompt: string) => {
    lastPromptRef.current = prompt;
    clearScores();
    generate(prompt, selectedModels, config);
  };

  const handleEvaluate = () => {
    const judgeEngine = getEngine(judgeModelId);
    if (!judgeEngine) return;
    evaluateAll(
      lastPromptRef.current,
      config.system_prompt,
      results,
      judgeEngine
    );
  };
```

Replace the existing `handleGenerate` (line 134-136) with the above block.

- [ ] **Step 5: Compute hasResponses**

After the `hasReadyModel` line (line 96-98), add:

```typescript
  const hasResponses = Object.values(results).some(
    (r) => r.text && !r.isStreaming
  );
```

- [ ] **Step 6: Pass new props to PromptInput**

Update the `<PromptInput>` usage (lines 325-331) to:

```typescript
              <PromptInput
                isGenerating={isGenerating}
                hasReadyModel={hasReadyModel}
                hasResponses={hasResponses}
                isScoring={isScoring}
                judgeModelId={judgeModelId}
                modelStatus={modelStatus}
                onGenerate={handleGenerate}
                onClear={clearResults}
                onCancel={cancelGeneration}
                onEvaluate={handleEvaluate}
                onSetJudgeModel={setJudgeModel}
              />
```

- [ ] **Step 7: Display scoring error**

After the error banner (line 271), add a scoring error banner:

```typescript
            {scoringError && (
              <div className="mb-4 p-4 bg-[var(--terracotta-light)] border border-[var(--terracotta)]/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--terracotta-dark)]">
                    {scoringError}
                  </p>
                  <button
                    onClick={() => {}}
                    className="text-[var(--terracotta)] hover:text-[var(--terracotta-dark)] cursor-pointer"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
```

Actually, let's make the scoring error dismissible. Add a `clearScoringError` or just use `setScoringError(null)` via the hook. Let's expose `clearError` for scoring too.

**Revised:** In `useScoring.ts`, add a `clearScoringError` callback:

```typescript
  const clearScoringError = useCallback(() => {
    setScoringError(null);
  }, []);
```

And return it from the hook. Then in `page.tsx`:

```typescript
  const {
    evaluationResult,
    isScoring,
    scoringError,
    judgeModelId,
    setJudgeModel,
    evaluateAll,
    clearScores,
    clearScoringError,
  } = useScoring();
```

And the error banner:

```typescript
            {scoringError && (
              <div className="mb-4 p-4 bg-[var(--terracotta-light)] border border-[var(--terracotta)]/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--terracotta-dark)]">
                    {scoringError}
                  </p>
                  <button
                    onClick={clearScoringError}
                    className="text-[var(--terracotta)] hover:text-[var(--terracotta-dark)] cursor-pointer"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
```

- [ ] **Step 8: Apply scores to results**

After the evaluation completes, we need to update each `GenerationResult.scores`. The `evaluateAll` function returns an `EvaluationResult` with scores. We need to apply them.

In `page.tsx`, update the `handleEvaluate` to apply scores:

```typescript
  const handleEvaluate = async () => {
    const judgeEngine = getEngine(judgeModelId);
    if (!judgeEngine) return;
    await evaluateAll(
      lastPromptRef.current,
      config.system_prompt,
      results,
      judgeEngine
    );
  };
```

Wait — the scores are set in `evaluationResult` state, but we need to map them back to each `GenerationResult.scores`. Let's do this via a `useEffect` that watches `evaluationResult`:

```typescript
  useEffect(() => {
    if (!evaluationResult) return;
    setResults((prev) => {
      const next = { ...prev };
      for (const score of evaluationResult.scores) {
        if (next[score.modelId]) {
          next[score.modelId] = { ...next[score.modelId], scores: score };
        }
      }
      return next;
    });
  }, [evaluationResult]);
```

- [ ] **Step 9: Clear scores on new generation**

In `handleGenerate`, call `clearScores()` before generating:

```typescript
  const handleGenerate = (prompt: string) => {
    lastPromptRef.current = prompt;
    clearScores();
    generate(prompt, selectedModels, config);
  };
```

This is already included in Step 4.

- [ ] **Step 10: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add app/page.tsx app/hooks/useWebLLM.ts app/hooks/useScoring.ts
git commit -m "feat: wire up scoring in page.tsx with judge engine access"
```

---

### Task 9: Final Integration Test and Lint

**Files:**
- All modified/created files

**Interfaces:**
- Consumes: all tasks above
- Produces: passing lint, verified manual flow

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors)

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: lint and typecheck fixes for scoring feature"
```

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | `types.ts` | Add scoring types |
| 2 | `useScoring.ts` | New hook: prompt, evaluate, parse |
| 3 | `ScoreDisplay.tsx` | Score bars + reasoning accordion |
| 4 | `EvaluateButton.tsx` | Evaluate button with loading state |
| 5 | `JudgeModelSelector.tsx` | Judge model dropdown |
| 6 | `ResponseCard.tsx` | Integrate ScoreDisplay |
| 7 | `PromptInput.tsx` | Add evaluate controls |
| 8 | `page.tsx` + `useWebLLM.ts` | Wire everything together |
| 9 | Final | Lint + typecheck |
