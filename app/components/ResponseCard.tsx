"use client";

import { useState, useEffect } from "react";
import { MODELS } from "@/app/lib/models";
import { GenerationResult } from "@/app/lib/types";

interface ResponseCardProps {
  modelId: string;
  result: GenerationResult;
}

export function ResponseCard({ modelId, result }: ResponseCardProps) {
  const model = MODELS[modelId];
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState("0.0");

  useEffect(() => {
    if (!result.isStreaming) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(((Date.now() - start) / 1000).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [result.isStreaming, result.text]);

  const handleCopy = async () => {
    if (result.text) {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const colorClasses: Record<string, string> = {
    blue: "border-l-4 border-l-blue-500",
    purple: "border-l-4 border-l-purple-500",
  };

  return (
    <div
      className={`flex flex-col border border-zinc-200 rounded-lg bg-white dark:border-zinc-700 dark:bg-zinc-900 ${colorClasses[model?.color] || ""}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {model?.name || modelId}
            </h3>
            <span className="text-xs text-zinc-500">{model?.params} parameters</span>
          </div>
          {result.text && !result.isStreaming && (
            <button
              onClick={handleCopy}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      </div>

      {/* Response Body */}
      <div className="flex-1 p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        {!result.text && !result.isStreaming && (
          <p className="text-zinc-400 text-sm italic">
            Response will appear here...
          </p>
        )}

        {result.isStreaming && result.text === "" && (
          <div className="flex items-center gap-2 text-zinc-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Waiting for first token...</span>
          </div>
        )}

        {result.text && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-800 dark:text-zinc-200">
              {result.text}
            </pre>
            {result.isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5" />
            )}
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      {(result.inferenceTime !== null || result.isStreaming) && (
        <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-b-lg">
          <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
            {result.isStreaming ? (
              <>
                <span>
                  ⏱ {elapsed}s
                </span>
                <span className="animate-pulse">Generating...</span>
              </>
            ) : (
              <>
                {result.inferenceTime !== null && (
                  <span>⏱ {(result.inferenceTime / 1000).toFixed(2)}s</span>
                )}
                {result.tokensPerSecond !== null && (
                  <span>🚀 {result.tokensPerSecond.toFixed(1)} t/s</span>
                )}
                {result.tokenCount !== null && (
                  <span>📝 {result.tokenCount} tokens</span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
