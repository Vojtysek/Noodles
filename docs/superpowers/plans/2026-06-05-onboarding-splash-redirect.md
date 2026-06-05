# Onboarding Splash Redirect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After onboarding completes, redirect to the dashboard and auto-show `ScenarioSplash` with a dynamic "your plan" card and a static "sustainability first" card; persist the chosen variant to Supabase so the financials page can pre-select it.

**Architecture:** URL param `?from=onboarding` signals the dashboard to show the splash; `ScenarioSplash` accepts optional `buildingData` + `buildingId` props to build a dynamic Variant A from Supabase data, while Variant B is a static constant; `onSelect` fires a Supabase UPDATE and the financials page reads `selected_scenario` to pre-select the right view on load.

**Tech Stack:** Next.js 16 (App Router, `"use client"`), React 19, TypeScript, Supabase JS client, GSAP (no changes needed)

---

> **⚠️ Table name note:** `app/dashboard/prehled/page.tsx` queries `"buildings"` (plural) but `app/dashboard/financials/page.tsx` queries `"building"` (singular). Before running tasks, verify which name is the live table in your Supabase project. The plan uses `"buildings"` (matching onboarding + prehled). Update any query in financials that references `"building"` to match.

---

## File Map

| File | Change |
|------|--------|
| `app/onboarding/page.tsx` | Change redirect URL |
| `components/dashboard/scenario-splash.tsx` | Refactor `SplashCard` type; add dynamic Variant A builder; add static sustainability card; add new props; add Supabase update |
| `app/dashboard/prehled/page.tsx` | Detect `from=onboarding` param; extend `BuildingCalc` with `id`; pass `buildingData` + `buildingId` to splash; clean URL on close |
| `app/dashboard/financials/page.tsx` | Extend Supabase fetch to include `selected_scenario`; pre-select scenario on mount |

---

## Task 1: Add `selected_scenario` column to Supabase

**Files:**
- No code files — run SQL in the Supabase dashboard SQL editor

- [ ] **Step 1: Run migration SQL**

Open the Supabase dashboard → SQL Editor and run:

```sql
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS selected_scenario text
  CHECK (selected_scenario IN ('custom', 'sustainability'));
```

- [ ] **Step 2: Verify the column exists**

In the Supabase Table Editor, open the `buildings` table and confirm `selected_scenario` column is present with type `text`, nullable, no default.

---

## Task 2: Change onboarding redirect URL

**Files:**
- Modify: `app/onboarding/page.tsx:587`

- [ ] **Step 1: Update the redirect**

Find line 587 in `app/onboarding/page.tsx`:
```typescript
router.push("/dashboard")
```
Change to:
```typescript
router.push("/dashboard?from=onboarding")
```

- [ ] **Step 2: Manual smoke test**

Run the dev server (`npm run dev`), complete the onboarding flow to the end ("Zobrazit výsledky"), and confirm the browser URL becomes `/dashboard?from=onboarding` (before any redirect logic runs).

---

## Task 3: Refactor `SplashCard` type in `ScenarioSplash`

The current `SplashCard` embeds a full `Scenario` object but only uses `.id`, `.name`, and `.tone` from it. Flatten these to allow static and dynamic cards without needing a mock `Scenario`.

**Files:**
- Modify: `components/dashboard/scenario-splash.tsx`

- [ ] **Step 1: Replace the `SplashCard` type**

Find and replace the existing `type SplashCard` definition:

Old:
```typescript
type SplashCard = {
  scenario: Scenario
  kicker: string
  photo: { src: string; alt: string }
  /** Dvě hlavní čísla — tahák každé varianty. */
  heroStats: { label: string; value: number; format: (v: number) => string; sub: string }[]
  milestones: Milestone[]
  totalMonths: number
  totalCost: number
  finishLabel: string
}
```

New:
```typescript
type SplashCard = {
  id: string
  name: string
  tone: "emerald" | "blue"
  kicker: string
  photo: { src: string; alt: string }
  /** Dvě hlavní čísla — tahák každé varianty. */
  heroStats: { label: string; value: number; format: (v: number) => string; sub: string }[]
  milestones: Milestone[]
  totalMonths: number
  totalCost: number
  finishLabel: string
}
```

- [ ] **Step 2: Update `buildCard` return value**

The `buildCard` function currently returns `{ scenario, kicker, photo, heroStats, milestones, totalMonths, totalCost, finishLabel }`. Replace the `scenario` key with the three inlined fields:

Old (inside `buildCard` return statement):
```typescript
return {
    scenario,
    kicker,
    photo,
    heroStats: isQuick
```

