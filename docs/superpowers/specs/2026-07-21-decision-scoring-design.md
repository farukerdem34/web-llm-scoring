# Decision Scoring — LLM-as-Judge Evaluation

**Date:** 2026-07-21
**Status:** Approved
**Scope:** Automated response quality evaluation using LLM-as-Judge

## Overview

Add an automated evaluation system to the LLM Playground that uses one loaded model as a "judge" to score all other models' responses on four fixed criteria. This enables objective, structured comparison of model output quality beyond raw performance metrics.

## Goals

- Let users evaluate response quality automatically without manual rating
- Provide multi-criteria scoring (Accuracy, Helpfulness, Coherence, Completeness) on a 1-10 scale
- Use a user-selected loaded model as the judge (no external API calls)
- Display scores directly on each ResponseCard with expandable reasoning
- Keep scores in local state only (no backend persistence)

## Non-Goals

- Reference-based metrics (BLEU, ROUGE)
- Backend persistence of scores
- Custom user-defined criteria
- Benchmark/test-prompt suites
- Export of scoring results

## Data Model

### New Types (`app/lib/types.ts`)

```typescript
type ScoreCriterion = "accuracy" | "helpfulness" | "coherence" | "completeness";

interface ScoreResult {
  modelId: string;
  scores: Record<ScoreCriterion, number>;  // 1-10
  overallScore: number;                      // weighted average (equal weights)
  reasoning: string;
}

interface EvaluationResult {
  prompt: string;
  judgeModelId: string;
  scores: ScoreResult[];
  timestamp: number;
}
```

### Extended `GenerationResult`

```typescript
interface GenerationResult {
  // ... existing fields ...
  scores?: ScoreResult;
}
```

The `scores` field is optional. It is populated after evaluation and cleared when a new generation starts.

## Architecture

### New Hook: `useScoring`

**State:**
- `evaluationResult: EvaluationResult | null` — current evaluation
- `isScoring: boolean` — whether judge is running
- `scoringError: string | null` — error message if evaluation fails
- `judgeModelId: string` — currently selected judge model

**Methods:**
- `evaluateAll(prompt, systemPrompt, generationResults, judgeEngine)` — triggers batch evaluation
- `setJudgeModel(modelId)` — changes the judge model

**Flow:**
1. User clicks "Evaluate" button
2. `evaluateAll()` constructs the judge prompt (see Judge Prompt section)
3. Calls `judgeEngine.chat.completions.create()` with the structured prompt
4. Parses JSON response into `ScoreResult[]`
5. Updates each `GenerationResult.scores` via parent state setter
6. Displays scores on ResponseCards

### Judge Prompt Template

```
You are an expert evaluator comparing AI assistant responses.

## User Prompt
{original_prompt}

## System Prompt
{system_prompt or "(none)"}

## Response A ({model_name_1})
{response_text_1}

## Response B ({model_name_2})
{response_text_2}

...

## Evaluation Task
Rate each response on these criteria (1-10 scale):
- Accuracy: Is the information correct and factual?
- Helpfulness: Does it effectively address the user's needs?
- Coherence: Is it well-structured and logical?
- Completeness: Does it cover all aspects of the question?

Respond in this exact JSON format:
{
  "responses": [
    {
      "model": "{model_name}",
      "accuracy": <number>,
      "helpfulness": <number>,
      "coherence": <number>,
      "completeness": <number>,
      "overall": <number>,
      "reasoning": "<brief explanation>"
    }
  ]
}
```

**Constraints:**
- The judge model must be loaded and ready (status === "ready")
- The judge model's context window must accommodate: prompt + system prompt + all responses + judge instructions
- If context window is too small, warn the user and suggest reducing `max_tokens` or evaluating fewer models

### JSON Parsing

The judge model outputs JSON. Parsing strategy:
1. Extract JSON from the response text (handle markdown code fences, extra text)
2. Validate the structure matches `ScoreResult[]`
3. Validate scores are within 1-10 range
4. If parsing fails, retry once with an explicit "respond ONLY with valid JSON" suffix
5. If retry fails, set `scoringError` with a descriptive message

