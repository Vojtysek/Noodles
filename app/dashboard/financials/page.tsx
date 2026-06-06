"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import {
  Wallet,
  TrendingDown,
  CalendarClock,
  HandCoins,
  CircleCheck,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BreakdownBars,
  ComparisonLineChart,
  seriesCrossing,
} from "@/components/dashboard/charts"
import {
  fmtCzk,
  fmtCzkShort,
  type Project,
  type Scenario,
  type ScenarioTone,
} from "@/lib/mock-data"
import { userProjects, userScenarios } from "@/lib/scenarios"

const START_YEAR = 2026
const HORIZONS = [10, 15, 20, 30]
const SAMPLES = 6

// Barvy scénářů — bez rekonstrukce: červená, s rekonstrukcí: modrá (primary).
const WITHOUT_COLOR = "var(--color-red-500, #ef4444)"
const WITH_COLOR = "var(--color-blue-500, #3b82f6)"

// Tečka scénáře — stejné mapování jako na stránce Přehled.
const TONE_DOT: Record<ScenarioTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
}

type BuildingData = {
  selected_renovations: string[]
  total_cost: number
  selected_scenario: "custom" | "sustainability" | null
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

/**
 * Animovaná částka — při změně hodnoty (scénář, horizont) plynule přepočítá
 * číslo na obrazovce. Stejný count-up vzor jako chipy na Přehledu / landingu.
 */
function AnimatedCzk({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = fmtCzkShort(value)
      prev.current = value
      return
    }
    const counter = { v: prev.current }
    const tween = gsap.to(counter, {
      v: value,
      duration: 0.9,
      ease: "power2.out",
      onUpdate() {
        el.textContent = fmtCzkShort(counter.v)
      },
    })
    prev.current = value
    return () => {
      tween.kill()
    }
  }, [value])

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {fmtCzkShort(value)}
    </span>
  )
}