New:
```typescript
return {
    id: scenario.id,
    name: scenario.name,
    tone: (scenario.tone === "emerald" ? "emerald" : "blue") as "emerald" | "blue",
    kicker,
    photo,
    heroStats: isQuick
```

- [ ] **Step 3: Update JSX references inside the component**

In the JSX, three places reference `card.scenario.*`. Change each:

1. Tone lookup — find:
```typescript
const tone = TONE[card.scenario.tone === "emerald" ? "emerald" : "blue"]
```
Replace with:
```typescript
const tone = TONE[card.tone]
```

2. Scenario name — find:
```typescript
{card.scenario.name}
```
Replace with:
```typescript
{card.name}
```

3. `onSelect` call — find:
```typescript
onSelect?.(card.scenario.id)
```
Replace with:
```typescript
onSelect?.(card.id)
```

- [ ] **Step 4: Remove now-unused `Scenario` import**

The `Scenario` type is no longer used in this file. Remove it from the import:

Old:
```typescript
import {
  fmtCzk,
  fmtCzkShort,
  fmtDuration,
  projects,
  scenarios,
  type Scenario,
} from "@/lib/mock-data"
```

New:
```typescript
import {
  fmtCzk,
  fmtCzkShort,
  fmtDuration,
  projects,
  scenarios,
} from "@/lib/mock-data"
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors related to `SplashCard` or `scenario`.

---

## Task 4: Add `buildCardFromBuilding` (dynamic Variant A)

**Files:**
- Modify: `components/dashboard/scenario-splash.tsx`

- [ ] **Step 1: Add the `RENOVATION_LABEL_TO_PROJECT` map and `BuildingData` type near the top of the file (after the imports)**

```typescript
type BuildingData = {
  selected_renovations: string[]
  total_cost: number
  rent_years: number
  units: number
}

