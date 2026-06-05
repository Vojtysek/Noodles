# Per-project cost scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save individual per-project renovation costs from the onboarding calculator to Supabase, and use those costs in the financials dashboard to scale each project independently instead of splitting one total_cost proportionally.

**Architecture:** A new `costs_by_project` JSONB column stores a map of `{okna, fasada, strecha}` costs computed at onboarding save time. The financials dashboard reads this column and applies a per-project scale factor to each mock project independently.

**Tech Stack:** Next.js (TypeScript), Supabase (PostgreSQL), React hooks

---

### Task 1: Add `costs_by_project` column via migration

**Files:**
- Create: `supabase/migrations/20260605170000_add_costs_by_project.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260605170000_add_costs_by_project.sql` with:

```sql
alter table buildings add column costs_by_project jsonb;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applies without error, `costs_by_project` column appears in the `buildings` table.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260605170000_add_costs_by_project.sql
git commit -m "feat: add costs_by_project column to buildings"
```

---

### Task 2: Save per-project costs in onboarding

**Files:**
- Modify: `app/onboarding/page.tsx`

- [ ] **Step 1: Add the renovation→project mapping constant**

Directly after the `RENOVATIONS` array (around line 71), add:

```typescript
const ONBOARDING_TO_PROJECT: Record<string, string> = {
  windows: "okna",
  insulation: "fasada",
  roof: "strecha",
}
```

- [ ] **Step 2: Compute `costsByProject` before the Supabase insert**

In the `step === 2` branch, just before the `try` block (around line 569), add:

```typescript
const geom = buildingGeometry(building)
const costsByProject = Object.fromEntries(
  selected
    .filter((id) => ONBOARDING_TO_PROJECT[id])
    .map((id) => [
      ONBOARDING_TO_PROJECT[id],
      renovationCost(id, geom, repair.numberOfUnits),
    ])
)
```

- [ ] **Step 3: Add `costs_by_project` to the Supabase insert payload**

In the `.insert({...})` call (around line 575), add after `selected_renovations: selectedLabels,`:

```typescript
costs_by_project: costsByProject,
```

The complete insert block should look like:

```typescript
await supabase.from("buildings").insert({
  address: building?.address ?? null,
  units: repair.numberOfUnits,
  floors: building?.floors ?? null,
  year_built: building?.yearBuilt ?? null,
  zastavena_plocha: building?.zastavenaFlocha ?? null,
  energy_grade: displayGrade,
  insulated,
  new_windows: newWindows,
  selected_renovations: selectedLabels,
  costs_by_project: costsByProject,
  monthly_per_unit: Math.round(calc.monthlyPerUnit),
  total_cost: calc.alpha,
  final_rent: calc.finalRent,
  rent_years: repair.rentYears,
  window_count: derivedWindowCount,
  capped_by_max: calc.cappedByMax,
})
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "feat: save per-project costs to buildings.costs_by_project"
```

---

### Task 3: Use per-project costs in financials dashboard

**Files:**
- Modify: `app/dashboard/financials/page.tsx`

- [ ] **Step 1: Add `costs_by_project` to the `BuildingData` type**

Replace the `BuildingData` type (lines 60–64):

```typescript
type BuildingData = {
  selected_renovations: string[]
  total_cost: number
  selected_scenario: "custom" | "sustainability" | null
  costs_by_project: Record<string, number> | null
}
```

- [ ] **Step 2: Replace `scaleProjectsToBuilding` signature and body**

Replace the entire function (lines 72–117):

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
      spent: 0,
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

- [ ] **Step 3: Add `costs_by_project` to the Supabase select**

In the `useEffect` (around line 169), change:

```typescript
.select("selected_renovations, total_cost, selected_scenario")
```

to:

```typescript
.select("selected_renovations, total_cost, selected_scenario, costs_by_project")
```

- [ ] **Step 4: Update the `scaledProjects` useMemo call site**

Replace the `scaledProjects` useMemo (lines 189–197):

```typescript
const scaledProjects = useMemo(
  () =>
    scaleProjectsToBuilding(
      projects,
      buildingData?.costs_by_project ?? null
    ),
  [buildingData]
)
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/financials/page.tsx
git commit -m "feat: scale financials projects using per-project costs"
```
