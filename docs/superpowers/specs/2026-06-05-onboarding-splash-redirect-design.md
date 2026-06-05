# Onboarding → Splash Redirect & Scenario Variants

**Date:** 2026-06-05
**Status:** Approved

## Goal

After a user completes onboarding, redirect them to the dashboard and automatically show `ScenarioSplash` with two meaningful variants: one derived from their actual onboarding choices, one creative "sustainability first" scenario. The chosen variant is persisted to Supabase so the financials page can use it.

---

## 1. Redirect Trigger

**Mechanism:** URL parameter `?from=onboarding`

- Onboarding completion changes `router.push("/dashboard")` → `router.push("/dashboard?from=onboarding")`
- `prehled` page (server component) reads `searchParams.from`, passes `showSplash: boolean` down to its client component
- After the splash closes, client calls `router.replace("/dashboard/prehled")` to strip the param
- No localStorage, no timing hacks, no persistent state — the URL is the signal

---

## 2. ScenarioSplash Component Changes

### New prop

```ts
buildingData?: {
  selected_renovations: string[]
  total_cost: number
  rent_years: number
  units: number
}
```

When `buildingData` is provided, Variant A is built dynamically. Without it (dev `?splash=1` mode), falls back to the current mock `nejnutnejsi` scenario.

### Variant A — "Váš plán" (dynamic)

- New `buildCardFromBuilding(data)` function inside the component
- Maps `selected_renovations` string labels → project IDs using `RENOVATION_LABEL_TO_PROJECT` (same map as in `financials/page.tsx`)
- Scales project costs proportionally so they sum to `data.total_cost` (same `scaleProjectsToBuilding` logic, inlined or extracted to a shared util)
- Milestones generated from the scaled selected projects (same `push()` pattern as current `buildCard`)
- Hero stats: *"Celkem zaplatíte"* + *"Hotovo za"* (same as current quick-variant branch)
- Kicker: `"Varianta A — váš plán"`
- Emerald tone

### Variant B — "Udržitelnost na prvním místě" (static)

A `SUSTAINABILITY_CARD: SplashCard` constant defined at the top of the file.

- **Kicker:** `"Varianta B — udržitelnost na prvním místě"`
- **Name:** `"Energie nula"`
- **Photo:** Unsplash solar-panel/nature image
- **Hero stats:**
  - *"CO₂ ušetříte ročně"* — 12.4 t (fixed, aspirational)
  - *"Energetická třída"* — `"A"` (format: identity, sub: "z dnešní třídy D na A")
- **Milestones:** ~18-month full retrofit timeline
  - Konzultace s energetikem (1 měs.)
  - Projektová dokumentace (3 měs.)
  - Zateplení fasády + střecha (5 měs.)
  - Okna a dveře (2 měs.)
  - Tepelné čerpadlo + rekuperace (3 měs.)
  - Fotovoltaika (2 měs.)
- **Blue tone**

### onSelect values

Changes from mock IDs to semantic strings:
- `'custom'` — user chose Variant A (their plan)
- `'sustainability'` — user chose Variant B

---

## 3. Supabase Schema

Add column to the `building` table:

```sql
ALTER TABLE building ADD COLUMN selected_scenario text CHECK (selected_scenario IN ('custom', 'sustainability'));
```

Default: `null` (no scenario chosen / user closed without selecting).

### Write path

`onSelect` callback in `ScenarioSplash` triggers:

```ts
await supabase
  .from("building")
  .update({ selected_scenario: scenarioId })
  .eq("id", buildingId)
```

The `buildingId` is passed as a new prop `buildingId?: string` to `ScenarioSplash`. If absent (dev mode), the update is skipped.

### Read path (financials page)

`financials/page.tsx` already fetches `selected_renovations` and `total_cost`. Extend the select to include `selected_scenario`.

Pre-selection logic on load:
- `'sustainability'` → `setSelectedIds(allProjectIds)` (full `kompletni` scenario)
- `'custom'` or `null` → current behavior (map `selected_renovations` → project IDs, fall back to `DEFAULT_SCENARIO_ID`)

---

## 4. Data Flow

```
onboarding/page.tsx
  └─ saves to building (id, selected_renovations, total_cost, rent_years, units)
  └─ router.push("/dashboard?from=onboarding")

dashboard/prehled/page.tsx  (server)
  └─ reads searchParams.from === "onboarding"
  └─ fetches latest building record (id + all fields)
  └─ passes showSplash + buildingData + buildingId to client component

PrehledClient  (client)
  └─ if showSplash → render <ScenarioSplash buildingData={...} buildingId={...} ... />
  └─ onClose → router.replace("/dashboard/prehled")
  └─ onSelect(id) → UPDATE building SET selected_scenario = id

dashboard/financials/page.tsx
  └─ fetches selected_scenario alongside existing fields
  └─ uses it to pre-select scenario on mount
```

---

## 5. Out of Scope

- No changes to onboarding UI or step logic
- No animation changes to `ScenarioSplash`
- No new Supabase tables — column addition only
- Sustainability card numbers are fixed/aspirational, not calculated from building data
- The dev `?splash=1` trigger remains working as before
