# Google Fonts Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Inter and JetBrains Mono fonts with Nunito (body) and Noto Serif (headings) using Google Fonts via `next/font/google`.

**Architecture:** Update layout.tsx to import Nunito and Noto Serif, configure CSS variables, and update globals.css to use the new fonts for body text and headings respectively.

**Tech Stack:** Next.js 16, Tailwind CSS v4, `next/font/google`

## Global Constraints

- Use `next/font/google` for font loading (auto-optimization, self-hosting)
- Maintain CSS variable approach for font customization
- Keep `display: 'swap'` for performance
- Use `variable` option for CSS custom properties
- Preserve existing fallback font stacks

---

## File Structure

**Modify:**
- `app/layout.tsx` - Replace Inter/JetBrains Mono imports with Nunito/Noto Serif
- `app/globals.css` - Update CSS variables and heading styles

**No new files needed.**

---

## Task 1: Update layout.tsx with New Fonts

**Files:**
- Modify: `app/layout.tsx:1-17`

**Interfaces:**
- Consumes: `next/font/google` module
- Produces: CSS variables `--font-nunito` and `--font-noto-serif`

- [ ] **Step 1: Replace font imports and configuration**

```tsx
import type { Metadata } from "next";
import { Nunito, Noto_Serif } from "next/font/google";
import { AuthProvider } from "@/app/hooks/useAuth";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LLM Playground - Gemma Model Comparison",
  description:
    "Compare Gemma 2B and 9B models side-by-side with browser-based inference using WebLLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify layout.tsx compiles**

Run: `npm run build` (or `npm run dev` and check for errors)
Expected: No compilation errors

---

## Task 2: Update globals.css CSS Variables

**Files:**
- Modify: `app/globals.css:41-42, 101-102`

**Interfaces:**
- Consumes: CSS variables `--font-nunito` and `--font-noto-serif` from layout.tsx
- Produces: Updated `--font-sans` and new `--font-serif` variables

- [ ] **Step 1: Update font-sans variable (line 41)**

```css
--font-sans: var(--font-nunito), ui-sans-serif, system-ui, -apple-system, sans-serif;
```

- [ ] **Step 2: Add font-serif variable (after line 42)**

```css
--font-serif: var(--font-noto-serif), Georgia, 'Times New Roman', serif;
```

- [ ] **Step 3: Update @theme inline block (lines 101-102)**

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-nunito);
  --font-mono: var(--font-jetbrains);
  --font-serif: var(--font-noto-serif);
}
```

- [ ] **Step 4: Update heading styles to use serif font (lines 117-137)**

```css
/* Heading defaults */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

h3 {
  font-size: 1rem;
  font-weight: 600;
}
```

- [ ] **Step 5: Verify CSS compiles**

Run: `npm run build` (or `npm run dev` and check for errors)
Expected: No CSS compilation errors

---

## Task 3: Verify Font Loading and Visual Check

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: Updated layout.tsx and globals.css
- Produces: Visual confirmation that fonts are applied correctly

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 2: Open browser and verify**

Navigate to `http://localhost:3000` and check:
- Body text uses Nunito (sans-serif)
- Headings (h1, h2, h3) use Noto Serif (serif)
- Monospace elements still use JetBrains Mono (if any remain)

- [ ] **Step 3: Run lint check**

Run: `npm run lint`
Expected: No linting errors

---

## Task 4: Clean Up Unused Font References

**Files:**
- Modify: `app/globals.css` (remove old font references if any)

**Interfaces:**
- Consumes: Updated CSS variables
- Produces: Clean CSS without unused references

- [ ] **Step 1: Remove old font variable references**

Check if `--font-inter` or `--font-jetbrains` are still referenced in globals.css. If `--font-jetbrains` is still needed for monospace, keep it. Otherwise remove.

Current state: `--font-jetbrains` is used for `--font-mono` and referenced in ConfigSlider.tsx. Keep it.

- [ ] **Step 2: Verify no broken references**

Run: `npm run build`
Expected: No build errors

---

## Self-Review Checklist

1. **Spec coverage:** Fonts replaced as requested (Nunito body, Noto Serif headings)
2. **Placeholder scan:** No TBD/TODO markers
3. **Type consistency:** CSS variables match between layout.tsx and globals.css
4. **Performance:** Using `display: 'swap'` and variable fonts for optimal loading
5. **Accessibility:** Maintaining fallback font stacks
6. **Compatibility:** Keeping existing monospace font (JetBrains Mono) for code elements

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-20-google-fonts-integration.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**