const RENOVATION_LABEL_TO_PROJECT: Record<string, string> = {
  "Okna": "okna",
  "Zateplení fasády": "fasada",
  "Zateplení střechy": "strecha",
}
```

- [ ] **Step 2: Add the `buildCardFromBuilding` function after the `buildCard` function**

```typescript
function buildCardFromBuilding(data: BuildingData): SplashCard {
  const selectedIds = data.selected_renovations
    .map((label) => RENOVATION_LABEL_TO_PROJECT[label])
    .filter(Boolean)

  const selected = selectedIds
    .map((id) => projects.find((p) => p.id === id)!)
    .filter(Boolean)

  if (selected.length === 0) {
    // Fallback to the cheapest mock scenario when renovations can't be mapped.
    return buildCard(
      scenarios.find((s) => s.id === "nejnutnejsi")!,
      "Varianta A — váš plán",
      {
        src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop",
        alt: "Řemeslníci při opravě domu",
      }
    )
  }

  const mockTotal = selected.reduce((sum, p) => sum + p.budget, 0)
  const scale = mockTotal > 0 ? data.total_cost / mockTotal : 1

  const scaledSavingsPerYear = selected.reduce((sum, p) => sum + p.savingsPerYear * scale, 0)
  const scaledFundIncrease = selected.reduce((sum, p) => sum + p.fundIncreasePerFlat * scale, 0)

  const docsMonths = selected.length > 1 ? 3 : 2
  const docsCost = Math.round((data.total_cost * 0.03) / 10_000) * 10_000
  const totalCost = CONSULTATION_COST + docsCost + data.total_cost

  let offset = 0
  let spent = 0
  const milestones: Milestone[] = []

  const push = (title: string, months: number, cost: number) => {
    spent += cost
    milestones.push({
      title,
      period: monthLabel(offset),
      duration: fmtDuration(months),
      cumulativeSpent: spent,
    })
    offset += months
  }

  push("Konzultace s energetikem", 1, CONSULTATION_COST)
  push("Projektová dokumentace", docsMonths, docsCost)
  for (const p of selected) push(p.name, p.durationMonths, Math.round(p.budget * scale))

  const totalMonths = offset

  return {
    id: "custom",
    name: "Váš plán",
    tone: "emerald",
    kicker: "Varianta A — váš plán",
    photo: {
      src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop",
      alt: "Řemeslníci při opravě domu",
    },
    heroStats: [
      {
        label: "Celkem zaplatíte",
        value: totalCost,
        format: fmtCzkShort,
        sub: `navýšení fondu o ${Math.round(scaledFundIncrease).toLocaleString("cs-CZ")} Kč/byt/měs`,
      },
      {
        label: "Dům ušetří ročně",
        value: Math.round(scaledSavingsPerYear),
        format: fmtCzkShort,
        sub: "na energiích a údržbě, každý rok",
      },
    ],
    milestones,
    totalMonths,
    totalCost,
    finishLabel: monthLabel(totalMonths).replace("od ", ""),
  }
}
```

---

## Task 5: Add static `SUSTAINABILITY_CARD`

**Files:**
- Modify: `components/dashboard/scenario-splash.tsx`

- [ ] **Step 1: Add the constant after `buildCardFromBuilding`**

```typescript
const SUSTAINABILITY_CARD: SplashCard = {
  id: "sustainability",
  name: "Energie nula",
  tone: "blue",
  kicker: "Varianta B — udržitelnost na prvním místě",
  photo: {
    src: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=1600&auto=format&fit=crop",
    alt: "Solární panely na střeše budovy",
  },
  heroStats: [
    {
      label: "CO₂ ušetříte ročně",
      value: 12.4,
      format: (v) => `${v.toFixed(1)} t`,
      sub: "méně emisí každý rok",
    },
    {
      label: "Úspora energií",
      value: 62,
      format: (v) => `${Math.round(v)} %`,
      sub: "z třídy D na energeticky soběstačný dům",
    },
  ],
  milestones: [
    {
      title: "Energetický audit a konzultace",
      period: "od ledna 2026",
      duration: "1 měsíc",
      cumulativeSpent: 25_000,
    },
    {
      title: "Projekt + PENB certifikát",
      period: "od února 2026",
      duration: "3 měsíce",
      cumulativeSpent: 515_000,
    },
    {
      title: "Zateplení obálky budovy",
      period: "od května 2026",
      duration: "9 měsíců",
      cumulativeSpent: 8_915_000,
    },
    {
      title: "Výměna oken a dveří",
      period: "od února 2027",
      duration: "4 měsíce",
      cumulativeSpent: 13_815_000,
    },
    {
      title: "Zateplení střešního pláště",
      period: "od června 2027",
      duration: "5 měsíců",
      cumulativeSpent: 17_015_000,
    },
  ],
  totalMonths: 22,
  totalCost: 17_015_000,
  finishLabel: "listopadu 2027",
}
```

---

## Task 6: Update `ScenarioSplash` props, card selection, and Supabase update

**Files:**
- Modify: `components/dashboard/scenario-splash.tsx`

- [ ] **Step 1: Add Supabase import at the top of the file**

Add after existing imports:
```typescript
import { createClient } from "@/lib/supabase/client"
```

- [ ] **Step 2: Update component props**

Old:
```typescript
export function ScenarioSplash({
  onClose,
  onSelect,
}: {
  onClose: () => void
  /** Volá se s id scénáře z mock dat („nejnutnejsi" / „kompletni"). */
  onSelect?: (scenarioId: string) => void
})
```

New:
```typescript
export function ScenarioSplash({
  onClose,
  onSelect,
  buildingData,
  buildingId,
}: {
  onClose: () => void
  /** Volá se s 'custom' nebo 'sustainability'. */
  onSelect?: (scenarioId: string) => void
  buildingData?: BuildingData
  buildingId?: string
})
```

- [ ] **Step 3: Update the `useMemo` that builds cards**

Old:
```typescript
  const cards = useMemo(() => {
    const quick = scenarios.find((s) => s.id === "nejnutnejsi")!
    const full = scenarios.find((s) => s.id === "kompletni")!
    return [
      buildCard(quick, "Varianta A — rychle a levně", {
        src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop",
        alt: "Řemeslníci při opravě domu",
      }),
      buildCard(full, "Varianta B — jednou a pořádně", {
        src: "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1600&auto=format&fit=crop",
        alt: "Zrekonstruovaný bytový dům",
      }),
    ]
  }, [])
```

New:
```typescript
  const cards = useMemo(() => {
    const variantA = buildingData
      ? buildCardFromBuilding(buildingData)
      : buildCard(
          scenarios.find((s) => s.id === "nejnutnejsi")!,
          "Varianta A — rychle a levně",
          {
            src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop",
            alt: "Řemeslníci při opravě domu",
          }
        )
    return [variantA, SUSTAINABILITY_CARD]
  }, [buildingData])
```

- [ ] **Step 4: Add Supabase update to the CTA click handler**

Find the CTA `onClick`:
```typescript
onClick={() => {
  onSelect?.(card.id)
  onClose()
}}
```

Replace with:
```typescript
onClick={() => {
  onSelect?.(card.id)
  if (buildingId) {
    createClient()
      .from("buildings")
      .update({ selected_scenario: card.id })
      .eq("id", buildingId)
      .then(() => {})
  }
  onClose()
}}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

---

## Task 7: Update `prehled` page to trigger splash from onboarding

**Files:**
- Modify: `app/dashboard/prehled/page.tsx`

- [ ] **Step 1: Add `useRouter` to imports**

