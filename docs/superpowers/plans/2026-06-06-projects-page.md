# Projects Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `/dashboard/projects` — a client page showing all renovation projects as a toggleable grid, with selected ones highlighted, persisting changes to Supabase.

**Architecture:** Single client component at `app/dashboard/projects/page.tsx` fetching building data from Supabase on mount. Toggle writes back to `selected_renovations` using the authenticated user's ID. Sidebar gets one new nav entry.

**Tech Stack:** Next.js 14 App Router, React, Supabase client, Tailwind CSS, lucide-react, existing lib utilities.

---

### Task 1: Create the projects page

**Files:**
- Create: `app/dashboard/projects/page.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleCheck, Star, Hammer } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { projects, projectsByPriority, fmtCzkShort, type Project } from "@/lib/mock-data"
import { RENOVATION_LABEL_TO_PROJECT } from "@/lib/scenarios"

type BuildingData = {
  selected_renovations: string[]
  costs_by_project: Record<string, number> | null
}

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

export default function ProjectsPage() {
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoaded(true)
        return
      }
      setUserId(user.id)
      supabase
        .from("buildings")
        .select("selected_renovations, costs_by_project")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setBuildingData(data)
            setSelectedLabels(data.selected_renovations ?? [])
          }
          setLoaded(true)
        })
    })
  }, [])

  const scaledProjects = useMemo(
    () => scaleProjectsToBuilding(projectsByPriority, buildingData?.costs_by_project ?? null),
    [buildingData]
  )

  const selectedIds = useMemo(
    () =>
      new Set(
        selectedLabels
          .map((label) => RENOVATION_LABEL_TO_PROJECT[label])
          .filter(Boolean)
      ),
    [selectedLabels]
  )

  const totalCost = useMemo(
    () =>
      scaledProjects
        .filter((p) => selectedIds.has(p.id))
        .reduce((sum, p) => sum + p.budget, 0),
    [scaledProjects, selectedIds]
  )

  async function toggleProject(project: Project) {
    const label = Object.entries(RENOVATION_LABEL_TO_PROJECT).find(
      ([, id]) => id === project.id
    )?.[0]
    if (!label || !userId) return

    const isSelected = selectedLabels.includes(label)
    const newLabels = isSelected
      ? selectedLabels.filter((l) => l !== label)
      : [...selectedLabels, label]

    const prev = selectedLabels
    setSelectedLabels(newLabels)
    setSaving(true)
    setSavedRecently(false)

    const supabase = createClient()
    const { error } = await supabase
      .from("buildings")
      .update({ selected_renovations: newLabels })
      .eq("user_id", userId)

    setSaving(false)
    if (error) {
      setSelectedLabels(prev)
    } else {
      setSavedRecently(true)
      setTimeout(() => setSavedRecently(false), 2000)
    }
  }

  if (!loaded) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="rounded-[2rem] rounded-br-[5rem] bg-zinc-950 p-6 sm:p-8">
          <div className="mb-2 h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mb-2 h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!buildingData) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center py-24">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border bg-background/60 p-8 text-center backdrop-blur-sm">
          <Hammer className="size-8 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            Zatím nemáte uložený plán
          </h2>
          <p className="text-sm text-muted-foreground">
            Projděte si kalkulaci a vyberte renovace.
          </p>
          <Button asChild>
            <a href="/onboarding">Spustit kalkulaci</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-blue-500/8 blur-[120px]"
      />

      {/* Hero */}
      <div className="relative isolate overflow-hidden rounded-[2rem] rounded-br-[5rem] bg-zinc-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-blue-500/15 blur-[100px]"
        />
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-7 bg-blue-300/70" />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-blue-300 uppercase">
              Váš plán rekonstrukce
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Projekty
          </h1>
          <p className="mt-1.5 text-sm text-white/60">
            Vyberte rekonstrukce pro váš dům.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium tabular-nums">
              {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "projekt" : "projektů"} vybráno
            </span>
            {totalCost > 0 && (
              <span className="rounded-full bg-blue-400/20 px-3 py-1 text-sm font-medium text-blue-300 tabular-nums">
                Celkem {fmtCzkShort(totalCost)}
              </span>
            )}
            <span
              className={cn(
                "text-xs transition-opacity duration-300",
                saving || savedRecently ? "opacity-100" : "opacity-0"
              )}
            >
              {saving ? (
                <span className="text-white/50">Ukládám…</span>
              ) : (
                <span className="text-emerald-400">Uloženo ✓</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scaledProjects.map((project) => {
          const isSelected = selectedIds.has(project.id)
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => toggleProject(project)}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5",
                isSelected
                  ? "border-primary/60 bg-primary/5 shadow-lg ring-2 ring-primary/20"
                  : "border-border bg-background/60 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {project.priority === 1 && (
                    <Star
                      className={cn(
                        "size-3.5 shrink-0",
                        isSelected
                          ? "fill-amber-400 text-amber-400"
                          : "text-amber-400"
                      )}
                    />
                  )}
                  <p className="font-medium leading-snug">{project.name}</p>
                </div>
                {isSelected && (
                  <CircleCheck className="size-5 shrink-0 text-primary" />
                )}
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {fmtCzkShort(project.budget)}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {project.durationMonths} měs.
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                  −{project.energySavingPct} % energie
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles without errors**

```bash
cd /Users/maty/Documents/Git/Personal/Noodles && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/projects/page.tsx
git commit -m "feat: add /dashboard/projects page with renovation toggle grid"
```

---

### Task 2: Add Projekty to sidebar nav

**Files:**
- Modify: `components/dashboard/sidebar.tsx`

- [ ] **Step 1: Add `Hammer` to the lucide-react import**

In `components/dashboard/sidebar.tsx`, change line 8:

```ts
// Before:
import {
  Users,
  ChartColumn,
  FileDown,
  Building2,
  House,
  LogOut,
  Sun,
  Moon,
} from "lucide-react"

// After:
import {
  Users,
  ChartColumn,
  FileDown,
  Building2,
  House,
  LogOut,
  Sun,
  Moon,
  Hammer,
} from "lucide-react"
```

- [ ] **Step 2: Add the Projekty nav item to `NAV_ITEMS`**

Change the `NAV_ITEMS` array (currently lines 22–27):

```ts
// Before:
const NAV_ITEMS = [
  { href: "/dashboard/prehled", label: "Přehled", icon: House },
  { href: "/dashboard/rezidenti", label: "Rezidenti", icon: Users },
  { href: "/dashboard/financials", label: "Finance", icon: ChartColumn },
  { href: "/dashboard/exporty", label: "Exporty", icon: FileDown },
]

// After:
const NAV_ITEMS = [
  { href: "/dashboard/prehled", label: "Přehled", icon: House },
  { href: "/dashboard/rezidenti", label: "Rezidenti", icon: Users },
  { href: "/dashboard/financials", label: "Finance", icon: ChartColumn },
  { href: "/dashboard/projects", label: "Projekty", icon: Hammer },
  { href: "/dashboard/exporty", label: "Exporty", icon: FileDown },
]
```

- [ ] **Step 3: Verify TypeScript compiles without errors**

```bash
cd /Users/maty/Documents/Git/Personal/Noodles && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to this file).

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/sidebar.tsx
git commit -m "feat: add Projekty to dashboard sidebar nav"
```
