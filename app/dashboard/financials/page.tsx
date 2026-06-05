"use client"

import { useMemo, useState } from "react"
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CalendarClock,
  Layers,
  CircleCheck,
  Scale,
  TriangleAlert,
  Star,
  Hammer,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BreakdownBars,
  ComparisonLineChart,
  DonutChart,
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
    { icon: Wallet, label: "Investice", value: fmtCzkShort(agg.budget), accent: null },
    {
      icon: TrendingDown,
      label: "Roční úspora",
      value: fmtCzkShort(agg.savingsPerYear),
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: CalendarClock,
      label: "Bod zlomu",
      value: breakEvenYearNum !== null ? String(breakEvenYearNum) : `> ${horizon} let`,
      accent: null,
    },
    {
      icon: TriangleAlert,
      label: "Ztráta bez akce",
      value: fmtCzkShort(Math.abs(agg.lossAtHorizon)),
      accent:
        agg.lossAtHorizon > 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-emerald-600 dark:text-emerald-400",
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

      {/* Header */}
      <div
        className="anim-in flex flex-col"
        style={{ "--ai-y": "-20px", "--ai-dur": "0.6s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-7 bg-emerald-500/60" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
            Dva scénáře, jedno rozhodnutí
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Finance</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Rekonstrukce vs. nečinnost — kolik vás stojí každá cesta.
        </p>
      </div>

      {/* Výběr scénáře — hlavní ovládací prvek */}
      <div
        className="anim-in flex flex-col gap-3"
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.15s" } as React.CSSProperties}
      >
        <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Vyberte scénář
        </span>
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Horizon + KPIs */}
      <div
        className="anim-in flex flex-col gap-3"
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.25s" } as React.CSSProperties}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Porovnání scénářů — {scopeLabel}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full border bg-background/60 p-0.5 backdrop-blur-sm">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors tabular-nums",
                  h === horizon
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {h} let
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border bg-muted/40 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <kpi.icon className="size-3.5 shrink-0 text-primary" />
                {kpi.label}
              </div>
              <p className={cn("mt-1 text-lg font-semibold tabular-nums", kpi.accent)}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario side-by-side */}
      <div
        className="anim-in relative grid grid-cols-1 gap-3 lg:grid-cols-2"
        style={{ "--ai-y": "40px", "--ai-dur": "0.7s", "--ai-delay": "0.35s" } as React.CSSProperties}
      >
        {/* VS odznak mezi kartami (jen desktop) */}
        <span className="absolute left-1/2 top-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-[11px] font-bold text-muted-foreground shadow-sm lg:flex">
          VS
        </span>

        {/* Scénář A — bez rekonstrukce */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/60 via-background to-background transition-shadow hover:shadow-xl dark:border-rose-500/20 dark:from-rose-950/25 dark:via-background dark:to-background lg:rounded-bl-[3rem]">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 to-rose-500/60" />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 ring-1 ring-rose-500/20">
                <TrendingUp className="size-5 text-rose-600 dark:text-rose-400" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-rose-500 uppercase dark:text-rose-400">
                  Scénář A
                </p>
                <p className="text-base font-bold leading-tight">Bez rekonstrukce</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs text-muted-foreground">Celkem za {horizon} let</p>
              <p className="mt-0.5 text-3xl font-bold tabular-nums text-rose-600 dark:text-rose-400 sm:text-4xl">
                {fmtCzkShort(agg.cumWithoutEnd)}
              </p>
            </div>

            <div className="mt-5 divide-y divide-rose-100/80 border-t border-rose-100/80 text-sm dark:divide-rose-500/10 dark:border-rose-500/10">
              <div className="flex items-baseline justify-between gap-2 py-2.5">
                <span className="text-muted-foreground">Roční náklady dnes</span>
                <span className="font-semibold tabular-nums">{fmtCzkShort(agg.annualWithoutNow)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2 py-2.5">
                <span className="text-muted-foreground">Roční náklady za {horizon} let</span>
                <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">{fmtCzkShort(agg.annualWithoutEnd)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scénář B — s rekonstrukcí */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 via-background to-background transition-shadow hover:shadow-xl dark:border-emerald-500/20 dark:from-emerald-950/25 dark:via-background dark:to-background lg:rounded-br-[3rem]">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500/60" />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 ring-1 ring-emerald-500/20">
                <Hammer className="size-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
                  Scénář B
                </p>
                <p className="text-base font-bold leading-tight">S rekonstrukcí</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs text-muted-foreground">Celkem vč. investice za {horizon} let</p>
              <p className="mt-0.5 text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-4xl">
                {fmtCzkShort(agg.cumWithEnd)}
              </p>
            </div>

            <div className="mt-5 divide-y divide-emerald-100/80 border-t border-emerald-100/80 text-sm dark:divide-emerald-500/10 dark:border-emerald-500/10">
              <div className="flex items-baseline justify-between gap-2 py-2.5">
                <span className="text-muted-foreground">Jednorázová investice</span>
                <span className="font-semibold tabular-nums">{fmtCzkShort(agg.budget)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2 py-2.5">
                <span className="text-muted-foreground">Roční náklady po rekonstrukci</span>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{fmtCzkShort(agg.annualWithNow)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delta callout */}
      <div
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.45s" } as React.CSSProperties}
        className={cn(
          "anim-in flex items-center gap-3 rounded-2xl border px-4 py-3",
          agg.lossAtHorizon > 0
            ? "border-rose-500/30 bg-rose-500/5"
            : "border-emerald-500/30 bg-emerald-500/5"
        )}
      >
        <Scale
          className={cn(
            "size-5 shrink-0",
            agg.lossAtHorizon > 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          )}
        />
        <p className="text-sm">
          {agg.lossAtHorizon > 0 ? (
            <>
              Nečinnost vyjde za {horizon} let o{" "}
              <span className="font-semibold text-rose-600 tabular-nums dark:text-rose-400">
                {fmtCzkShort(agg.lossAtHorizon)}
              </span>{" "}
              dráž.
            </>
          ) : (
            <>
              Investice se za {horizon} let ještě nevrátí — chybí{" "}
              <span className="font-semibold tabular-nums">
                {fmtCzkShort(Math.abs(agg.lossAtHorizon))}
              </span>
              . Zkuste delší horizont.
            </>
          )}
        </p>
      </div>

      {/* Comparison charts */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div data-fin-block className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-sm font-medium">Roční náklady</p>
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

        <div data-fin-block className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-sm font-medium">Kumulativní náklady vč. investice</p>
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
      </div>

      {/* Budget detail */}
      <div data-fin-block className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-sm font-medium">Čerpání rozpočtu</p>
          <div className="mt-4">
            <DonutChart percent={spentPct} label="rozpočtu vyčerpáno" />
          </div>
          <div className="mt-4 flex flex-col gap-1 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            <span>
              Vyčerpáno{" "}
              <span className="font-medium text-foreground tabular-nums">{fmtCzk(agg.spent)}</span> z{" "}
              <span className="font-medium text-foreground tabular-nums">{fmtCzk(agg.budget)}</span>
            </span>
            <span>
              Navýšení fondu oprav:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {fmtCzk(agg.fundIncreasePerFlat)} / byt / měsíc
              </span>
              {!single && <span className="ml-1">(součet za vybrané scénáře)</span>}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-sm font-medium">Rozpad nákladů</p>
          <div className="mt-4">
            <BreakdownBars data={agg.costBreakdown} formatValue={fmtCzkShort} />
          </div>
        </div>
      </div>

      {/* Cost items table */}
      <div data-fin-block>
        <div className="mb-3 flex items-center gap-2.5">
          <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Položky rozpočtu — {scopeLabel}
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Položka</th>
                {!single && <th className="px-4 py-2.5 font-medium">Scénář</th>}
                <th className="px-4 py-2.5 font-medium">Dodavatel</th>
                <th className="px-4 py-2.5 text-right font-medium">Částka</th>
                <th className="px-4 py-2.5 text-right font-medium">Podíl</th>
              </tr>
            </thead>
            <tbody>
              {agg.costItems.map((row) => (
                <tr
                  key={`${row.project}-${row.item}`}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-2.5 font-medium">{row.item}</td>
                  {!single && (
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {row.project}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-muted-foreground">{row.supplier}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtCzk(row.amount)}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                    {row.share.toLocaleString("cs-CZ")} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
