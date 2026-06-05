"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  CircleCheck,
  FileDown,
  HandCoins,
  Hammer,
  PiggyBank,
  SlidersHorizontal,
  Users,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ComparisonLineChart, seriesCrossing } from "@/components/dashboard/charts"
import { Roadmap, type RoadmapItem } from "@/components/dashboard/roadmap"
import {
  fmtCzk,
  fmtCzkShort,
  fmtDuration,
  personas as initialPersonas,
  projects,
  scenarios,
  type Scenario,
  type ScenarioTone,
  type Sentiment,
} from "@/lib/mock-data"

const START_YEAR = 2026
const START_MONTH = 0 // leden
const HORIZON = 20
const SAMPLES = 6

const WITHOUT_COLOR = "var(--color-rose-500, #f43f5e)"
const WITH_COLOR = "var(--color-emerald-500, #10b981)"

// Genitiv pro „od ledna 2026".
const MONTHS_CS = [
  "ledna",
  "února",
  "března",
  "dubna",
  "května",
  "června",
  "července",
  "srpna",
  "září",
  "října",
  "listopadu",
  "prosince",
]

const TONE_STYLES: Record<ScenarioTone, { selected: string; dot: string }> = {
  emerald: {
    selected: "border-emerald-500/60 bg-emerald-500/5 ring-3 ring-emerald-500/15",
    dot: "bg-emerald-500",
  },
  amber: {
    selected: "border-amber-500/60 bg-amber-500/5 ring-3 ring-amber-500/15",
    dot: "bg-amber-500",
  },
  blue: {
    selected: "border-blue-500/60 bg-blue-500/5 ring-3 ring-blue-500/15",
    dot: "bg-blue-500",
  },
}

function monthLabel(offsetMonths: number): string {
  const total = START_MONTH + offsetMonths
  return `od ${MONTHS_CS[total % 12]} ${START_YEAR + Math.floor(total / 12)}`
}

/** Stejná modelace jako ve Financích — náklady obou scénářů v čase. */
function computeScenario(scenario: Scenario) {
  const selected = scenario.projectIds
    .map((id) => projects.find((p) => p.id === id)!)
    .filter(Boolean)

  const budget = selected.reduce((sum, p) => sum + p.budget, 0)
  const savingsPerYear = selected.reduce((sum, p) => sum + p.savingsPerYear, 0)
  const fundIncreasePerFlat = selected.reduce((sum, p) => sum + p.fundIncreasePerFlat, 0)
  const totalMonths = selected.reduce((sum, p) => sum + p.durationMonths, 0)
  const annualCost = selected.reduce((sum, p) => sum + p.baseline.annualCost, 0)
  const growth =
    selected.reduce((sum, p) => sum + p.baseline.costGrowthPct * p.baseline.annualCost, 0) /
    annualCost /
    100

  const cumWithout: number[] = [0]
  const cumWith: number[] = [budget]
  for (let t = 1; t <= HORIZON; t++) {
    const factor = Math.pow(1 + growth, t - 1)
    cumWithout.push(cumWithout[t - 1] + annualCost * factor)
    cumWith.push(cumWith[t - 1] + (annualCost - savingsPerYear) * factor)
  }

  const sample = (values: number[]) =>
    Array.from({ length: SAMPLES }, (_, i) => {
      const t = Math.round((i / (SAMPLES - 1)) * HORIZON)
      return { year: String(START_YEAR + t), value: values[t] }
    })

  const cumSeries = { without: sample(cumWithout), with: sample(cumWith) }
  const breakEvenPos = seriesCrossing(cumSeries.with, cumSeries.without)
  const breakEvenYear =
    breakEvenPos !== null ? Math.round(START_YEAR + breakEvenPos * HORIZON) : null

  let offset = 0
  const roadmap: RoadmapItem[] = selected.map((p) => {
    const item: RoadmapItem = {
      title: p.name,
      period: monthLabel(offset),
      duration: fmtDuration(p.durationMonths),
      cost: fmtCzkShort(p.budget),
      months: p.durationMonths,
    }
    offset += p.durationMonths
    return item
  })

  return {
    selected,
    budget,
    savingsPerYear,
    fundIncreasePerFlat,
    totalMonths,
    cumSeries,
    breakEvenPos,
    breakEvenYear,
    roadmap,
  }
}