`app/dashboard/prehled/page.tsx` line 1 already has `"use client"`. Find the React imports line:
```typescript
import { useEffect, useMemo, useRef, useState } from "react"
```
Add `useRouter` import on a new line after it:
```typescript
import { useRouter } from "next/navigation"
```

- [ ] **Step 2: Add `id` to `BuildingCalc` type**

Find the `BuildingCalc` type (around line 35):
```typescript
type BuildingCalc = {
  address: string | null
  units: number
```
Add `id` as the first field:
```typescript
type BuildingCalc = {
  id: string
  address: string | null
  units: number
```

- [ ] **Step 3: Add `router` instance inside `PrehledPage`**

At the top of the `PrehledPage` function body (after the existing `useState` declarations), add:
```typescript
const router = useRouter()
```

- [ ] **Step 4: Update the `useEffect` that checks URL params**

Old:
```typescript
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("splash") === "1") {
      setSplashOpen(true)
    }
  }, [])
```

New:
```typescript
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("splash") === "1" || params.get("from") === "onboarding") {
      setSplashOpen(true)
    }
  }, [])
```

- [ ] **Step 5: Update the `ScenarioSplash` usage to pass building data and clean URL**

Find the existing splash render (around line 302):
```typescript
      {splashOpen && (
        <ScenarioSplash
          onClose={() => setSplashOpen(false)}
          onSelect={(id) => setScenarioId(id)}
        />
      )}
```

Replace with:
```typescript
      {splashOpen && (
        <ScenarioSplash
          onClose={() => {
            setSplashOpen(false)
            if (new URLSearchParams(window.location.search).get("from") === "onboarding") {
              router.replace("/dashboard/prehled")
            }
          }}
          onSelect={(id) => setScenarioId(id)}
          buildingData={
            buildingCalc
              ? {
                  selected_renovations: buildingCalc.selected_renovations,
                  total_cost: buildingCalc.total_cost,
                  rent_years: buildingCalc.rent_years,
                  units: buildingCalc.units,
                }
              : undefined
          }
          buildingId={buildingCalc?.id}
        />
      )}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: End-to-end manual test**

1. Complete onboarding with some renovations selected
2. Confirm the splash auto-opens on arrival at the dashboard
3. Confirm Variant A card title is "Váš plán" and numbers reflect the onboarding total cost
4. Confirm Variant B is "Energie nula" with CO₂ and energy class stats
5. Click "Chci tuhle cestu" on one card — confirm splash closes and URL is `/dashboard/prehled` (no `from=onboarding`)
6. Open Supabase Table Editor → `buildings` → confirm `selected_scenario` is set on the latest row

---

## Task 8: Financials page reads `selected_scenario` for pre-selection

**Files:**
- Modify: `app/dashboard/financials/page.tsx`

- [ ] **Step 1: Extend `BuildingData` type to include `selected_scenario`**

Find (around line 60):
```typescript
type BuildingData = {
  selected_renovations: string[]
  total_cost: number
}
```

Replace with:
```typescript
type BuildingData = {
  selected_renovations: string[]
  total_cost: number
  selected_scenario: "custom" | "sustainability" | null
}
```

- [ ] **Step 2: Extend the Supabase select to fetch `selected_scenario`**

Find (around line 170):
```typescript
      .select("selected_renovations, total_cost")
```

Replace with:
```typescript
      .select("selected_renovations, total_cost, selected_scenario")
```

- [ ] **Step 3: Use `selected_scenario` to pre-select on load**

In the same `useEffect`, find the block that sets `selectedIds`:
```typescript
        if (mappedIds.length > 0) setSelectedIds(mappedIds)
```

Replace with:
```typescript
        if (data.selected_scenario === "sustainability") {
          setSelectedIds(projects.map((p) => p.id))
        } else if (mappedIds.length > 0) {
          setSelectedIds(mappedIds)
        }
```

- [ ] **Step 4: Add `projects` import if not already present**

`projects` is already imported at line 28. Verify it's in the import list — if not, add it:
```typescript
import {
  projects,
  scenarios,
  ...
} from "@/lib/mock-data"
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Manual test**

1. After completing onboarding and selecting "Chci tuhle cestu" on Variant B (sustainability), navigate to `/dashboard/financials`
2. Confirm all 4 projects are pre-selected (full set, matching the `kompletni` scenario visually)
3. Repeat with Variant A — confirm only the onboarding-selected renovations are active

---

## Done

All tasks complete when:
- Onboarding redirects with `?from=onboarding`
- Splash auto-opens on first dashboard visit
- Variant A card shows user's actual renovation plan with scaled costs
- Variant B card shows "Energie nula" sustainability scenario
- CTA click persists choice to Supabase `selected_scenario`
- Financials page pre-selects based on the saved choice
- URL is clean after splash closes
