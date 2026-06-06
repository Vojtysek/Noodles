"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import {
  ArrowRight,
  CalendarDays,
  FileDown,
  HandCoins,
  HeartPulse,
  Leaf,
  PlugZap,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Thermometer,
  TrendingUp,
  Users,
  VolumeX,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  ComparisonLineChart,
  seriesCrossing,
  crossingYearIndex,
} from "@/components/dashboard/charts"
import { Roadmap, type RoadmapItem } from "@/components/dashboard/roadmap"
import { Harmonogram } from "@/components/dashboard/harmonogram"
import { ScenarioSplash } from "@/components/dashboard/scenario-splash"

import { userScenarios } from "@/lib/scenarios"
import {
  fmtCzk,
  fmtCzkShort,
  fmtDuration,
  projects,
  type Scenario,
  type ScenarioTone,
} from "@/lib/mock-data"
import {
  BENEFIT_CATEGORIES,
  NON_FINANCIAL_BENEFITS,
  groupBenefitsByCategory,
  selectBenefits,
  type BenefitCategory,
  type NonFinancialBenefit,
} from "@/lib/benefits"
import { fetchNonFinancialBenefits } from "@/lib/benefits-db"
import {
  projectAnnualSavings,
  buildSavingsGeometry,
  type SavingsGeometry,
} from "@/app/dashboard/financials/return"

