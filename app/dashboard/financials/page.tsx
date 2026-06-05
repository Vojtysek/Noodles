"use client"

import { useMemo, useState } from "react"
import { Wallet, TrendingDown, CalendarClock, Zap, Layers, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { BreakdownBars, DonutChart, LineChart } from "@/components/dashboard/charts"
import { projects, fmtCzk, fmtCzkShort, type ProjectId } from "@/lib/mock-data"

const STATUS_LABELS: Record<string, string> = {
  navrh: "Návrh",
  schvalovani: "Schvalování",
  realizace: "Realizace",
}

export default function FinancialsPage() {
  // Mix & match — lze vybrat libovolnou kombinaci projektů, nebo všechny najednou.
  const [selectedIds, setSelectedIds] = useState<ProjectId[]>([projects[0].id])

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

  const selected = projects.filter((p) => selectedIds.includes(p.id))
  const single = selected.length === 1 ? selected[0] : null

  const agg = useMemo(() => {
    const budget = selected.reduce((sum, p) => sum + p.budget, 0)
    const spent = selected.reduce((sum, p) => sum + p.spent, 0)
    const savingsPerYear = selected.reduce((sum, p) => sum + p.savingsPerYear, 0)
    const fundIncreasePerFlat = selected.reduce((sum, p) => sum + p.fundIncreasePerFlat, 0)
    const energySavingPct = selected.reduce((sum, p) => sum + p.energySavingPct, 0)
    const paybackYears = savingsPerYear > 0 ? budget / savingsPerYear : 0

    // Rozpad: u jednoho projektu po položkách, u kombinace po projektech.
    const costBreakdown = single
      ? single.costBreakdown
      : selected.map((p) => ({ label: p.name, value: p.budget }))

    // Kumulativní bilance: u jednoho projektu autorská data, u kombinace dopočet.
    const cashflow = single
      ? single.cashflow
      : Array.from({ length: 7 }, (_, i) => {
          const offset = Math.ceil((paybackYears + 2) / 6) * i
          return { year: String(2026 + offset), value: -budget + savingsPerYear * offset }
        })

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
      energySavingPct,
      paybackYears,
      costBreakdown,
      cashflow,
      costItems,
    }
  }, [selected, single])

  const spentPct = Math.round((agg.spent / agg.budget) * 100)
  const scopeLabel = single ? single.name : allSelected ? "Všechny projekty" : selected.map((p) => p.shortName).join(" + ")

  const kpis = [
    { icon: Wallet, label: "Celkový rozpočet", value: fmtCzkShort(agg.budget) },
    { icon: TrendingDown, label: "Roční úspora", value: fmtCzkShort(agg.savingsPerYear) },
    {
      icon: CalendarClock,
      label: "Návratnost",
      value: `${agg.paybackYears.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} let`,
    },
    { icon: Zap, label: "Úspora energií", value: `${agg.energySavingPct} %` },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Financials</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Finanční rozpad projektů rekonstrukce. Kombinujte libovolné projekty, nebo zobrazte vše
          najednou.
        </p>
      </div>

      {/* Project mix & match */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedIds(projects.map((p) => p.id))}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
            allSelected
              ? "border-primary/50 bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Layers className="size-3.5" />
          Vše
        </button>
        <div className="h-5 w-px bg-border" />
        {projects.map((p) => {
          const active = selectedIds.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggleProject(p.id)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                active
                  ? "border-primary/50 bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {active && <Check className="size-3.5" />}
              {p.shortName}
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                  active ? "bg-primary/10" : "bg-muted"
                )}
              >
                {STATUS_LABELS[p.status]}
              </span>
            </button>
          )
        })}
        <p className="ml-auto text-xs text-muted-foreground">
          Zobrazeno: <span className="font-medium text-foreground">{scopeLabel}</span>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <kpi.icon className="size-3.5 text-primary" />
              {kpi.label}
            </div>
            <p className="mt-1 text-lg font-semibold tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Budget usage + breakdown */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Čerpání rozpočtu</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vyčerpáno {fmtCzk(agg.spent)} z {fmtCzk(agg.budget)}
          </p>
          <div className="mt-4">
            <DonutChart percent={spentPct} label="rozpočtu vyčerpáno" />
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            Navýšení fondu oprav:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {fmtCzk(agg.fundIncreasePerFlat)} / byt / měsíc
            </span>
            {!single && <span className="ml-1">(součet za vybrané projekty)</span>}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Rozpad nákladů</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {single ? "Hlavní položky rozpočtu" : "Rozpočty vybraných projektů"}
          </p>
          <div className="mt-4">
            <BreakdownBars data={agg.costBreakdown} formatValue={fmtCzkShort} />
          </div>
        </div>
      </div>

      {/* Payback prediction */}
      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">Predikce návratnosti</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Kumulativní bilance investice při roční úspoře {fmtCzkShort(agg.savingsPerYear)} — bod
          zlomu po{" "}
          {agg.paybackYears.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} letech
          {!single && " (kombinace vybraných projektů)"}
        </p>
        <div className="mt-4">
          <LineChart data={agg.cashflow} formatValue={fmtCzkShort} />
        </div>
      </div>

      {/* Cost items table */}
      <div>
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Položky rozpočtu — {scopeLabel}
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Položka</th>
                {!single && <th className="px-4 py-2.5 font-medium">Projekt</th>}
                <th className="px-4 py-2.5 font-medium">Dodavatel</th>
                <th className="px-4 py-2.5 text-right font-medium">Částka</th>
                <th className="px-4 py-2.5 text-right font-medium">Podíl</th>
              </tr>
            </thead>
            <tbody>
              {agg.costItems.map((row) => (
                <tr key={`${row.project}-${row.item}`} className="border-b last:border-b-0">
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
