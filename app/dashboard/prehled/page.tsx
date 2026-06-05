"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
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

import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ComparisonLineChart, seriesCrossing } from "@/components/dashboard/charts"
import { Roadmap, type RoadmapItem } from "@/components/dashboard/roadmap"
import { ScenarioSplash } from "@/components/dashboard/scenario-splash"
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

type BuildingCalc = {
  address: string | null
  units: number
  energy_grade: string | null
  selected_renovations: string[]
  monthly_per_unit: number
  total_cost: number
  final_rent: number
  rent_years: number
  capped_by_max: boolean
}

function gradeBadgeClass(grade: string) {
  const map: Record<string, string> = {
    "A++": "bg-emerald-700 text-white",
    "A+": "bg-emerald-600 text-white",
    A: "bg-emerald-500 text-white",
    B: "bg-lime-500 text-white",
    C: "bg-yellow-400 text-zinc-900",
    D: "bg-orange-400 text-white",
    E: "bg-orange-600 text-white",
    F: "bg-red-600 text-white",
  }
  return map[grade] ?? "bg-muted text-muted-foreground"
}

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
  // Dev spouštění: ?splash=1 v URL, nebo tlačítko vedle nadpisu (jen v dev buildu).
  const [splashOpen, setSplashOpen] = useState(false)
  const [buildingCalc, setBuildingCalc] = useState<BuildingCalc | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.from("[data-pr-header]", { y: -20, autoAlpha: 0, duration: 0.6 }, 0).from(
        "[data-pr-reveal]",
        { y: 32, autoAlpha: 0, duration: 0.7, stagger: 0.1 },
        0.15
      )
    },
    { scope: rootRef }
  )

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("splash") === "1") {
      setSplashOpen(true)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await createClient()
          .from("buildings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
        if (data) setBuildingCalc(data as BuildingCalc)
      } catch {}
    })()
  }, [])

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
    <div ref={rootRef} className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-emerald-500/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 -z-10 size-96 rounded-full bg-blue-500/8 blur-[120px]"
      />

      {splashOpen && (
        <ScenarioSplash
          onClose={() => setSplashOpen(false)}
          onSelect={(id) => setScenarioId(id)}
        />
      )}

      {/* Header */}
      <div data-pr-header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-7 bg-emerald-500/60" />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
              SVJ Letná 24
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Přehled</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Vše podstatné o rekonstrukcích SVJ Letná 24 na jednom místě — bez tabulek a odborných
            pojmů.
          </p>
        </div>
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => setSplashOpen(true)}
            className="shrink-0 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Dev: splash
          </button>
        )}
      </div>

      {/* Výsledek kalkulace z onboardingu */}
      {buildingCalc && (
        <div className="rounded-2xl border bg-gradient-to-br from-muted/40 to-muted/10 p-4 lg:rounded-bl-[3rem] lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Výsledek vaší kalkulace</p>
              {buildingCalc.address && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{buildingCalc.address}</p>
              )}
            </div>
            {buildingCalc.energy_grade && (
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${gradeBadgeClass(buildingCalc.energy_grade)}`}
              >
                {buildingCalc.energy_grade}
              </span>
            )}
          </div>
          {buildingCalc.selected_renovations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {buildingCalc.selected_renovations.map((r) => (
                <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {r}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Měsíčně / byt</p>
              <p className="text-base font-semibold tabular-nums text-primary">
                {buildingCalc.monthly_per_unit.toLocaleString("cs-CZ")} Kč
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Celková cena opravy</p>
              <p className="text-base font-semibold tabular-nums">
                {buildingCalc.total_cost.toLocaleString("cs-CZ")} Kč
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stav domu — vstupní dlaždice */}
      <div data-pr-reveal className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group rounded-2xl border bg-muted/40 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/70 hover:shadow-lg"
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
      <div data-pr-reveal className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Jak se do toho pustit?
            </p>
          </div>
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
                  "flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                  active
                    ? cn(tone.selected, "scale-[1.02] shadow-xl")
                    : "hover:scale-[1.01] hover:bg-muted/50 hover:shadow-lg"
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
      <div data-pr-reveal className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
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
      <div
        data-pr-reveal
        className="rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5 lg:rounded-br-[3rem]"
      >
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
      <div data-pr-reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/financials"
          className="group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-lg"
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
          className="group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-lg"
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
