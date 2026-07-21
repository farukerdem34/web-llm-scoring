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
Score each response on these criteria (1-10, where 10 is best):
- accuracy: Is the information correct and factual?
- helpfulness: Does it effectively address the user's needs?
- coherence: Is it well-structured and logical?
- completeness: Does it cover all aspects of the question?

Output ONLY valid JSON — no markdown, no explanation, no extra text. The JSON must be an object with a "responses" array of exactly ${responses.length} objects, each containing these keys:
  "model": string (the response label)
  "accuracy": integer 1-10
  "helpfulness": integer 1-10
  "coherence": integer 1-10
  "completeness": integer 1-10
  "overall": number (average of the four scores)
  "reasoning": string (one-sentence justification)

JSON format: {"responses":[{"model":"LABEL","accuracy":SCORE,"helpfulness":SCORE,"coherence":SCORE,"completeness":SCORE,"overall":AVG,"reasoning":"TEXT"}]}`;

  return judgePrompt;
}

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
  if (!Array.isArray(responses) || responses.length === 0) return null;

  const results: ScoreResult[] = [];
  for (const item of responses) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;

    if (typeof obj.model !== "string") continue;

    const scores: Record<ScoreCriterion, number> = {} as Record<
      ScoreCriterion,
      number
    >;
    let valid = true;
    for (const criterion of SCORE_CRITERIA) {
      const val = obj[criterion];
      if (typeof val !== "number" || val < 1 || val > 10) {
        valid = false;
        break;
      }
      scores[criterion] = Math.round(val);
    }
    if (!valid) continue;

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

  return results.length > 0 ? results : null;
}

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
        .filter(([, result]) => result.text && !result.isStreaming)
        .map(([modelId, result]) => ({ modelId, text: result.text }));

      if (responses.length === 0) {
        setScoringError("No completed responses to evaluate.");
        setIsScoring(false);
        return;
      }

      const judgePrompt = buildJudgePrompt(prompt, systemPrompt, responses);

      const judgeModelConfig = MODELS[judgeModelId];
      const contextWindowSize = judgeModelConfig?.chatOptions?.context_window_size;
      if (contextWindowSize) {
        const estimatedTokens = Math.ceil(judgePrompt.length / 4);
        if (estimatedTokens > contextWindowSize * 0.8) {
          setScoringError(
            `Responses may be too long for ${judgeModelConfig.name}'s context window (${contextWindowSize} tokens). Consider reducing max_tokens.`
          );
          setIsScoring(false);
          return;
        }
      }

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

  const clearScoringError = useCallback(() => {
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
    clearScoringError,
  };
}