export default function PrehledPage() {
  const [scenarioId, setScenarioId] = useState(scenarios[1].id)
  const [supportCounts, setSupportCounts] = useState(() => countSentiments(initialPersonas))

  // Živé počty postojů ze stejného API jako stránka Rezidenti; mock jako záloha.
  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then((rows: Array<{ id: string; sentiment: Sentiment }>) => {
        if (!Array.isArray(rows) || rows.length === 0) return
        const dbIds = new Set(rows.map((p) => p.id))
        const merged = [...rows, ...initialPersonas.filter((p) => !dbIds.has(p.id))]
        setSupportCounts(countSentiments(merged))
      })
      .catch(() => {/* keep mock data on error */})
  }, [])

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]
  const result = useMemo(() => computeScenario(scenario), [scenario])

  const inProgress = projects.filter((p) => p.status === "realizace")
  const inApproval = projects.filter((p) => p.status === "schvalovani")
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
  const finishLabel = monthLabel(result.totalMonths).replace("od ", "")

  const tiles = [
    {
      icon: Users,
      label: "Podpora v domě",
      value: `${supportCounts.podporuje} z ${supportCounts.total}`,
      detail: "rezidentů rekonstrukce podporuje",
      href: "/dashboard/rezidenti",
    },
    {
      icon: Wallet,
      label: "Celý plán",
      value: fmtCzkShort(totalBudget),
      detail: `${projects.length} projekty čekají na rozhodnutí`,
      href: "/dashboard/financials",
    },
    {
      icon: Hammer,
      label: "Právě probíhá",
      value: inProgress.length > 0 ? inProgress.map((p) => p.shortName).join(", ") : "Nic",
      detail: inProgress.length > 0 ? "stavba běží podle plánu" : "žádná stavba neprobíhá",
      href: "/dashboard/financials",
    },
    {
      icon: CalendarClock,
      label: "Čeká na schválení",
      value: inApproval.length > 0 ? inApproval.map((p) => p.shortName).join(", ") : "Nic",
      detail: "rozhodne nejbližší schůze SVJ",
      href: "/dashboard/exporty",
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Přehled</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vše podstatné o rekonstrukcích SVJ Letná 24 na jednom místě — bez tabulek a odborných
          pojmů.
        </p>
      </div>

      {/* Stav domu — vstupní dlaždice */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group rounded-lg border bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/70"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <tile.icon className="size-3.5 shrink-0 text-primary" />
              {tile.label}
            </div>
            <p className="mt-1 truncate text-lg font-semibold tabular-nums">{tile.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{tile.detail}</p>
          </Link>
        ))}
      </div>

      {/* Tři scénáře */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Jak se do toho pustit?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tři připravené cesty — od nejlevnější po kompletní. Vyberte si a níže uvidíte, jak
            dlouho potrvá a co bude stát.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {scenarios.map((s) => {
            const r = computeScenario(s)
            const active = s.id === scenarioId
            const tone = TONE_STYLES[s.tone]
            return (
              <button
                key={s.id}
                onClick={() => setScenarioId(s.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 text-left transition-all",
                  active ? tone.selected : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2.5 shrink-0 rounded-full", tone.dot)} />
                    <p className="text-sm font-medium">{s.name}</p>
                  </div>
                  {active && <CircleCheck className="size-4 shrink-0 text-primary" />}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{s.tagline}</p>
                <div className="mt-auto flex flex-col gap-1.5 border-t pt-3 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      Hotovo za
                    </span>
                    <span className="font-medium tabular-nums">
                      {fmtDuration(r.totalMonths)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <HandCoins className="size-3.5" />
                      Měsíčně navíc
                    </span>
                    <span className="font-medium tabular-nums">
                      {fmtCzk(r.fundIncreasePerFlat)} / byt
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <PiggyBank className="size-3.5" />
                      Roční úspora
                    </span>
                    <span className="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                      {fmtCzkShort(r.savingsPerYear)}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Harmonogram vybraného scénáře */}
      <div className="rounded-lg border p-4 sm:p-5">
        <p className="text-sm font-medium">Jak to půjde za sebou — {scenario.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Projekty se realizují postupně, jeden po druhém. Celkem{" "}
          {fmtDuration(result.totalMonths)} a {fmtCzkShort(result.budget)}.
        </p>
        <div className="mt-6">
          <Roadmap items={result.roadmap} finishLabel={finishLabel} />
        </div>
      </div>

      {/* Vyplatí se to? */}
      <div className="rounded-lg border p-4 sm:p-5">
        <p className="text-sm font-medium">Vyplatí se to?</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {result.breakEvenYear !== null ? (
            <>
              Červená čára ukazuje, kolik dům zaplatí, když se nic neudělá. Zelená totéž s
              rekonstrukcí.{" "}
              <span className="font-medium text-foreground">
                Od roku {result.breakEvenYear} je rekonstrukce levnější
              </span>{" "}
              — a každý další rok šetří víc.
            </>
          ) : (
            <>
              Na horizontu {HORIZON} let se tato varianta čistě finančně nevrátí — její přínos je
              hlavně ve stavu a hodnotě domu.
            </>
          )}
        </p>
        <div className="mt-4">
          <ComparisonLineChart
            series={[
              {
                label: "Bez rekonstrukce",
                color: WITHOUT_COLOR,
                points: result.cumSeries.without,
              },
              {
                label: "S rekonstrukcí",
                color: WITH_COLOR,
                points: result.cumSeries.with,
              },
            ]}
            formatValue={fmtCzkShort}
            marker={
              result.breakEvenPos !== null && result.breakEvenYear !== null
                ? {
                    position: result.breakEvenPos,
                    label: `Od ${result.breakEvenYear} šetříte`,
                  }
                : null
            }
          />
        </div>
      </div>

      {/* Kam dál */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/financials"
          className="group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <SlidersHorizontal className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Chcete si namíchat vlastní kombinaci?</p>
            <p className="text-xs text-muted-foreground">
              Detailní finance — libovolné projekty, horizonty a rozpady nákladů
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/dashboard/exporty"
          className="group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <FileDown className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Potřebujete přesvědčit sousedy?</p>
            <p className="text-xs text-muted-foreground">
              Exporty — PDF a prezentace připravené na schůzi SVJ
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}

function countSentiments(list: Array<{ sentiment: Sentiment }>) {
  return {
    total: list.length,
    podporuje: list.filter((p) => p.sentiment === "podporuje").length,
  }
}
