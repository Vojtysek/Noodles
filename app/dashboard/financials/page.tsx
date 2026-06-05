"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import {
  Wallet,
  TrendingDown,
  CalendarClock,
  HandCoins,
  Layers,
  CircleCheck,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BreakdownBars,
  ComparisonLineChart,
  seriesCrossing,
} from "@/components/dashboard/charts"
import {
  projects,
  projectsByPriority,
  scenarios,
  fmtCzk,
  fmtCzkShort,
  type ProjectId,
  type Scenario,
  type ScenarioTone,
} from "@/lib/mock-data"

const START_YEAR = 2026
const HORIZONS = [10, 15, 20, 30]
const SAMPLES = 6

// Barvy scénářů — stejné sémantické odstíny jako u postojů rezidentů.
const WITHOUT_COLOR = "var(--color-rose-500, #f43f5e)"
const WITH_COLOR = "var(--color-emerald-500, #10b981)"

// Tečka scénáře — stejné mapování jako na stránce Přehled.
const TONE_DOT: Record<ScenarioTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
}

const DEFAULT_SCENARIO_ID = "nejnutnejsi"

/** Porovná dvě množiny ID projektů bez ohledu na pořadí. */
function sameIdSet(a: readonly ProjectId[], b: readonly ProjectId[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((id) => set.has(id))
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
  // Hlavní ovládání: předpřipravené scénáře (levný → drahý). Mix & match zůstává
  // jako skrytá pokročilá možnost. Výchozí scénář: rozumný kompromis.
  const defaultScenario =
    scenarios.find((s) => s.id === DEFAULT_SCENARIO_ID) ?? scenarios[0]
  const [selectedIds, setSelectedIds] = useState<ProjectId[]>(defaultScenario.projectIds)
  const [horizon, setHorizon] = useState(15)
  const [mixOpen, setMixOpen] = useState(false)

  const allSelected = selectedIds.length === projects.length

  // Aktivní scénář — pokud vybraná množina projektů odpovídá některému scénáři.
  const activeScenario: Scenario | null =
    scenarios.find((s) => sameIdSet(s.projectIds, selectedIds)) ?? null

  function selectScenario(s: Scenario) {
    setSelectedIds(s.projectIds)
  }

  function toggleProject(id: ProjectId) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // Alespoň jeden projekt musí zůstat vybraný.
        return prev.length > 1 ? prev.filter((p) => p !== id) : prev
      }
      return [...prev, id]
    })
  }

  const selected = projectsByPriority.filter((p) => selectedIds.includes(p.id))
  const single = selected.length === 1 ? selected[0] : null

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

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-rose-500/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/4 -z-10 size-96 rounded-full bg-emerald-500/8 blur-[120px]"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Hero — verdikt na první pohled (tmavý pruh jako na Přehledu)        */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="anim-in relative isolate overflow-hidden rounded-[2rem] rounded-br-[5rem] bg-zinc-950 text-white"
        style={{ "--ai-y": "-20px", "--ai-dur": "0.6s" } as React.CSSProperties}
      >
        {/* Barevné záře — rose (nečinnost) vlevo, emerald (rekonstrukce) vpravo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-rose-500/15 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-28 -z-10 size-96 rounded-full bg-emerald-500/20 blur-[110px]"
        />

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12">
          {/* Levá část — titulek + hlavní číslo */}
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="h-px w-7 bg-emerald-300/70" />
              <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-300 uppercase">
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
                  profitable ? "text-emerald-300" : "text-amber-300"
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
              <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-xs font-medium tabular-nums text-emerald-300">
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
                    className="h-full rounded-full bg-emerald-400 transition-[width] duration-700 ease-out"
                    style={{ width: `${afterBarPct}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums text-emerald-300">
                  {fmtCzkShort(agg.annualWithNow)}
                </span>
              </div>
            </div>
            <p className="text-xs text-pretty text-white/60">
              Úspora{" "}
              <span className="font-semibold tabular-nums text-emerald-300">
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
              {scenarios.map((s) => {
                const active = activeScenario?.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => selectScenario(s)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "bg-background text-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[s.tone])} />
                    {s.name}
                  </button>
                )
              })}
            </div>
            {!activeScenario && (
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
                <span className="size-2 shrink-0 rounded-full bg-muted-foreground/50" />
                Vlastní výběr
              </span>
            )}
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

        {/* Tagline + rozpočet aktivního scénáře */}
        <p className="text-xs text-muted-foreground">
          {activeScenario ? (
            <>
              {activeScenario.tagline}{" "}
              <span className="font-medium text-foreground tabular-nums">
                Celkem {fmtCzkShort(agg.budget)}.
              </span>
            </>
          ) : (
            <>
              Vlastní kombinace {selected.length} z {projects.length} projektů.{" "}
              <span className="font-medium text-foreground tabular-nums">
                Celkem {fmtCzkShort(agg.budget)}.
              </span>
            </>
          )}
        </p>

        {/* Pokročilé: ruční mix & match */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setMixOpen((v) => !v)}
            aria-expanded={mixOpen}
            className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Upravit výběr projektů
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
                  {selected.length} z {projects.length} vybráno
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelectedIds(projects.map((p) => p.id))}
                  disabled={allSelected}
                >
                  <Layers />
                  Vybrat vše
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {projectsByPriority.map((p) => {
                  const active = selectedIds.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProject(p.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition-all duration-200",
                        active
                          ? "scale-[1.02] border-primary/60 bg-primary/5 shadow-lg ring-3 ring-primary/15"
                          : "bg-background/60 hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-lg"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {p.priority === 1 && (
                            <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                          )}
                          <p
                            className={cn(
                              "text-sm font-medium",
                              !active && "text-muted-foreground"
                            )}
                          >
                            {p.shortName}
                          </p>
                        </div>
                        {active ? (
                          <CircleCheck className="size-4 shrink-0 text-primary" />
                        ) : (
                          <span className="size-4 shrink-0 rounded-full border-2 border-border" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {fmtCzkShort(p.budget)}
                      </p>
                    </button>
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
              className="pointer-events-none absolute top-3 right-4 size-16 text-emerald-500/30"
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
                  <span className="size-2 shrink-0 rounded-full bg-rose-500" />
                  Bez rekonstrukce
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                  {fmtCzkShort(agg.cumWithoutEnd)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                  S rekonstrukcí
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
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
                  <span className="size-2 shrink-0 rounded-full bg-rose-500" />
                  Za {horizon} let bez akce
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                  {fmtCzkShort(agg.annualWithoutEnd)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                  Po rekonstrukci
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
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
