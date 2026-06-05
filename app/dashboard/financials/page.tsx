"use client"

import { useState } from "react"
import { Wallet, TrendingDown, CalendarClock, Zap } from "lucide-react"

import { cn } from "@/lib/utils"
import { BreakdownBars, DonutChart, LineChart } from "@/components/dashboard/charts"
import { projects, fmtCzk, type ProjectId } from "@/lib/mock-data"

const STATUS_LABELS: Record<string, string> = {
  navrh: "Návrh",
  schvalovani: "Schvalování",
  realizace: "Realizace",
}

function fmtCzkShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} mil. Kč`
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} tis. Kč`
  return fmtCzk(value)
}

export default function FinancialsPage() {
  const [projectId, setProjectId] = useState<ProjectId>(projects[0].id)
  const project = projects.find((p) => p.id === projectId) ?? projects[0]
  const spentPct = Math.round((project.spent / project.budget) * 100)

  const kpis = [
    { icon: Wallet, label: "Celkový rozpočet", value: fmtCzkShort(project.budget) },
    { icon: TrendingDown, label: "Roční úspora", value: fmtCzkShort(project.savingsPerYear) },
    {
      icon: CalendarClock,
      label: "Návratnost",
      value: `${project.paybackYears.toLocaleString("cs-CZ")} let`,
    },
    { icon: Zap, label: "Úspora energií", value: `${project.energySavingPct} %` },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Financials</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Finanční rozpad jednotlivých projektů rekonstrukce — rozpočty, čerpání a predikce
          návratnosti.
        </p>
      </div>

      {/* Project switcher */}
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setProjectId(p.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              p.id === projectId
                ? "border-primary/50 bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {p.shortName}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                p.id === projectId ? "bg-primary/10" : "bg-muted"
              )}
            >
              {STATUS_LABELS[p.status]}
            </span>
          </button>
        ))}
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
            Vyčerpáno {fmtCzk(project.spent)} z {fmtCzk(project.budget)}
          </p>
          <div className="mt-4">
            <DonutChart percent={spentPct} label="rozpočtu vyčerpáno" />
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            Navýšení fondu oprav:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {fmtCzk(project.fundIncreasePerFlat)} / byt / měsíc
            </span>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Rozpad nákladů</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Hlavní položky rozpočtu</p>
          <div className="mt-4">
            <BreakdownBars data={project.costBreakdown} formatValue={fmtCzkShort} />
          </div>
        </div>
      </div>

      {/* Payback prediction */}
      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">Predikce návratnosti</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Kumulativní bilance investice při roční úspoře {fmtCzkShort(project.savingsPerYear)} —
          bod zlomu po {project.paybackYears.toLocaleString("cs-CZ")} letech
        </p>
        <div className="mt-4">
          <LineChart data={project.cashflow} formatValue={fmtCzkShort} />
        </div>
      </div>

      {/* Cost items table */}
      <div>
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Položky rozpočtu — {project.name}
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Položka</th>
                <th className="px-4 py-2.5 font-medium">Dodavatel</th>
                <th className="px-4 py-2.5 text-right font-medium">Částka</th>
                <th className="px-4 py-2.5 text-right font-medium">Podíl</th>
              </tr>
            </thead>
            <tbody>
              {project.costItems.map((row) => (
                <tr key={row.item} className="border-b last:border-b-0">
                  <td className="px-4 py-2.5 font-medium">{row.item}</td>
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
