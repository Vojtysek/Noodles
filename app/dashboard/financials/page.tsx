"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CalendarClock,
  HandCoins,
  CircleCheck,
  Star,
  ChevronDown,
  ChevronUp,
  Flame,
  Percent,
  Hourglass,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BreakdownBars,
  ComparisonLineChart,
  FinancingDonut,
  seriesCrossing,
  crossingYearIndex,
} from "@/components/dashboard/charts"
import {
  computeFinance,
  COMMERCIAL_RATE,
  BUILD_INFLATION_PCT,
  RATE_RISK_PCT,
} from "@/lib/finance-model"
import {
  fmtCzk,
  fmtCzkShort,
  type Project,
  type Scenario,
  type ScenarioTone,
} from "@/lib/mock-data"
import { userProjects, userScenarios } from "@/lib/scenarios"
import {
  projectAnnualSavings,
  buildSavingsGeometry,
  type SavingsGeometry,
} from "./return"

const START_YEAR = 2026
const HORIZONS = [10, 15, 20, 30]
const TERM_OPTIONS = [5, 7, 10, 13, 15]
const SAMPLES = 6

// Barvy scénářů — bez rekonstrukce: červená, s rekonstrukcí: modrá (primary).
const WITHOUT_COLOR = "var(--color-red-500, #ef4444)"
const WITH_COLOR = "var(--color-blue-500, #3b82f6)"

// Barvy zdrojů financování — kapitál (neutrální), NZÚ (emerald), komerční (amber).
const KAPITAL_COLOR = "var(--color-zinc-400, #a1a1aa)"
const NZU_COLOR = "var(--color-emerald-500, #10b981)"
const KOMERCNI_COLOR = "var(--color-amber-500, #f59e0b)"

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
  units: number | null
  zastavena_plocha: number | null
  floors: number | null
  zakladni_kapital: number | null
  rent_years: number | null
}

