# UI Redesign — Blue-Slate Design System

**Date:** 2025-07-19
**Scope:** Visual polish — same layout, new design system
**Direction:** Cool/technical (Blue-Slate)
**Status:** Approved

## Goal

Replace the current ad-hoc Tailwind utilities with a consistent design system. Same page structure, better visual quality. Eliminate the "AI aesthetic" (generic zinc/blue, inconsistent spacing, no tokens).

## Design Tokens

### Colors

```css
/* Primary — Blue scale */
--blue-50: #eff6ff;
--blue-100: #dbeafe;
--blue-200: #bfdbfe;
--blue-500: #3b82f6;
--blue-600: #2563eb;   /* Primary action */
--blue-700: #1d4ed8;   /* Hover state */
--blue-900: #1e3a8a;

/* Neutrals — Slate scale */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;
--slate-950: #020617;

/* Semantic */
--color-success: #22c55e;  /* Ready state */
--color-warning: #f59e0b;  /* Loading state */
--color-error: #ef4444;    /* Error state */
--color-info: #3b82f6;     /* Informational */
```

### Typography

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| xs | 0.75rem (12px) | 400/500 | Labels, badges |
| sm | 0.875rem (14px) | 400 | Secondary text |
| base | 1rem (16px) | 400 | Body |
| lg | 1.125rem (18px) | 500 | Section titles |
| xl | 1.25rem (20px) | 600 | Card headers |
| 2xl | 1.5rem (24px) | 600 | Page title |

Fonts: Geist Sans (headings/body), Geist Mono (code/metrics) — already loaded.

### Spacing

4px base unit. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.

### Shadows

| Token | Value |
|-------|-------|
| shadow-sm | 0 1px 2px rgb(0 0 0 / 0.05) |
| shadow-md | 0 4px 6px -1px rgb(0 0 0 / 0.1) |
| shadow-lg | 0 10px 15px -3px rgb(0 0 0 / 0.1) |

### Border Radius

| Token | Value | Use |
|-------|-------|-----|
| rounded-sm | 0.25rem | Badges, small elements |
| rounded-md | 0.375rem | Buttons, inputs |
| rounded-lg | 0.5rem | Cards, containers |
| rounded-full | 9999px | Pills, status dots |

## Component Specs

### Header
- Title: `text-2xl font-semibold text-slate-900 dark:text-slate-100`
- Subtitle: `text-sm text-slate-500 dark:text-slate-400 mt-1`
- Bottom border: `border-b border-slate-200 dark:border-slate-800 pb-6`

### Model Cards
- Border: `border border-slate-200 dark:border-slate-700`
- Selected: `border-blue-500 bg-blue-50 dark:bg-blue-950`
- Hover: `shadow-sm transition-shadow`
- Toggle: Pill switch — `bg-blue-600` (on) / `bg-slate-300` (off)
- Status badge: Dot + label, semantic colors

### Prompt Input
- Textarea: `rounded-lg border-slate-300 focus:ring-blue-500 focus:ring-offset-2`
- Primary button: `bg-blue-600 hover:bg-blue-700 text-white rounded-md`
- Secondary buttons: `border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md`
- Character counter: `text-xs text-slate-400` bottom-right

### Response Cards
- Border: `border border-slate-200 dark:border-slate-700 rounded-lg`
- Left accent: `border-l-4 border-l-blue-500` (2B), `border-l-slate-400` (9B)
- Header: `bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700`
- Body: `p-4 min-h-[200px] max-h-[400px] overflow-y-auto`
- Metrics footer: `bg-slate-50 dark:bg-slate-800`, monospace numbers
- Streaming cursor: `bg-blue-500 animate-pulse`

### ProgressBar
- Track: `bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full`
- Fill: `bg-blue-600 h-full rounded-full transition-all duration-300`
- Label: `text-xs text-slate-500` above bar

### Banners
- Error: `bg-red-50 border-red-200 text-red-700`
- Warning: `bg-amber-50 border-amber-200 text-amber-700`
- Info: `bg-blue-50 border-blue-200 text-blue-700`

### Dark Mode

- Backgrounds: `slate-900` page, `slate-800` cards
- Borders: `slate-700`
- Text: `slate-100` primary, `slate-400` secondary
- Primary blue shifts to `blue-400` for contrast

## Layout

Same structure, tighter spacing:

```
max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8
  header (border-b pb-6 mb-6)
  error/warning banners (mb-4)
  model selector (mb-6)
  prompt input (mb-6)
  response grid
```

### Responsive

- Model selector: `flex-col` mobile, `flex-row` desktop
- Response grid: `grid-cols-1 md:grid-cols-2`
- Prompt input: full width always

### Vertical Rhythm

- Between sections: `space-y-6` (24px)
- Card internal: `space-y-4` or `space-y-3`
- Button gaps: `gap-2` (8px)

## Accessibility

- Focus ring: `ring-2 ring-blue-500 ring-offset-2` on all interactive elements
- `aria-label` on icon-only buttons
- Status badges: `role="status"` for screen readers
- Keyboard: Tab through all controls, Enter/Space to activate
- Contrast: All text meets WCAG AA (4.5:1)

## Files to Modify

```
app/globals.css           — Design tokens, base styles
app/layout.tsx            — No changes (fonts already loaded)
app/page.tsx              — Update class names to token system
app/components/
  ModelSelector.tsx       — Token classes, pill toggle
  PromptInput.tsx         — Token classes, refined buttons
  ResponseCard.tsx        — Token classes, metrics styling
  ComparisonView.tsx      — Minor class updates
  ProgressBar.tsx         — Token classes
```

## Verification

- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] No raw hex values in component files (use tokens)
- [ ] Consistent spacing (4px increments)
- [ ] Dark mode works
- [ ] Responsive at 320px, 768px, 1024px, 1440px