## UI Changes

### Evaluate Button

- **Location:** Prompt area, alongside Generate/Clear/Cancel buttons
- **Visibility:** Only shown after generation completes with at least one response visible
- **Label:** "Evaluate" with a score/star icon
- **Disabled when:** No responses visible, or judge model not loaded

### Judge Model Selector

- **Location:** ConfigSidebar or inline near the Evaluate button
- **Type:** Dropdown/select showing only loaded/ready models
- **Default:** The largest loaded model by parameter count
- **Label:** "Judge Model"

### Score Display on ResponseCard

Below the existing performance metrics footer, add a collapsible score section:

```
┌─────────────────────────────┐
│ Model Name (2B)             │ [Copy]
│ ──────────────────────────  │
│ [response text]             │
│ ──────────────────────────  │
│ ⚡ 2.3s │ 📊 45 tok/s      │
│ ──────────────────────────  │
│ 🎯 Scores          8.2/10  │
│   Accuracy     ████████░░ 8 │
│   Helpfulness  █████████░ 9 │
│   Coherence    ███████░░░ 7 │
│   Completeness ████████░░ 8 │
│   ▶ Reasoning (expand)      │
└─────────────────────────────┘
```

**Behavior:**
- Score section is hidden until evaluation completes
- Each criterion shown as a horizontal bar with label + numeric score
- Overall score shown as a badge in the header of the score section
- Reasoning is collapsed by default, expandable with a chevron
- During scoring: show "Evaluating..." loading state

### Score Clearing

- When a new generation starts (Generate button clicked), clear all scores from previous evaluation
- The Evaluate button disappears until the new generation completes

## Error Handling

| Error | Behavior |
|-------|----------|
| Judge model not loaded | Disable Evaluate button, show tooltip "Load a model to use as judge" |
| Judge model loading | Disable Evaluate button, show "Judge model loading..." |
| Context window exceeded | Warn: "Responses too long for judge model's context window. Reduce max_tokens." |
| JSON parse failure | Retry once, then show "Evaluation failed — judge model returned invalid format" |
| Judge generation error | Show "Evaluation failed: {error message}" |
| GPU device lost during scoring | Reinitialize engine, retry once, then show error |

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/lib/types.ts` | Modify | Add `ScoreCriterion`, `ScoreResult`, `EvaluationResult` types; add optional `scores` to `GenerationResult` |
| `app/hooks/useScoring.ts` | Create | New hook: scoring state, judge prompt construction, evaluation logic, JSON parsing |
| `app/components/EvaluateButton.tsx` | Create | Evaluate button with loading state |
| `app/components/JudgeModelSelector.tsx` | Create | Dropdown to select judge model from loaded models |
| `app/components/ScoreDisplay.tsx` | Create | Score bars + overall badge + reasoning accordion |
| `app/components/ResponseCard.tsx` | Modify | Integrate ScoreDisplay below metrics |
| `app/components/PromptInput.tsx` | Modify | Add Evaluate button and judge model selector |
| `app/page.tsx` | Modify | Wire up useScoring hook, pass judge model engine, manage score state |

## Performance Considerations

- Judge inference runs on WebGPU like any other model — adds GPU load during scoring
- Show clear loading states so users understand scoring takes time (similar to generation)
- The judge prompt can be long with multiple responses; consider truncating very long responses (>2000 chars) in the judge prompt to avoid context window issues
- No caching of scores — they are recomputed each time (local state only)

## Verification

1. `npm run lint` — must pass
2. Manual: load 2+ models, generate, click Evaluate → scores appear on all cards
3. Manual: judge model selector shows only ready models
4. Manual: error states display correctly (no judge loaded, parse failure)
5. Manual: scores clear on new generation
6. Manual: reasonings expand/collapse correctly
