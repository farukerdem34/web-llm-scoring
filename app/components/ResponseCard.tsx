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

  return (
    <div className="flex flex-col border border-[var(--sand-200)] rounded-xl bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--sand-200)] bg-[var(--sand-50)] rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--ink)]">
              {model?.name || modelId}
            </h3>
            <span className="text-xs text-[var(--ink-muted)]">
              {model?.params} parameters
            </span>
          </div>
          {result.text && !result.isStreaming && (
            <button
              onClick={handleCopy}
              className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--terracotta)]/30 focus:ring-offset-2 rounded cursor-pointer"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      </div>

      {/* Response Body */}
      <div className="flex-1 p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        {!result.text && !result.isStreaming && (
          <p className="text-[var(--ink-faint)] text-sm italic">
            Response will appear here...
          </p>
        )}

        {result.isStreaming && result.text === "" && (
          <div className="flex items-center gap-2 text-[var(--ink-muted)]">
            <div className="w-4 h-4 border-2 border-[var(--terracotta)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Waiting for first token...</span>
          </div>
        )}

        {result.text && (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--ink)]">
              {result.text}
            </pre>
            {result.isStreaming && (
              <span className="inline-block w-2 h-4 bg-[var(--terracotta)] animate-pulse ml-0.5" />
            )}
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      {(result.inferenceTime !== null || result.isStreaming) && (
        <div className="px-4 py-2 border-t border-[var(--sand-200)] bg-[var(--sand-50)] rounded-b-xl">
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
    </div>
  );
}