export default function FinancialsPage() {
  const [horizon, setHorizon] = useState(15)
  const [mixOpen, setMixOpen] = useState(false)
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoaded(true)
        return
      }
      supabase
        .from("buildings")
        .select("selected_renovations, total_cost, selected_scenario, costs_by_project")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setBuildingData(data)
          setLoaded(true)
        })
    })
  }, [])

  // Renovace, které uživatel skutečně vybral v kalkulaci — pouze jeho plán.
  const selectedRenovations = buildingData?.selected_renovations ?? []

  // Scénář uživatele („Váš plán") — prázdné pole, pokud nemá žádný plán.
  const userScenarioList = useMemo(
    () => userScenarios(selectedRenovations),
    [selectedRenovations]
  )

  // Pouze projekty, které uživatel vybral, naškálované jeho náklady.
  const scaledProjects = useMemo(
    () =>
      scaleProjectsToBuilding(
        userProjects(selectedRenovations),
        buildingData?.costs_by_project ?? null
      ),
    [selectedRenovations, buildingData]
  )

  const scaledProjectsByPriority = useMemo(
    () => [...scaledProjects].sort((a, b) => a.priority - b.priority),
    [scaledProjects]
  )

  const activeScenario: Scenario | null = userScenarioList[0] ?? null

  const selected = scaledProjectsByPriority
  const single = selected.length === 1 ? selected[0] : null

  // Prázdný stav: žádný uživatel, žádná budova nebo žádné namapované renovace.
  const isEmpty = loaded && scaledProjects.length === 0

  const agg = useMemo(() => {
    const budget = selected.reduce((sum, p) => sum + p.budget, 0)
    const spent = selected.reduce((sum, p) => sum + p.spent, 0)
    const savingsPerYear = selected.reduce((sum, p) => sum + p.savingsPerYear, 0)
    const fundIncreasePerFlat = selected.reduce((sum, p) => sum + p.fundIncreasePerFlat, 0)
    const annualCost = selected.reduce((sum, p) => sum + p.baseline.annualCost, 0)
    // Růst nákladů vážený podle jejich výše.
    const growth =
      selected.reduce((sum, p) => sum + p.baseline.costGrowthPct * p.baseline.annualCost, 0) /
      annualCost /
      100

    // Roční modelace obou scénářů: náklady bez rekonstrukce rostou z plné základny,
    // po rekonstrukci ze snížené (úspora roste s cenami energií).
    const annualWithout: number[] = []
    const annualWith: number[] = []
    const cumWithout: number[] = [0]
    const cumWith: number[] = [budget]
    for (let t = 0; t <= horizon; t++) {
      const factor = Math.pow(1 + growth, t)
      annualWithout.push(annualCost * factor)
      annualWith.push((annualCost - savingsPerYear) * factor)
      if (t > 0) {
        cumWithout.push(cumWithout[t - 1] + annualWithout[t - 1])
        cumWith.push(cumWith[t - 1] + annualWith[t - 1])
      }
    }

    const lossAtHorizon = cumWithout[horizon] - cumWith[horizon]

    const sample = (values: number[]) =>
      Array.from({ length: SAMPLES }, (_, i) => {
        const t = Math.round((i / (SAMPLES - 1)) * horizon)
        return { year: String(START_YEAR + t), value: values[t] }
      })

    const annualSeries = { without: sample(annualWithout), with: sample(annualWith) }
    const cumSeries = { without: sample(cumWithout), with: sample(cumWith) }
    // Bod zlomu počítaný z vykreslených (vzorkovaných) křivek — značka v grafu
    // tak sedí přesně na jejich průsečíku.
    const breakEvenPos = seriesCrossing(cumSeries.with, cumSeries.without)

    const costBreakdown = single
      ? single.costBreakdown
      : selected.map((p) => ({ label: p.name, value: p.budget }))

    const costItems = selected.flatMap((p) =>
      p.costItems.map((item) => ({
        ...item,
        project: p.shortName,
        share: Math.round((item.amount / budget) * 1000) / 10,
      }))
    )

    return {
      budget,
      spent,
      savingsPerYear,
      fundIncreasePerFlat,
      annualCost,
      growthPct: growth * 100,
      annualWithoutNow: annualWithout[0],
      annualWithNow: annualWith[0],
      annualWithoutEnd: annualWithout[horizon],
      annualWithEnd: annualWith[horizon],
      cumWithoutEnd: cumWithout[horizon],
      cumWithEnd: cumWith[horizon],
      breakEvenPos,
      lossAtHorizon,
      annualSeries,
      cumSeries,
      costBreakdown,
      costItems,
    }
  }, [selected, single, horizon])

  const spentPct = Math.round((agg.spent / agg.budget) * 100)
  const savingsPct = Math.round((agg.savingsPerYear / agg.annualCost) * 100)
  const afterBarPct = Math.round((agg.annualWithNow / agg.annualWithoutNow) * 100)
  const profitable = agg.lossAtHorizon > 0
  const scopeLabel = activeScenario
    ? activeScenario.name
    : single
      ? single.name
      : "Vlastní výběr"
  const breakEvenYearNum =
    agg.breakEvenPos !== null ? Math.round(START_YEAR + agg.breakEvenPos * horizon) : null
  const breakEvenLabel =
    breakEvenYearNum !== null ? String(breakEvenYearNum) : `za horizontem ${horizon} let`

  const kpis = [
    {
      icon: Wallet,
      label: "Investice",
      value: fmtCzkShort(agg.budget),
      sub: "jednorázově, vč. rezerv",
      accent: null,
    },
    {
      icon: TrendingDown,
      label: "Roční úspora",
      value: fmtCzkShort(agg.savingsPerYear),
      sub: `−${savingsPct.toLocaleString("cs-CZ")} % ročních nákladů`,
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: CalendarClock,
      label: "Bod zlomu",
      value: breakEvenYearNum !== null ? String(breakEvenYearNum) : `> ${horizon} let`,
      sub:
        breakEvenYearNum !== null
          ? `rok, kdy se investice vrátí`
          : "mimo zvolený horizont",
      accent: null,
    },
    {
      icon: HandCoins,
      label: "Fond oprav",
      value: `+${fmtCzk(agg.fundIncreasePerFlat)}`,
      sub: "na byt měsíčně po dobu splácení",
      accent: null,
    },
  ]

  // Loading state: show skeleton while data is being fetched
  if (!loaded || (loaded && buildingData === null && scaledProjects.length === 0)) {
    return (
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Ambient blobs (hidden during loading) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-red-500/8 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-1/4 -z-10 size-96 rounded-full bg-blue-500/8 blur-[120px]"
        />

        {/* Hero skeleton */}
        <div className="relative isolate overflow-hidden rounded-[2rem] rounded-br-[5rem] bg-zinc-950">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12">
            {/* Left section skeleton */}
            <div>
              <div className="mb-2 h-3 w-24 bg-muted animate-pulse rounded" />
              <div className="mb-4 h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="mb-6 h-3 w-48 bg-muted animate-pulse rounded" />
              <div className="mt-7 space-y-2">
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                <div className="h-12 w-40 bg-muted animate-pulse rounded" />
                <div className="h-2 w-56 bg-muted animate-pulse rounded" />
              </div>
            </div>

            {/* Right section skeleton */}
            <div className="flex flex-col gap-4 rounded-2xl bg-muted/30 p-5">
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              <div className="space-y-3">
                <div className="h-8 w-full bg-muted animate-pulse rounded" />
                <div className="h-8 w-full bg-muted animate-pulse rounded" />
              </div>
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Controls skeleton */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-8 w-56 bg-muted animate-pulse rounded" />
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-3 w-96 bg-muted animate-pulse rounded" />
        </div>

        {/* KPI skeleton */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border bg-background/60 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-4 lg:gap-x-0 lg:gap-y-0 lg:divide-x lg:divide-border/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              <div className="h-2.5 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="flex flex-col gap-3">
          <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-3 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
              >
                <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-2.5 w-48 bg-muted animate-pulse rounded mb-4" />
                <div className="h-32 w-full bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Budget skeleton */}
        <div className="flex flex-col gap-3">
          <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
              <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
              <div className="h-2.5 w-40 bg-muted animate-pulse rounded mb-4" />
              <div className="h-10 w-20 bg-muted animate-pulse rounded mb-3" />
              <div className="h-2.5 w-full bg-muted animate-pulse rounded" />
              <div className="mt-4 h-2 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
              <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
              <div className="h-2.5 w-40 bg-muted animate-pulse rounded mb-4" />
              <div className="h-40 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="overflow-hidden rounded-2xl border bg-background/60 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-5 py-3.5">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-1 p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-full bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center py-24">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border bg-background/60 p-8 text-center backdrop-blur-sm">
          <Wallet className="size-8 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            Zatím nemáte uložený plán
          </h2>
          <p className="text-sm text-muted-foreground">
            {loaded
              ? "Projděte si kalkulaci a vyberte renovace — pak se vám tu zobrazí finanční model vašeho plánu."
              : "Načítáme váš plán…"}
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
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-red-500/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/4 -z-10 size-96 rounded-full bg-blue-500/8 blur-[120px]"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Hero — verdikt na první pohled (tmavý pruh jako na Přehledu)        */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="anim-in relative isolate overflow-hidden rounded-[2rem] rounded-br-[5rem] bg-zinc-950 text-white"
        style={{ "--ai-y": "-20px", "--ai-dur": "0.6s" } as React.CSSProperties}
      >
        {/* Barevné záře — amber (nečinnost) vlevo, blue (rekonstrukce) vpravo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-red-500/15 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-28 -z-10 size-96 rounded-full bg-blue-500/20 blur-[110px]"
        />

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12">
          {/* Levá část — titulek + hlavní číslo */}
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="h-px w-7 bg-blue-300/70" />
              <p className="text-[11px] font-semibold tracking-[0.2em] text-blue-300 uppercase">
                Dva scénáře, jedno rozhodnutí
              </p>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Finance</h1>
            <p className="mt-1.5 text-sm text-white/60">
              Rekonstrukce vs. nečinnost — kolik vás stojí každá cesta.
            </p>

            <div className="mt-7">
              <p className="text-sm text-white/70">
                {profitable ? "Rekonstrukce ušetří" : "Do návratnosti chybí"}
              </p>
              <p
                className={cn(
                  "mt-1 text-4xl font-bold tracking-tight sm:text-5xl",
                  profitable ? "text-blue-300" : "text-amber-300"
                )}
              >
                <AnimatedCzk value={Math.abs(agg.lossAtHorizon)} />
              </p>
              <p className="mt-2 text-xs text-white/50">
                {profitable ? (
                  <>
                    za {horizon} let oproti nečinnosti
                    {breakEvenYearNum !== null && (
                      <> · vyplatí se od roku {breakEvenYearNum}</>
                    )}
                  </>
                ) : (
                  <>na horizontu {horizon} let — zkuste delší horizont</>
                )}
              </p>
            </div>
          </div>

          {/* Pravá část — skleněná karta Dnes / Potom (vzor z landingu) */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/15 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/70">Roční náklady domu</span>
              <span className="rounded-md bg-blue-400/15 px-1.5 py-0.5 text-xs font-medium tabular-nums text-blue-300">
                −{savingsPct.toLocaleString("cs-CZ")} %
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-[11px] text-white/50">Dnes</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-white/35" />
                </div>
                <span className="w-20 shrink-0 text-right text-xs tabular-nums text-white/70">
                  {fmtCzkShort(agg.annualWithoutNow)}
                </span>
              </div>
                <div className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-[11px] text-white/50">Potom</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-[width] duration-700 ease-out"
                      style={{ width: `${afterBarPct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums text-blue-300">
                  {fmtCzkShort(agg.annualWithNow)}
                </span>
              </div>
            </div>
            <p className="text-xs text-pretty text-white/60">
              Úspora{" "}
              <span className="font-semibold tabular-nums text-blue-300">
                {fmtCzk(agg.savingsPerYear)} ročně
              </span>{" "}
              po dokončení vybraných projektů
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Ovládání — scénář + horizont na jednom řádku                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="anim-in flex flex-col gap-3"
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.1s" } as React.CSSProperties}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Scénář
            </span>
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
              {userScenarioList.map((s) => (
                <span
                  key={s.id}
                  aria-pressed
                  className="flex items-center gap-2 rounded-full bg-background px-3.5 py-1.5 text-sm font-medium text-foreground shadow"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[s.tone])} />
                  {s.name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Horizont
            </span>
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  aria-pressed={h === horizon}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-all tabular-nums",
                    h === horizon
                      ? "bg-background text-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {h} let
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tagline + rozpočet vašeho plánu */}
        <p className="text-xs text-muted-foreground">
          {activeScenario?.tagline}{" "}
          <span className="font-medium text-foreground tabular-nums">
            Celkem {fmtCzkShort(agg.budget)}.
          </span>
        </p>

        {/* Vaše vybrané projekty (jen pro náhled) */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setMixOpen((v) => !v)}
            aria-expanded={mixOpen}
            className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Vaše vybrané projekty
            {mixOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>

          {mixOpen && (
            <div className="flex flex-col gap-2.5 rounded-2xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {selected.length} {selected.length === 1 ? "projekt" : "projektů"} ve vašem plánu
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {scaledProjectsByPriority.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-1.5 rounded-2xl border border-primary/60 bg-primary/5 p-3 text-left shadow-lg ring-3 ring-primary/15"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {p.priority === 1 && (
                            <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                          )}
                          <p className="text-sm font-medium">{p.shortName}</p>
                        </div>
                        <CircleCheck className="size-4 shrink-0 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {fmtCzkShort(p.budget)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI pruh — ploché sloupce s předěly (vzor z landingu)               */}
      {/* ------------------------------------------------------------------ */}
      <dl
        className="anim-in grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border bg-background/60 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-4 lg:gap-x-0 lg:gap-y-0 lg:divide-x lg:divide-border/60"
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.2s" } as React.CSSProperties}
      >
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1 lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <kpi.icon className="size-3.5 shrink-0 text-primary" />
              {kpi.label}
            </dt>
            <dd className={cn("text-xl font-semibold tabular-nums sm:text-2xl", kpi.accent)}>
              {kpi.value}
            </dd>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </dl>

      {/* ------------------------------------------------------------------ */}
      {/* Porovnání scénářů — grafy s kontextem                               */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="anim-in flex flex-col gap-3"
        style={{ "--ai-y": "40px", "--ai-dur": "0.7s", "--ai-delay": "0.3s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Porovnání scénářů — {scopeLabel}
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {/* Vyplatí se to? — kumulativní náklady s bodem zlomu */}
          <div
            data-fin-block
            className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5 lg:rounded-bl-[3rem]"
          >
            {/* Ručně kreslené sluníčko v rohu — stejný motiv jako na Přehledu */}
            <svg
              aria-hidden
              className="pointer-events-none absolute top-3 right-4 size-16 text-blue-500/30"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="32" cy="32" r="11" />
              <path d="M32 6 V14 M32 50 V58 M6 32 H14 M50 32 H58 M13 13 L19 19 M45 45 L51 51 M51 13 L45 19 M19 45 L13 51" />
            </svg>
            <p className="text-sm font-medium">Vyplatí se to?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Kumulativní náklady vč. investice za {horizon} let
            </p>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-red-500" />
                  Bez rekonstrukce
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-red-600 dark:text-red-400">
                  {fmtCzkShort(agg.cumWithoutEnd)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                  S rekonstrukcí
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  {fmtCzkShort(agg.cumWithEnd)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <ComparisonLineChart
                series={[
                  {
                    label: "Bez rekonstrukce",
                    color: WITHOUT_COLOR,
                    points: agg.cumSeries.without,
                  },
                  {
                    label: "S rekonstrukcí (vč. investice)",
                    color: WITH_COLOR,
                    points: agg.cumSeries.with,
                  },
                ]}
                formatValue={fmtCzkShort}
                marker={
                  agg.breakEvenPos !== null
                    ? { position: agg.breakEvenPos, label: `Bod zlomu ${breakEvenLabel}` }
                    : null
                }
              />
            </div>
          </div>

          {/* Roční náklady — vývoj v čase */}
          <div
            data-fin-block
            className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
          >
            <p className="text-sm font-medium">Roční náklady</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Bez rekonstrukce rostou s cenami energií — úspora se každý rok zvětšuje
            </p>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-red-500" />
                  Za {horizon} let bez akce
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-red-600 dark:text-red-400">
                  {fmtCzkShort(agg.annualWithoutEnd)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                  Po rekonstrukci
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  {fmtCzkShort(agg.annualWithEnd)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <ComparisonLineChart
                series={[
                  {
                    label: "Bez rekonstrukce",
                    color: WITHOUT_COLOR,
                    points: agg.annualSeries.without,
                  },
                  {
                    label: "S rekonstrukcí",
                    color: WITH_COLOR,
                    points: agg.annualSeries.with,
                  },
                ]}
                formatValue={fmtCzkShort}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Rozpočet — čerpání, rozpad a položky                                */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="anim-in flex flex-col gap-3"
        style={{ "--ai-y": "40px", "--ai-dur": "0.7s", "--ai-delay": "0.4s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Rozpočet — {scopeLabel}
          </p>
        </div>

        <div data-fin-block className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr]">
          {/* Čerpání rozpočtu — progress místo donutu */}
          <div className="flex flex-col rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
            <p className="text-sm font-medium">Čerpání rozpočtu</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Kolik z rozpočtu už je proinvestováno
            </p>
            <p className="mt-5 text-3xl font-bold tabular-nums">
              {spentPct.toLocaleString("cs-CZ")} %
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                style={{ width: `${spentPct}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-baseline justify-between text-xs text-muted-foreground">
              <span>
                Vyčerpáno{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {fmtCzkShort(agg.spent)}
                </span>
              </span>
              <span className="tabular-nums">z {fmtCzkShort(agg.budget)}</span>
            </div>
            <div className="mt-auto flex items-baseline justify-between gap-2 border-t pt-3 text-sm">
              <span className="text-muted-foreground">Navýšení fondu oprav</span>
              <span className="font-semibold tabular-nums">
                +{fmtCzk(agg.fundIncreasePerFlat)} / byt / měsíc
              </span>
            </div>
          </div>

          {/* Rozpad nákladů */}
          <div className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
            <p className="text-sm font-medium">Rozpad nákladů</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {single ? "Hlavní položky projektu" : "Rozpočet po projektech"}
            </p>
            <div className="mt-4">
              <BreakdownBars data={agg.costBreakdown} formatValue={fmtCzkShort} />
            </div>
          </div>
        </div>

        {/* Položky rozpočtu — tabulka s hlavičkovým pruhem (vzor z landingu) */}
        <div data-fin-block className="overflow-hidden rounded-2xl border bg-background/60 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-5 py-3.5">
            <p className="text-sm font-semibold tracking-tight">Položky rozpočtu</p>
            <p className="text-xs text-muted-foreground">
              <span className="tabular-nums">{agg.costItems.length}</span> položek ·{" "}
              <span className="tabular-nums">{fmtCzkShort(agg.budget)}</span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Položka</th>
                  {!single && <th className="px-5 py-2.5 font-medium">Projekt</th>}
                  <th className="px-5 py-2.5 font-medium">Dodavatel</th>
                  <th className="px-5 py-2.5 text-right font-medium">Částka</th>
                  <th className="px-5 py-2.5 text-right font-medium">Podíl</th>
                </tr>
              </thead>
              <tbody>
                {agg.costItems.map((row) => (
                  <tr
                    key={`${row.project}-${row.item}`}
                    className="border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-2.5 font-medium">{row.item}</td>
                    {!single && (
                      <td className="px-5 py-2.5">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {row.project}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-2.5 text-muted-foreground">{row.supplier}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{fmtCzk(row.amount)}</td>
                    <td className="px-5 py-2.5 text-right text-muted-foreground tabular-nums">
                      {row.share.toLocaleString("cs-CZ")} %
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30 font-medium">
                  <td className="px-5 py-2.5">Celkem</td>
                  {!single && <td />}
                  <td />
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtCzk(agg.budget)}</td>
                  <td className="px-5 py-2.5 text-right text-muted-foreground tabular-nums">
                    100 %
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
