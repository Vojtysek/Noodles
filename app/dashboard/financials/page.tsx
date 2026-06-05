"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Wallet,
  TrendingDown,
  CalendarClock,
  Layers,
  CircleCheck,
  Scale,
  TriangleAlert,
  Star,
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
  fmtCzk,
  fmtCzkShort,
  type ProjectId,
} from "@/lib/mock-data"

const STATUS_LABELS: Record<string, string> = {
  navrh: "Návrh",
  schvalovani: "Schvalování",
  realizace: "Realizace",
}

const START_YEAR = 2026
const HORIZONS = [10, 15, 20, 30]
const SAMPLES = 6

// Barvy scénářů — stejné sémantické odstíny jako u postojů rezidentů.
const WITHOUT_COLOR = "var(--color-rose-500, #f43f5e)"
const WITH_COLOR = "var(--color-emerald-500, #10b981)"

export default function FinancialsPage() {
  // Mix & match — lze vybrat libovolnou kombinaci projektů, nebo všechny najednou.
  // Výchozí výběr: projekt s nejvyšší prioritou (největší dopad).
  const [selectedIds, setSelectedIds] = useState<ProjectId[]>([projectsByPriority[0].id])
  const [horizon, setHorizon] = useState(15)

  const allSelected = selectedIds.length === projects.length

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
  const scopeLabel = single
    ? single.name
    : allSelected
      ? "Všechny projekty"
      : selected.map((p) => p.shortName).join(" + ")
  const breakEvenYearNum =
    agg.breakEvenPos !== null ? Math.round(START_YEAR + agg.breakEvenPos * horizon) : null
  const breakEvenLabel =
    breakEvenYearNum !== null ? String(breakEvenYearNum) : `za horizontem ${horizon} let`

  const kpis = [
    { icon: Wallet, label: "Investice", value: fmtCzkShort(agg.budget), accent: null },
    {
      icon: TrendingDown,
      label: "Roční úspora po rekonstrukci",
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
      label: `Ztráta bez rekonstrukce za ${horizon} let`,
      value: fmtCzkShort(Math.abs(agg.lossAtHorizon)),
      accent:
        agg.lossAtHorizon > 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-emerald-600 dark:text-emerald-400",
    },
  ]

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
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
        className="anim-in"
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
          Finanční modelace obou scénářů — rekonstrukce vs. nečinnost. Stačí přehled?{" "}
          <Link href="/dashboard/prehled" className="font-medium text-primary hover:underline">
            Zpět na Přehled
          </Link>
          .
        </p>
      </div>

      {/* Project mix & match */}
      <div
        className="anim-in flex flex-col gap-2.5"
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.15s" } as React.CSSProperties}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Projekty k porovnání
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {selected.length} z {projects.length} vybráno
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-600 rounded px-1.5 py-0.5 font-medium">data k doplnění</span>
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
                    : "hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-lg"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-sm font-medium", !active && "text-muted-foreground")}>
                    {p.shortName}
                  </p>
                  {active ? (
                    <CircleCheck className="size-4 shrink-0 text-primary" />
                  ) : (
                    <span className="size-4 shrink-0 rounded-full border-2 border-border" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {fmtCzkShort(p.budget)}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <span
                    className={cn(
                      "flex w-fit items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                      p.priority === 1
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {p.priority === 1 && <Star className="size-2.5 fill-current" />}
                    Priorita {p.priority}
                  </span>
                  <span
                    className={cn(
                      "w-fit rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                      active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
              </button>
            )
          })}
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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div
          className="anim-in relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-500/[0.02] p-4 transition-shadow hover:shadow-lg sm:p-5 lg:rounded-bl-[3rem]"
          style={{ "--ai-y": "40px", "--ai-dur": "0.7s", "--ai-delay": "0.45s" } as React.CSSProperties}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-rose-500/10 blur-[60px]"
          />
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-6 bg-rose-500/60" />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-rose-600 uppercase dark:text-rose-400">
              Scénář A
            </p>
          </div>
          <p className="mt-1.5 text-base font-semibold text-rose-600 dark:text-rose-400">
            Bez rekonstrukce
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Roční náklady dnes</span>
              <span className="font-medium tabular-nums">{fmtCzkShort(agg.annualWithoutNow)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Roční náklady za {horizon} let</span>
              <span className="font-medium tabular-nums">{fmtCzkShort(agg.annualWithoutEnd)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-rose-500/20 pt-2">
              <span className="text-muted-foreground">Celkem zaplatíte za {horizon} let</span>
              <span className="font-semibold text-rose-600 tabular-nums dark:text-rose-400">
                {fmtCzkShort(agg.cumWithoutEnd)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Náklady porostou ~{agg.growthPct.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} % ročně bez brzdné investice.
          </p>
        </div>

        <div
          className="anim-in relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02] p-4 transition-shadow hover:shadow-lg sm:p-5 lg:rounded-br-[3rem]"
          style={{ "--ai-y": "40px", "--ai-dur": "0.7s", "--ai-delay": "0.57s" } as React.CSSProperties}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -left-12 size-40 rounded-full bg-emerald-500/10 blur-[60px]"
          />
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-6 bg-emerald-500/60" />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
              Scénář B
            </p>
          </div>
          <p className="mt-1.5 text-base font-semibold text-emerald-600 dark:text-emerald-400">
            S rekonstrukcí
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Jednorázová investice</span>
              <span className="font-medium tabular-nums">{fmtCzkShort(agg.budget)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Roční náklady po rekonstrukci</span>
              <span className="font-medium tabular-nums">{fmtCzkShort(agg.annualWithNow)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-emerald-500/20 pt-2">
              <span className="text-muted-foreground">
                Celkem vč. investice za {horizon} let
              </span>
              <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                {fmtCzkShort(agg.cumWithEnd)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Bod zlomu: {breakEvenLabel}; roční úspora {fmtCzkShort(agg.savingsPerYear)} dál roste.
          </p>
        </div>
      </div>

      {/* Delta callout */}
      <div
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.35s" } as React.CSSProperties}
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
              Pokud se nezrekonstruuje, vyjde to za {horizon} let o{" "}
              <span className="font-semibold text-rose-600 tabular-nums dark:text-rose-400">
                {fmtCzkShort(agg.lossAtHorizon)}
              </span>{" "}
              dráž — a rozdíl se každým dalším rokem prohlubuje.
            </>
          ) : (
            <>
              Na horizontu {horizon} let se investice ještě nevrátí — chybí{" "}
              <span className="font-semibold tabular-nums">
                {fmtCzkShort(Math.abs(agg.lossAtHorizon))}
              </span>
              . Bod zlomu: {breakEvenLabel}. Zkuste delší horizont.
            </>
          )}
        </p>
      </div>

      {/* Comparison charts */}
      <div data-fin-block className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
        <p className="text-sm font-medium">Roční náklady v čase</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Roční výdaje obou scénářů v čase
        </p>
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
        <p className="text-sm font-medium">Kumulativní náklady včetně investice</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Kumulativní výdaje — kde se křivky protnou, investice se vrátila
        </p>
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

      {/* Budget detail */}
      <div data-fin-block className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-sm font-medium">Čerpání rozpočtu</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vyčerpáno {fmtCzk(agg.spent)} z {fmtCzk(agg.budget)}
          </p>
          <div className="mt-4">
            <DonutChart percent={spentPct} label="rozpočtu vyčerpáno" />
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            Navýšení fondu oprav:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {fmtCzk(agg.fundIncreasePerFlat)} / byt / měsíc
            </span>
            {!single && <span className="ml-1">(součet za vybrané projekty)</span>}
          </div>
        </div>

        <div className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
          <p className="text-sm font-medium">Rozpad nákladů</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {single ? "Hlavní položky rozpočtu" : "Rozpočty vybraných projektů"}
          </p>
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
                {!single && <th className="px-4 py-2.5 font-medium">Projekt</th>}
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