type BuildingCalc = {
  id: string
  address: string | null
  units: number
  energy_grade: string | null
  selected_renovations: string[]
  monthly_per_unit: number
  total_cost: number
  final_rent: number
  rent_years: number
  capped_by_max: boolean
  costs_by_project: Record<string, number> | null
  zastavena_plocha: number | null
  floors: number | null
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
const WITH_COLOR = "var(--color-blue-500, #3b82f6)"

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

// Mapování názvů ikon z katalogu přínosů na konkrétní lucide komponenty.
const BENEFIT_ICONS: Record<BenefitCategory, LucideIcon> = {
  komfort: Thermometer,
  zdravi: HeartPulse,
  prostredi: Leaf,
  hodnota: TrendingUp,
  bezpecnost: Shield,
  hluk: VolumeX,
  nezavislost: PlugZap,
}

function projectShortName(projectId: string): string | undefined {
  return projects.find((p) => p.id === projectId)?.shortName
}

function monthLabel(offsetMonths: number): string {
  const total = START_MONTH + offsetMonths
  return `od ${MONTHS_CS[total % 12]} ${START_YEAR + Math.floor(total / 12)}`
}

/** Stejná modelace jako ve Financích — náklady obou scénářů v čase. */
function computeScenario(
  scenario: Scenario,
  projectCostOverrides?: Record<string, number>,
  geometry?: SavingsGeometry | null
) {
  const selected = scenario.projectIds
    .map((id) => projects.find((p) => p.id === id)!)
    .filter(Boolean)

  const mockBudget = selected.reduce((sum, p) => sum + p.budget, 0)
  const overrideBudget = projectCostOverrides
    ? selected.reduce(
        (sum, p) => sum + (projectCostOverrides[p.id] ?? p.budget),
        0
      )
    : mockBudget
  const scale =
    projectCostOverrides && overrideBudget > 0 ? overrideBudget / mockBudget : 1

  const budget = overrideBudget
  // Roční úspora z fyzikálních formulí (return.ts) — stejný výpočet jako Finance.
  // Fallback: škálovaný mock pro projekty bez vzorce (např. výtah).
  const savingsPerYear = selected.reduce((sum, p) => {
    const formula = geometry ? projectAnnualSavings(p.id, geometry) : null
    return sum + (formula != null ? formula : p.savingsPerYear * scale)
  }, 0)
  const fundIncreasePerFlat =
    selected.reduce((sum, p) => sum + p.fundIncreasePerFlat, 0) * scale
  const totalMonths = selected.reduce((sum, p) => sum + p.durationMonths, 0)
  const annualCost =
    selected.reduce((sum, p) => sum + p.baseline.annualCost, 0) * scale
  const growth =
    selected.reduce(
      (sum, p) => sum + p.baseline.costGrowthPct * p.baseline.annualCost,
      0
    ) /
    selected.reduce((sum, p) => sum + p.baseline.annualCost, 0) /
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
  // breakEvenPos (vzorkovaný) slouží jen pro značku v grafu; rok počítáme
  // z plných ročních křivek, aby seděl s tabem Finance (rozlišení na rok).
  const breakEvenPos = seriesCrossing(cumSeries.with, cumSeries.without)
  const breakEvenIdx = crossingYearIndex(cumWith, cumWithout)
  const breakEvenYear =
    breakEvenIdx !== null ? Math.round(START_YEAR + breakEvenIdx) : null

  let offset = 0
  const roadmap: RoadmapItem[] = selected.map((p) => {
    const item: RoadmapItem = {
      title: p.name,
      period: monthLabel(offset),
      duration: fmtDuration(p.durationMonths),
      cost: fmtCzkShort(projectCostOverrides?.[p.id] ?? p.budget),
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
  const [dynamicScenarios, setDynamicScenarios] = useState<Scenario[]>([])
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  // Dev spouštění: ?splash=1 v URL, nebo tlačítko vedle nadpisu (jen v dev buildu).
  const [splashOpen, setSplashOpen] = useState(false)
  const [buildingCalc, setBuildingCalc] = useState<BuildingCalc | null>(null)
  const [loading, setLoading] = useState(true)
  // Katalog nefinančních přínosů — z DB, s fallbackem na statický katalog.
  const [benefitCatalog, setBenefitCatalog] = useState<NonFinancialBenefit[]>(
    NON_FINANCIAL_BENEFITS
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("splash") === "1") {
      setSplashOpen(true)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        // Katalog přínosů z DB (fallback na statický uvnitř fetchNonFinancialBenefits).
        setBenefitCatalog(await fetchNonFinancialBenefits(supabase))
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("buildings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data) {
          setBuildingCalc(data as BuildingCalc)
          const built = userScenarios(
            (data as BuildingCalc).selected_renovations ?? []
          )
          setDynamicScenarios(built)
          setScenarioId(built[0]?.id ?? null)
          if (
            new URLSearchParams(window.location.search).get("from") ===
            "onboarding"
          ) {
            setSplashOpen(true)
          }
        }
      } catch {} finally {
        setLoading(false)
      }
    })()
  }, [])

  const scenario =
    dynamicScenarios.find((s) => s.id === scenarioId) ??
    dynamicScenarios[0] ??
    null
  // Geometrie domu z RÚIAN dat — vstup pro fyzikální formule úspor (return.ts).
  const geometry = useMemo<SavingsGeometry | null>(
    () =>
      buildSavingsGeometry(
        buildingCalc?.zastavena_plocha,
        buildingCalc?.floors,
        buildingCalc?.units
      ),
    [buildingCalc]
  )

  const result = useMemo(() => {
    if (!scenario) return null
    if (scenario.id === "vase-vybrane") {
      if (buildingCalc?.costs_by_project) {
        return computeScenario(scenario, buildingCalc.costs_by_project, geometry)
      }
      if (buildingCalc?.total_cost) {
        const mockTotal = scenario.projectIds.reduce((sum, id) => {
          const p = projects.find((p) => p.id === id)
          return sum + (p?.budget ?? 0)
        }, 0)
        const scale = mockTotal > 0 ? buildingCalc.total_cost / mockTotal : 1
        const overrides = Object.fromEntries(
          scenario.projectIds.map((id) => [
            id,
            (projects.find((p) => p.id === id)?.budget ?? 0) * scale,
          ])
        )
        return computeScenario(scenario, overrides, geometry)
      }
    }
    return computeScenario(scenario, undefined, geometry)
  }, [scenario, buildingCalc, geometry])

  // Nefinanční přínosy aktivního scénáře — seskupené dle kategorie.
  const benefitGroups = useMemo(() => {
    if (!scenario) return []
    const grouped = groupBenefitsByCategory(
      selectBenefits(benefitCatalog, scenario.projectIds)
    )
    return (Object.keys(grouped) as BenefitCategory[]).map((category) => ({
      category,
      benefits: grouped[category]!,
    }))
  }, [scenario, benefitCatalog])

  const finishLabel = result
    ? monthLabel(result.totalMonths).replace("od ", "")
    : ""

  // Hodnoty do plovoucích chipů v hero pruhu.
  const breakEvenYear = result?.breakEvenYear ?? null

  const hasPlan = scenario !== null && result !== null

  // Vstupní reveal (hlavička + sekce). Stejný vzor jako dřív.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.from("[data-pr-header]", { y: -20, autoAlpha: 0, duration: 0.6 }, 0)
        .from(
          "[data-hero-photo]",
          { scale: 1.12, duration: 1.4, ease: "power2.out" },
          0
        )
        .from(
          "[data-hero-chip]",
          { y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.08 },
          0.4
        )
        .from(
          "[data-pr-reveal]",
          { y: 32, autoAlpha: 0, duration: 0.7, stagger: 0.1 },
          0.3
        )
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
              el.textContent =
                rounded >= 10000
                  ? rounded.toLocaleString("cs-CZ")
                  : String(rounded)
            },
          }
        )
      })
      gsap.utils.toArray<HTMLElement>("[data-count-chip-czk]").forEach((el) => {
        const target = parseFloat(el.dataset.countChipCzk ?? "0")
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
              el.textContent = `+${rounded.toLocaleString("cs-CZ")} Kč`
            },
          }
        )
      })
    },
    { scope: rootRef, dependencies: [buildingCalc, breakEvenYear] }
  )

  if (loading) {
    return (
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-40 -z-10 size-[28rem] rounded-full bg-blue-500/12 blur-[130px]" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 -right-40 -z-10 size-[28rem] rounded-full bg-blue-500/12 blur-[130px]" />
        <div className="relative isolate min-h-[15rem] overflow-hidden rounded-[2rem] rounded-br-[5rem] bg-zinc-900 sm:min-h-[17rem]">
          <div className="relative flex h-full min-h-[15rem] flex-col justify-between gap-6 p-6 sm:min-h-[17rem] sm:p-8">
            <div>
              <div className="h-2.5 w-28 animate-pulse rounded bg-white/20" />
              <div className="mt-2 h-8 w-36 animate-pulse rounded bg-white/20" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              <div className="h-10 w-40 animate-pulse rounded-xl bg-white/20" />
              <div className="h-10 w-44 animate-pulse rounded-xl bg-white/20" />
              <div className="h-10 w-40 animate-pulse rounded-xl bg-white/20" />
            </div>
          </div>
        </div>
        <div className="h-48 w-full animate-pulse rounded-2xl border bg-muted/40" />
        <div className="h-56 w-full animate-pulse rounded-2xl border bg-muted/40" />
        <div className="h-40 w-full animate-pulse rounded-2xl border bg-muted/40" />
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="relative mx-auto flex w-full max-w-6xl flex-col gap-8"
    >
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-[28rem] rounded-full bg-blue-500/12 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 -z-10 size-[28rem] rounded-full bg-blue-500/12 blur-[130px]"
      />

      {splashOpen && (
        <ScenarioSplash
          onClose={() => {
            setSplashOpen(false)
            if (
              new URLSearchParams(window.location.search).get("from") ===
              "onboarding"
            ) {
              router.replace("/dashboard/prehled")
            }
          }}
          onContinue={() => {
            setSplashOpen(false)
            if (
              new URLSearchParams(window.location.search).get("from") ===
              "onboarding"
            ) {
              router.replace("/dashboard/prehled")
            }
          }}
          buildingData={
            buildingCalc
              ? {
                  selected_renovations: buildingCalc.selected_renovations,
                  total_cost: buildingCalc.total_cost,
                  address: buildingCalc.address,
                }
              : undefined
          }
        />
      )}

      {/* Foto hero pruh */}
      <div
        data-pr-header
        className="relative isolate min-h-[15rem] overflow-hidden rounded-[2rem] rounded-br-[5rem] sm:min-h-[17rem]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-hero-photo
          src={HERO_PHOTO}
          alt="Bytový dům"
          className="absolute inset-0 -z-10 h-full w-full object-cover will-change-transform"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

        <div className="relative flex h-full min-h-[15rem] flex-col justify-between gap-6 p-6 sm:min-h-[17rem] sm:p-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="h-px w-7 bg-blue-300/70" />
              <p className="text-[11px] font-semibold tracking-[0.2em] text-blue-300 uppercase">
                {buildingCalc?.address ?? "Vaše SVJ"}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Přehled
              </h1>
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
                <Users className="size-4 shrink-0 text-blue-300" />
                <p className="text-sm text-white/90">
                  <span
                    data-count-chip={buildingCalc.units}
                    className="font-semibold tabular-nums"
                  >
                    {buildingCalc.units}
                  </span>{" "}
                  <span className="text-white/60">bytových jednotek</span>
                </p>
              </div>
              <div
                data-hero-chip
                className="flex items-center gap-2.5 rounded-xl bg-zinc-950/60 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur-md"
              >
                <Wallet className="size-4 shrink-0 text-blue-300" />
                <p className="text-sm text-white/90">
                  <span
                    data-count-chip={buildingCalc.monthly_per_unit}
                    className="font-semibold tabular-nums"
                  >
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
                  <Sparkles className="size-4 shrink-0 text-blue-300" />
                  <p className="text-sm text-white/90">
                    <span className="text-white/60">Vyplatí se od roku</span>{" "}
                    <span
                      data-count-chip={breakEvenYear}
                      className="font-semibold"
                    >
                      {breakEvenYear}
                    </span>
                  </p>
                </div>
              )}
              {result && result.fundIncreasePerFlat > 0 && (
                <div
                  data-hero-chip
                  className="flex items-center gap-2.5 rounded-xl bg-zinc-950/60 px-3.5 py-2.5 ring-1 ring-white/15 backdrop-blur-md"
                >
                  <HandCoins className="size-4 shrink-0 text-blue-300" />
                  <p className="text-sm text-white/90">
                    <span
                      data-count-chip-czk={Math.round(result.fundIncreasePerFlat)}
                      className="font-semibold tabular-nums"
                    >
                      +{fmtCzk(Math.round(result.fundIncreasePerFlat))}
                    </span>{" "}
                    <span className="text-white/60">fond oprav / byt / měsíc</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Bez kalkulace — výzva ke spočítání úspor */
            <div data-hero-chip>
              <Button
                asChild
                className="h-11 rounded-full px-6 text-sm font-semibold shadow-xl"
              >
                <Link href="/dashboard/financials">Detailní přehled</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {!hasPlan && (
        <div
          data-pr-reveal
          className="relative overflow-hidden rounded-2xl border bg-background/60 p-8 text-center backdrop-blur-sm"
        >
          <h2 className="text-lg font-semibold">Zatím nemáte uložený plán</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Spusťte kalkulačku a vyberte rekonstrukce pro váš dům. Hned poté tu
            uvidíte harmonogram, náklady i to, kdy se investice vyplatí.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              asChild
              className="h-11 rounded-full px-6 text-sm font-semibold shadow-xl"
            >
              <Link href="/onboarding">
                {buildingCalc ? "Dokončit kalkulaci" : "Spustit kalkulačku"}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {hasPlan && result && scenario && (
        <>
          {/* Slim přepínač variant */}
          <div data-pr-reveal className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Scénář
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
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          TONE_DOT[s.tone]
                        )}
                      />
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Vyplatí se to? */}
          <div
            data-pr-reveal
            className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5 lg:rounded-br-[3rem]"
          >
            <TrendingUp aria-hidden className="pointer-events-none absolute top-4 right-4 size-12 text-blue-500" />
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
                  Na horizontu {HORIZON} let se tento scénář čistě finančně
                  nevrátí — její přínos je hlavně ve stavu a hodnotě domu.
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

          {/* Harmonogram vybraného scénáře */}
          <div
            data-pr-reveal
            className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
          >
            <CalendarDays aria-hidden className="pointer-events-none absolute top-4 right-4 size-12 text-blue-500" />
            <p className="text-sm font-medium">Harmonogram — {scenario.name}</p>
            <div className="mt-6">
              <Harmonogram
                items={result.roadmap}
                finishLabel={finishLabel}
                storageKey={`harmonogram-step-${buildingCalc?.id ?? "default"}`}
              />
            </div>
          </div>

          {/* Co tím získáte navíc — nefinanční přínosy */}
          {benefitGroups.length > 0 && (
            <div
              data-pr-reveal
              className="relative overflow-hidden rounded-2xl border bg-background/60 p-4 backdrop-blur-sm sm:p-5"
            >
              <Sparkles aria-hidden className="pointer-events-none absolute top-4 right-4 size-12 text-blue-500" />
              <p className="text-sm font-medium">Zlepšení kvality života</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Nefinanční přínosy vybraných rekonstrukcí — komfort, zdraví a
                hodnota domu.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {benefitGroups.map(({ category, benefits }) => {
                  const meta = BENEFIT_CATEGORIES[category]
                  const Icon = BENEFIT_ICONS[category]
                  return (
                    <div
                      key={category}
                      className="rounded-xl border bg-background/40 p-4"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                          <Icon className="size-4" />
                        </span>
                        <p className="text-sm font-semibold">{meta.label}</p>
                      </div>
                      <ul className="mt-3 flex flex-col gap-3">
                        {benefits.map((benefit) => {
                          const shortName =
                            benefit.projectId === null
                              ? "Celý dům"
                              : projectShortName(benefit.projectId)
                          return (
                            <li key={benefit.id}>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">
                                  {benefit.title}
                                </p>
                                {shortName && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {shortName}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {benefit.description}
                              </p>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Kam dál — slim řádek */}
      <div
        data-pr-reveal
        className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-sm"
      >
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