function scaleProjectsToBuilding(
  baseProjects: Project[],
  costsByProject: Record<string, number> | null,
  geometry: SavingsGeometry | null
): Project[] {
  return baseProjects.map((p) => {
    // Roční úspora z fyzikálních formulí (return.ts). null = projekt bez vzorce.
    const formulaSavings = geometry ? projectAnnualSavings(p.id, geometry) : null
    const projectCost = costsByProject?.[p.id]

    // Bez nákladů z kalkulace ponecháme základní rozpočet,
    // jen případně přepíšeme úsporu spočtenou z formulí.
    if (!projectCost || projectCost <= 0) {
      return formulaSavings != null
        ? { ...p, savingsPerYear: Math.round(formulaSavings) }
        : p
    }

    const sf = projectCost / p.budget
    return {
      ...p,
      budget: projectCost,
      spent: 0,
      savingsPerYear:
        formulaSavings != null
          ? Math.round(formulaSavings)
          : Math.round(p.savingsPerYear * sf),
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
function AnimatedCzk({
  value,
  className,
}: {
  value: number
  className?: string
}) {
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
  const [termYears, setTermYears] = useState(10)
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
        .select(
          "selected_renovations, total_cost, selected_scenario, costs_by_project, units, zastavena_plocha, floors, zakladni_kapital, rent_years"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setBuildingData(data)
            if (data.rent_years && data.rent_years > 0)
              setTermYears(data.rent_years)
          }
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

  // Geometrie domu z RÚIAN dat — vstup pro fyzikální formule úspor (return.ts).
  const geometry = useMemo<SavingsGeometry | null>(
    () =>
      buildSavingsGeometry(
        buildingData?.zastavena_plocha,
        buildingData?.floors,
        buildingData?.units
      ),
    [buildingData]
  )

  // Pouze projekty, které uživatel vybral, naškálované jeho náklady.
  // Roční úspora se počítá z formulí v return.ts (fallback: škálovaný mock).
  const scaledProjects = useMemo(
    () =>
      scaleProjectsToBuilding(
        userProjects(selectedRenovations),
        buildingData?.costs_by_project ?? null,
        geometry
      ),
    [selectedRenovations, buildingData, geometry]
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
    const savingsPerYear = selected.reduce(
      (sum, p) => sum + p.savingsPerYear,
      0
    )
    const fundIncreasePerFlat = selected.reduce(
      (sum, p) => sum + p.fundIncreasePerFlat,
      0
    )
    const annualCost = selected.reduce(
      (sum, p) => sum + p.baseline.annualCost,
      0
    )
    // Růst nákladů vážený podle jejich výše.
    const growth =
      selected.reduce(
        (sum, p) => sum + p.baseline.costGrowthPct * p.baseline.annualCost,
        0
      ) /
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

    const annualSeries = {
      without: sample(annualWithout),
      with: sample(annualWith),
    }
    const cumSeries = { without: sample(cumWithout), with: sample(cumWith) }
    // Bod zlomu počítaný z vykreslených (vzorkovaných) křivek — značka v grafu
    // tak sedí přesně na jejich průsečíku.
    const breakEvenPos = seriesCrossing(cumSeries.with, cumSeries.without)
    // Rok bodu zlomu z plných ročních křivek (rozlišení na rok) — nezávislý
    // na vzorkování, takže sedí s Přehledem. breakEvenPos zůstává pro značku v grafu.
    const breakEvenYearIndex = crossingYearIndex(cumWith, cumWithout)

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
      breakEvenYearIndex,
      lossAtHorizon,
      annualSeries,
      cumSeries,
      costBreakdown,
      costItems,
    }
  }, [selected, single, horizon])

  // Orientační finanční model — rozdělení zdrojů, splátky, úspora NZÚ a FOMO čísla.
  const hasUnits = (buildingData?.units ?? 0) > 0
  const fin = useMemo(
    () =>
      computeFinance({
        budget: agg.budget,
        units: buildingData?.units ?? 0,
        savingsPerYear: agg.savingsPerYear,
        termYears,
        zakladniKapital: buildingData?.zakladni_kapital ?? 0,
      }),
    [
      agg.budget,
      agg.savingsPerYear,
      buildingData?.units,
      buildingData?.zakladni_kapital,
      termYears,
    ]
  )
  // Doba splácení dle ceny renovace — stejné pravidlo jako v onboardingu:
  // do 1,5 mil. Kč max 10 let, nad 1,5 mil. Kč max 15 let.
  const maxTerm = agg.budget >= 1_500_000 ? 15 : 10
  const terms = TERM_OPTIONS.filter((y) => y <= maxTerm)
  useEffect(() => {
    if (termYears > maxTerm) setTermYears(maxTerm)
  }, [maxTerm, termYears])
  // Popisek jednotky u měsíčních částek — na byt, jen když známe počet bytů.
  const perLabel = hasUnits ? "/ byt / měsíc" : "/ měsíc"

  const savingsPct = Math.round((agg.savingsPerYear / agg.annualCost) * 100)
  const afterBarPct = Math.round(
    (agg.annualWithNow / agg.annualWithoutNow) * 100
  )
  const profitable = agg.lossAtHorizon > 0
  const scopeLabel = activeScenario
    ? activeScenario.name
    : single
      ? single.name
      : "Vlastní výběr"
  const breakEvenYearNum =
    agg.breakEvenYearIndex !== null
      ? Math.round(START_YEAR + agg.breakEvenYearIndex)
      : null
  const breakEvenLabel =
    breakEvenYearNum !== null
      ? String(breakEvenYearNum)
      : `za horizontem ${horizon} let`

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
      value:
        breakEvenYearNum !== null
          ? String(breakEvenYearNum)
          : `> ${horizon} let`,
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
  if (
    !loaded ||
    (loaded && buildingData === null && scaledProjects.length === 0)
  ) {
    return (
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* Ambient blobs (hidden during loading) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-red-500/8 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 -right-40 -z-10 size-96 rounded-full bg-blue-500/8 blur-[120px]"
        />

        {/* Hero skeleton */}
        <div className="relative isolate overflow-hidden rounded-[2rem] rounded-br-[5rem] bg-zinc-950">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12">
            {/* Left section skeleton */}
            <div>
              <div className="mb-2 h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="mb-4 h-8 w-32 animate-pulse rounded bg-muted" />
              <div className="mb-6 h-3 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-7 space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-12 w-40 animate-pulse rounded bg-muted" />
                <div className="h-2 w-56 animate-pulse rounded bg-muted" />
              </div>
            </div>

            {/* Right section skeleton */}
            <div className="flex flex-col gap-4 rounded-2xl bg-muted/30 p-5">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="space-y-3">
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
              </div>
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Controls skeleton */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-8 w-56 animate-pulse rounded bg-muted" />
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-96 animate-pulse rounded bg-muted" />
        </div>

        {/* KPI skeleton */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border bg-background/60 p-5 backdrop-blur-sm sm:p-6 lg:grid-cols-4 lg:gap-x-0 lg:gap-y-0 lg:divide-x lg:divide-border/60">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-2 lg:px-6 lg:first:pl-0 lg:last:pr-0"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="flex flex-col gap-3">
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          <div className="grid gap-3 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
              >
                <div className="mb-2 h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="mb-4 h-2.5 w-48 animate-pulse rounded bg-muted" />
                <div className="h-32 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Budget skeleton */}
        <div className="flex flex-col gap-3">
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
              <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mb-4 h-2.5 w-40 animate-pulse rounded bg-muted" />
              <div className="mb-3 h-10 w-20 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
              <div className="mt-4 h-2 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
              <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mb-4 h-2.5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-40 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="overflow-hidden rounded-2xl border bg-background/60 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-5 py-3.5">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-1 p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded bg-muted"
                />
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
        className="pointer-events-none absolute top-1/4 -right-40 -z-10 size-96 rounded-full bg-blue-500/8 blur-[120px]"
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
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Finance
            </h1>
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
              <span className="text-xs font-medium text-white/70">
                Roční náklady domu
              </span>
              <span className="rounded-md bg-blue-400/15 px-1.5 py-0.5 text-xs font-medium text-blue-300 tabular-nums">
                −{savingsPct.toLocaleString("cs-CZ")} %
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-[11px] text-white/50">
                  Dnes
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-white/35" />
                </div>
                <span className="w-20 shrink-0 text-right text-xs text-white/70 tabular-nums">
                  {fmtCzkShort(agg.annualWithoutNow)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-[11px] text-white/50">
                  Potom
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-[width] duration-700 ease-out"
                    style={{ width: `${afterBarPct}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-medium text-blue-300 tabular-nums">
                  {fmtCzkShort(agg.annualWithNow)}
                </span>
              </div>
            </div>
            <p className="text-xs text-pretty text-white/60">
              Úspora{" "}
              <span className="font-semibold text-blue-300 tabular-nums">
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
        style={
          {
            "--ai-y": "32px",
            "--ai-dur": "0.7s",
            "--ai-delay": "0.1s",
          } as React.CSSProperties
        }
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
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      TONE_DOT[s.tone]
                    )}
                  />
                  {s.name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
                      "rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-all",
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

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Splácení
              </span>
              <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
                {terms.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTermYears(t)}
                    aria-pressed={t === termYears}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium tabular-nums transition-all",
                      t === termYears
                        ? "bg-background text-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t} let
                  </button>
                ))}
              </div>
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
                  {selected.length}{" "}
                  {selected.length === 1 ? "projekt" : "projektů"} ve vašem
                  plánu
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
        style={
          {
            "--ai-y": "32px",
            "--ai-dur": "0.7s",
            "--ai-delay": "0.2s",
          } as React.CSSProperties
        }
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col gap-1 lg:px-6 lg:first:pl-0 lg:last:pr-0"
          >
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <kpi.icon className="size-3.5 shrink-0 text-primary" />
              {kpi.label}
            </dt>
            <dd
              className={cn(
                "text-xl font-semibold tabular-nums sm:text-2xl",
                kpi.accent
              )}
            >
              {kpi.value}
            </dd>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </dl>

      {/* ================================================================== */}
      {/* SEKCE 1 — Financování: koláč zdrojů + rozpad + položky rozpočtu      */}
      {/* ================================================================== */}
      <div
        className="anim-in flex flex-col gap-3"
        style={
          {
            "--ai-y": "40px",
            "--ai-dur": "0.7s",
            "--ai-delay": "0.3s",
          } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Financování — {scopeLabel}
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
          {/* Z čeho pokryjeme investici — koláčový graf tří zdrojů */}
          <div
            data-fin-block
            className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
          >
            <p className="text-sm font-medium">Jak to zaplatíme</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Z čeho pokryjeme investici {fmtCzkShort(agg.budget)}
            </p>
            <div className="mt-4">
              <FinancingDonut
                segments={[
                  {
                    key: "kapital",
                    label: "Základní kapitál",
                    value: fin.split.kapital,
                    color: KAPITAL_COLOR,
                  },
                  {
                    key: "nzu",
                    label: "NZÚ — 0% úvěr",
                    value: fin.split.nzu,
                    color: NZU_COLOR,
                  },
                  {
                    key: "komercni",
                    label: "Komerční úvěr 5 %",
                    value: fin.split.komercni,
                    color: KOMERCNI_COLOR,
                  },
                ].filter((s) => s.value > 0)}
                total={fin.split.budget}
                formatValue={fmtCzkShort}
                centerLabel="celková investice"
              />
            </div>
          </div>

          {/* Rozpad nákladů */}

          <div
            className="anim-in flex flex-col gap-3"
            style={
              {
                "--ai-y": "40px",
                "--ai-dur": "0.7s",
                "--ai-delay": "0.4s",
              } as React.CSSProperties
            }
          >
            <div
              data-fin-block
              className="h-full rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur-sm sm:p-5"
            >
              <p className="text-sm text-muted-foreground">NZÚ vám ušetří</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600 tabular-nums sm:text-4xl dark:text-emerald-400">
                <AnimatedCzk value={fin.nzuSavings.totalSaved} />
              </p>
              <p className="mt-2 text-xs text-pretty text-muted-foreground">
                na úrocích — bezúročný úvěr na dotovanou část{" "}
                {fmtCzkShort(fin.split.nzu)} místo{" "}
                {(COMMERCIAL_RATE * 100).toLocaleString("cs-CZ", {
                  maximumFractionDigits: 1,
                })}{" "}
                % p.a. po dobu {termYears} let.
              </p>

              {fin.nzuSavings.totalSaved <= 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  V tomto rozsahu se NZÚ úvěr neuplatní.
                </p>
              ) : (
                <div className="mt-5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-muted-foreground">
                      Komerční úvěr 5 %
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-full rounded-full bg-amber-500" />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums">
                      {fmtCzkShort(fin.nzuSavings.commercialTotalIfNoNzu)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-muted-foreground">
                      NZÚ 0 %
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out"
                        style={{
                          width: `${
                            fin.nzuSavings.commercialTotalIfNoNzu > 0
                              ? (fin.nzuSavings.nzuTotalPaid /
                                  fin.nzuSavings.commercialTotalIfNoNzu) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                      {fmtCzkShort(fin.nzuSavings.nzuTotalPaid)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SEKCE 3 — Měsíční dopad + grafy návratnosti                          */}
      {/* ================================================================== */}
      <div
        className="anim-in flex flex-col gap-3"
        style={
          {
            "--ai-y": "40px",
            "--ai-dur": "0.7s",
            "--ai-delay": "0.5s",
          } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Měsíčně víc teď, brzy ale vyděláváte
          </p>
        </div>

        {/* Tři malé statistiky — splátka, úspora, čistý dopad */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div
            data-fin-block
            className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
          >
            <p className="text-xs text-muted-foreground">Splátka úvěru</p>
            <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
              {fmtCzk(fin.repayment.monthlyPerUnit)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{perLabel}</p>
          </div>
          <div
            data-fin-block
            className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
          >
            <p className="text-xs text-muted-foreground">Úspora na energiích</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600 tabular-nums sm:text-2xl dark:text-emerald-400">
              {fmtCzk(fin.repayment.energySavingMonthlyPerUnit)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{perLabel}</p>
          </div>
          <div
            data-fin-block
            className="col-span-2 rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5 lg:col-span-1"
          >
            <p className="text-xs text-muted-foreground">Čistý dopad</p>
            {fin.repayment.netMonthlyPerUnit > 0 ? (
              <>
                <p className="mt-1 text-xl font-semibold text-amber-600 tabular-nums sm:text-2xl dark:text-amber-400">
                  +{fmtCzk(fin.repayment.netMonthlyPerUnit)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  víc {perLabel} během splácení
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-xl font-semibold text-emerald-600 tabular-nums sm:text-2xl dark:text-emerald-400">
                  −{fmtCzk(Math.abs(fin.repayment.netMonthlyPerUnit))}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  už teď v plusu {perLabel}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Krátké shrnutí pod statistikami */}
        <p className="text-sm text-muted-foreground">
          Po splacení (za {termYears} let) zůstává domu celá úspora{" "}
          {fmtCzkShort(agg.savingsPerYear)} ročně.
          {breakEvenYearNum !== null && (
            <> Investice se vrací od roku {breakEvenYearNum}.</>
          )}
        </p>

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
                <p className="mt-0.5 font-semibold text-red-600 tabular-nums dark:text-red-400">
                  {fmtCzkShort(agg.cumWithoutEnd)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-blue-500" />S
                  rekonstrukcí
                </p>
                <p className="mt-0.5 font-semibold text-blue-600 tabular-nums dark:text-blue-400">
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
                    ? {
                        position: agg.breakEvenPos,
                        label: `Bod zlomu ${breakEvenLabel}`,
                      }
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
              Bez rekonstrukce rostou s cenami energií — úspora se každý rok
              zvětšuje
            </p>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-red-500" />
                  Za {horizon} let bez akce
                </p>
                <p className="mt-0.5 font-semibold text-red-600 tabular-nums dark:text-red-400">
                  {fmtCzkShort(agg.annualWithoutEnd)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-blue-500" />
                  Po rekonstrukci
                </p>
                <p className="mt-0.5 font-semibold text-blue-600 tabular-nums dark:text-blue-400">
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

      {/* ================================================================== */}
      {/* SEKCE 4 — Proč jednat teď: FOMO karty                                */}
      {/* ================================================================== */}
      <div
        className="anim-in flex flex-col gap-3"
        style={
          {
            "--ai-y": "40px",
            "--ai-dur": "0.7s",
            "--ai-delay": "0.6s",
          } as React.CSSProperties
        }
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Proč jednat teď
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Inflace */}
          <div
            data-fin-block
            className="flex flex-col gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur-sm sm:p-5"
          >
            <TrendingUp className="size-4 text-amber-600 dark:text-amber-400" />
            <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
              +{fmtCzkShort(fin.fomo.inflationCostPerYear)}
            </p>
            <p className="text-sm font-semibold">Inflace</p>
            <p className="text-xs text-pretty text-muted-foreground">
              Stejná rekonstrukce zdražuje ~{BUILD_INFLATION_PCT} % ročně. Za 2
              roky o {fmtCzkShort(fin.fomo.inflationCostIn2Years)} víc.
            </p>
          </div>

          {/* Dotace NZÚ */}
          <div
            data-fin-block
            className="flex flex-col gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur-sm sm:p-5"
          >
            <Hourglass className="size-4 text-amber-600 dark:text-amber-400" />
            <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
              0% úvěr
            </p>
            <p className="text-sm font-semibold">Dotace NZÚ</p>
            <p className="text-xs text-pretty text-muted-foreground">
              Program je časově omezený a vyčerpatelný. Bezúročný úvěr je
              dostupný teď.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
