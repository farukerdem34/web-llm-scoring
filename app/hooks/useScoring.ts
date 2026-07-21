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
