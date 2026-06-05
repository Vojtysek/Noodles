# Per-project cost scaling

**Date:** 2026-06-05
**Status:** Approved

## Problem

The onboarding calculator saves one `total_cost` (sum of all selected renovations) to Supabase. The financials dashboard then proportionally distributes this total across dashboard projects using mock budget ratios. This is wrong because:

1. `total_cost` includes unmapped renovations (fotovoltaika, žaluzie, etc.) that have no dashboard project counterpart — inflating the scale factor.
2. Project `vytah` has no onboarding source and always shows raw mock values.

## Solution

Save individual project costs to a new `costs_by_project` JSONB column in Supabase, computed at onboarding time. The financials dashboard uses per-project costs to scale each project independently.

## Renovation → Project mapping

| Onboarding ID | Label              | Dashboard project ID |
|---------------|--------------------|----------------------|
| `windows`     | Okna               | `okna`               |
| `insulation`  | Zateplení fasády   | `fasada`             |
| `roof`        | Zateplení střechy  | `strecha`            |
| *(unmapped)*  | Venkovní žaluzie   | —                    |
| *(unmapped)*  | Tepelné čerpadlo   | —                    |
| *(unmapped)*  | Vytápění           | —                    |
| *(unmapped)*  | Rekuperace         | —                    |
| *(unmapped)*  | Fotovoltaika       | —                    |
| *(no source)* | —                  | `vytah`              |

Unmapped renovations contribute only to `total_cost`. Project `vytah` has no onboarding source and keeps mock values.

## Changes

### 1. Supabase migration

New file `supabase/migrations/<timestamp>_add_costs_by_project.sql`:

```sql
alter table buildings add column costs_by_project jsonb;
```

Example stored value: `{"okna": 1200000, "fasada": 3400000, "strecha": 900000}`

### 2. Onboarding (`app/onboarding/page.tsx`)

Add mapping constant alongside existing `RENOVATIONS`:

```typescript
const ONBOARDING_TO_PROJECT: Record<string, string> = {
  windows: "okna",
  insulation: "fasada",
  roof: "strecha",
}
```

Before the Supabase insert, compute:

```typescript
const geom = buildingGeometry(building)
const costsByProject = Object.fromEntries(
  selected
    .filter((id) => ONBOARDING_TO_PROJECT[id])
    .map((id) => [ONBOARDING_TO_PROJECT[id], renovationCost(id, geom, repair.numberOfUnits)])
)
```

Add `costs_by_project: costsByProject` to the insert payload.

Note: the step-2 handler already has a `g` variable (energy grade) — use a distinct name `geom` for the geometry to avoid shadowing.

### 3. Financials dashboard (`app/dashboard/financials/page.tsx`)

**`BuildingData` type** — add field:

```typescript
costs_by_project: Record<string, number> | null
```

**Supabase select** — add `costs_by_project` to the select string.

**`scaleProjectsToBuilding`** — replace signature and body:

```typescript
function scaleProjectsToBuilding(
  baseProjects: Project[],
  costsByProject: Record<string, number> | null
): Project[] {
  if (!costsByProject) return baseProjects
  return baseProjects.map((p) => {
    const projectCost = costsByProject[p.id]
    if (!projectCost || projectCost <= 0) return p
    const sf = projectCost / p.budget
    return {
      ...p,
      budget: projectCost,
      savingsPerYear: Math.round(p.savingsPerYear * sf),
      fundIncreasePerFlat: Math.round(p.fundIncreasePerFlat * sf),
      baseline: {
        ...p.baseline,
        annualCost: Math.round(p.baseline.annualCost * sf),
      },
      costBreakdown: p.costBreakdown.map((cb) => ({
        ...cb,
        value: Math.round(cb.value * sf),
      })),
      costItems: p.costItems.map((ci) => ({
        ...ci,
        amount: Math.round(ci.amount * sf),
      })),
      cashflow: p.cashflow.map((cf) => ({
        ...cf,
        value: Math.round(cf.value * sf),
      })),
    }
  })
}
```

**`scaledProjects` useMemo** — update call site:

```typescript
const scaledProjects = useMemo(
  () => scaleProjectsToBuilding(projects, buildingData?.costs_by_project ?? null),
  [buildingData]
)
```

The `selected_renovations` field remains used for pre-selecting which project IDs are active in the UI (the `setSelectedIds` logic in the `useEffect`). No change needed there.

## Out of scope

- Adding `vytah` to the onboarding calculator.
- Updating `scenario-splash.tsx` or other pages that use `total_cost` — they are not affected by this change.
- Backfilling existing buildings rows (old rows will have `costs_by_project = null` and fall back to mock values, same as before).
