# Statistics Frontend Integration

## Summary

Integrate model usage statistics into the LLM Playground by adding a Statistics tab that displays usage data from the backend API. Automatically records generation metrics after each inference completes.

## Source

Backend developer notes at `statistics-backend-developer-notes/INTEGRATION.md` provide the reference implementation. We adapt these files to match the existing app's dark mode support and design patterns.

## Files

### New

| File | Source |
|------|--------|
| `app/hooks/useStats.ts` | Verbatim from backend notes |
| `app/components/StatsSummary.tsx` | Adapted — dark mode fix |
| `app/components/ModelBreakdownCard.tsx` | Adapted — dark mode fix |
| `app/components/StatsTab.tsx` | Adapted — dark mode fix |

### Modified

| File | Changes |
|------|---------|
| `app/page.tsx` | Add tab system (Playground/Statistics), stats recording useEffect |

## Design Details

### Tab System

- Two-state `activeTab`: `"playground" | "stats"`, default `"playground"`
- Navigation in header between logo and action buttons
- Active tab: `bg-[var(--terracotta)] text-white`
- Inactive tab: `text-[var(--ink-muted)]` with hover state
- Playground tab shows existing content unchanged
- Statistics tab renders `<StatsTab />`

### Stats Recording

`useEffect` watches `results` and `isGenerating`. When generation finishes (`isGenerating` transitions to false), iterates each model's result and calls `recordUsage()` with:
- `model_id`
- `token_count`
- `first_token_time_ms`
- `inference_time_ms`
- `tokens_per_second`

Failures are silently logged (best-effort submission).

### Dark Mode Adaptation

All provided components use `bg-white` which breaks in dark mode. Fixes:
- `bg-white` → `bg-[var(--sand-50)]` on all card/table backgrounds
- `select` and `input[type=date]` get `dark:bg-[var(--sand-100)]`
- Matches existing component patterns in the app

### API Endpoints Used

- `GET /api/v1/statistics/usage` — fetch paginated usage stats with filters
- `POST /api/v1/statistics/usage` — record a single usage event

Both proxied to backend via existing Next.js rewrites in `next.config.ts`.

## Verification

- `npm run lint` passes
- `npm run build` succeeds (no TypeScript errors)
