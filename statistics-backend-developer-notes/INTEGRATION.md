# Frontend Integration Guide — Model Usage Statistics

## Files to Add to the Frontend Repo

Copy these files into your `masterfabric-web-llm-scoring-frontend` repo:

### New Files

```
app/hooks/useStats.ts          → app/hooks/useStats.ts
app/components/StatsSummary.tsx → app/components/StatsSummary.tsx
app/components/ModelBreakdownCard.tsx → app/components/ModelBreakdownCard.tsx
app/components/StatsTab.tsx     → app/components/StatsTab.tsx
```

### Modified Files

**`app/page.tsx`** — Add a tab system and stats recording. Changes needed:

1. Add tab state and imports at the top:

```tsx
import { StatsTab } from "./components/StatsTab";
import { useStats } from "./hooks/useStats";

// Add inside the component:
const [activeTab, setActiveTab] = useState<"playground" | "stats">("playground");
const { recordUsage } = useStats();
```

2. Add tab navigation in the header (next to the title):

```tsx
<nav className="flex gap-1">
  <button
    onClick={() => setActiveTab("playground")}
    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
      activeTab === "playground"
        ? "bg-[var(--terracotta)] text-white"
        : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)]"
    }`}
  >
    Playground
  </button>
  <button
    onClick={() => setActiveTab("stats")}
    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
      activeTab === "stats"
        ? "bg-[var(--terracotta)] text-white"
        : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sand-100)]"
    }`}
  >
    Statistics
  </button>
</nav>
```

3. Conditionally render content based on activeTab:

```tsx
{activeTab === "playground" ? (
  // ... existing playground content ...
) : (
  <StatsTab />
)}
```

4. Add stats recording after generation completes. In the `generate` callback (or after `setIsGenerating(false)`), add:

```tsx
// After generation completes, record stats for each model
useEffect(() => {
  if (isGenerating || !results) return;
  for (const [modelId, result] of Object.entries(results)) {
    if (result && !result.isStreaming && result.inferenceTime !== null) {
      recordUsage({
        model_id: modelId,
        token_count: result.tokenCount || 0,
        first_token_time_ms: result.firstTokenTime || null,
        inference_time_ms: result.inferenceTime,
        tokens_per_second: result.tokensPerSecond || null,
      });
    }
  }
}, [results, isGenerating, recordUsage]);
```

## No Backend Changes Needed

The Next.js rewrites in `next.config.ts` already proxy `/api/v1/*` to the backend, so the new `/api/v1/statistics/usage` endpoints will work automatically.

## Deployment

1. Copy the files to the frontend repo
2. Run `npm run build` to verify no TypeScript errors
3. Push to trigger Vercel deployment
4. Ensure `NEXT_PUBLIC_API_BASE_URL` points to the deployed backend
