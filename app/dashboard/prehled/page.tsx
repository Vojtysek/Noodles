"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import {
  ArrowRight,
  FileDown,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ComparisonLineChart, seriesCrossing } from "@/components/dashboard/charts"
import { Roadmap, type RoadmapItem } from "@/components/dashboard/roadmap"
import { ScenarioSplash } from "@/components/dashboard/scenario-splash"
import { buildDynamicScenarios } from "@/lib/scenarios"
import {
  fmtCzkShort,
  fmtDuration,
  projects,
  scenarios,
  type Scenario,
  type ScenarioTone,
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

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2400&auto=format&fit=crop"

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
  return map[grade] ?? "bg-white/20 text-white"
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

const TONE_DOT: Record<ScenarioTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
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
  const [dynamicScenarios, setDynamicScenarios] = useState<Scenario[]>(scenarios)
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  // Dev spouštění: ?splash=1 v URL, nebo tlačítko vedle nadpisu (jen v dev buildu).
  const [splashOpen, setSplashOpen] = useState(false)
  const [buildingCalc, setBuildingCalc] = useState<BuildingCalc | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

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
        if (data) {
          setBuildingCalc(data as BuildingCalc)
          const built = buildDynamicScenarios((data as BuildingCalc).selected_renovations ?? [])
          setDynamicScenarios(built)
          setScenarioId(built[0].id)
        }
      } catch {}
    })()
  }, [])

  const scenario = dynamicScenarios.find((s) => s.id === scenarioId) ?? dynamicScenarios[0]
  const result = useMemo(() => computeScenario(scenario), [scenario])

  const finishLabel = monthLabel(result.totalMonths).replace("od ", "")

  // Hodnoty do plovoucích chipů v hero pruhu.
  const breakEvenYear = result.breakEvenYear

  // Vstupní reveal (hlavička + sekce). Stejný vzor jako dřív.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.from("[data-pr-header]", { y: -20, autoAlpha: 0, duration: 0.6 }, 0)
        .from("[data-hero-photo]", { scale: 1.12, duration: 1.4, ease: "power2.out" }, 0)
        .from("[data-hero-chip]", { y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, 0.4)
        .from("[data-pr-reveal]", { y: 32, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, 0.3)
    },
    { scope: rootRef }
  )

  // Count-up číselných chipů — vzor s counter-objektem jako na landingu.
  // Běží po načtení dat, respektuje prefers-reduced-motion.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.utils.toArray<HTMLElement>("[data-count-chip]").forEach((el) => {
        const target = parseFloat(el.dataset.countChip ?? "0")
        if (!Number.isFinite(target)) return
        const counter = { value: 0 }
        gsap.fromTo(
          counter,
          { value: 0 },
          {
            value: target,
            duration: 1.2,
            ease: "power2.out",
            onUpdate() {
              const rounded = Math.round(counter.value)
              el.textContent = rounded >= 10000 ? rounded.toLocaleString("cs-CZ") : String(rounded)
            },
          }
        )
      })
    },
    { scope: rootRef, dependencies: [buildingCalc, breakEvenYear] }
  )

  return (
    <div ref={rootRef} className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-[28rem] rounded-full bg-emerald-500/12 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 -z-10 size-[28rem] rounded-full bg-blue-500/12 blur-[130px]"
      />

      {splashOpen && (
        <ScenarioSplash
          onClose={() => setSplashOpen(false)}
          onSelect={(id) => setScenarioId(id)}
        />
      )}

      {/* Foto hero pruh */}
      <div
        data-pr-header
        className="relative isolate overflow-hidden rounded-[2rem] rounded-br-[5rem] min-h-[15rem] sm:min-h-[17rem]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-hero-photo
          src={HERO_PHOTO}
          alt="Bytový dům"
          className="absolute inset-0 -z-10 h-full w-full object-cover will-change-transform"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => setSplashOpen(true)}
            className="absolute top-4 right-5 z-10 rounded-md border border-dashed border-white/30 px-2.5 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Dev: splash
          </button>
        )}

        <div className="relative flex h-full min-h-[15rem] flex-col justify-between gap-6 p-6 sm:min-h-[17rem] sm:p-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="h-px w-7 bg-emerald-300/70" />
              <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-300 uppercase">
                {buildingCalc?.address ?? "Vaše SVJ"}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Přehled</h1>
              {buildingCalc?.energy_grade && (
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 ring-white/20 ${gradeBadgeClass(buildingCalc.energy_grade)}`}
                >
                  {buildingCalc.energy_grade}
                </span>
              )}
            </div>
          </div>

          {buildingCalc ? (
            /* Tři plovoucí skleněné chipy */
            <div className="flex flex-wrap gap-2.5">
              <div
                data-hero-chip
                className="flex items-center gap-2.5 rounded-xl bg-zinc-950/60 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur-md"
              >
                <Users className="size-4 shrink-0 text-emerald-300" />
                <p className="text-sm text-white/90">
                  <span data-count-chip={buildingCalc.units} className="font-semibold tabular-nums">
                    {buildingCalc.units}
                  </span>{" "}
                  <span className="text-white/60">bytových jednotek</span>
                </p>
              </div>
              <div
                data-hero-chip
                className="flex items-center gap-2.5 rounded-xl bg-zinc-950/60 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur-md"
              >
                <Wallet className="size-4 shrink-0 text-emerald-300" />
                <p className="text-sm text-white/90">
                  <span data-count-chip={buildingCalc.monthly_per_unit} className="font-semibold tabular-nums">
                    {buildingCalc.monthly_per_unit.toLocaleString("cs-CZ")}
                  </span>{" "}
                  <span className="text-white/60">Kč / byt měsíčně</span>
                </p>
              </div>
              {breakEvenYear !== null && (
                <div
                  data-hero-chip
                  className="flex items-center gap-2.5 rounded-xl bg-zinc-950/60 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur-md"
                >
                  <Sparkles className="size-4 shrink-0 text-emerald-300" />
                  <p className="text-sm text-white/90">
                    <span className="text-white/60">Vyplatí se od roku</span>{" "}
                    <span data-count-chip={breakEvenYear} className="font-semibold">
                      {breakEvenYear}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Bez kalkulace — výzva ke spočítání úspor */
            <div data-hero-chip>
              <Button asChild className="h-11 rounded-full px-6 text-sm font-semibold shadow-xl">
                <Link href="/dashboard/financials">Detailní přehled</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Slim přepínač variant */}
      <div data-pr-reveal className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Varianta
          </span>
          <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
            {dynamicScenarios.map((s) => {
              const active = s.id === scenarioId
              return (
                <button
                  key={s.id}
                  onClick={() => setScenarioId(s.id)}
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
        </div>
      </div>

      {/* Harmonogram vybraného scénáře */}
      <div
        data-pr-reveal
        className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
      >
        {/* Ručně kreslený domeček v rohu */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -top-2 right-3 size-20 text-emerald-500/30"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 30 L32 12 L54 30" />
          <path d="M16 28 V52 H48 V28" />
          <path d="M28 52 V40 H36 V52" />
          <path d="M44 18 V12 H49 V22" />
        </svg>
        <p className="text-sm font-medium">Harmonogram — {scenario.name}</p>
        <div className="mt-6">
          <Roadmap items={result.roadmap} finishLabel={finishLabel} />
        </div>
      </div>

      {/* Vyplatí se to? */}
      <div
        data-pr-reveal
        className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5 lg:rounded-br-[3rem]"
      >
        {/* Ručně kreslené sluníčko v rohu */}
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
          {result.breakEvenYear !== null ? (
            <>
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

      {/* Kam dál — slim řádek */}
      <div data-pr-reveal className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-sm">
        <Link
          href="/dashboard/financials"
          className="group inline-flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <SlidersHorizontal className="size-4 shrink-0 text-primary" />
          Vlastní kombinace scénářů
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/dashboard/exporty"
          className="group inline-flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <FileDown className="size-4 shrink-0 text-primary" />
          Exporty na schůzi SVJ
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
