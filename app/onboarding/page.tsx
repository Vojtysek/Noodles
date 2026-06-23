"use client"

import { useState, useRef, useEffect, useId } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import {
  Search,
  MapPin,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  AppWindow,
  Home,
  Layers,
  Flame,
  SlidersHorizontal,
  Thermometer,
  Wind,
  Sun,
  Star,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import {
  saveBuilding,
  PENDING_BUILDING_KEY,
  type BuildingPayload,
} from "@/lib/onboarding/save-building"
import { ScenarioSplash } from "@/components/dashboard/scenario-splash"
import { prices } from "./prices"

const BASE = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer"

type RepairCalc = {
  numberOfUnits: number
  rentYears: number
  isPartial: boolean
}
type BuildingData = {
  address: string
  units: number | null
  floors: number | null
  yearBuilt: number | null
  zastavenaFlocha: number | null
}
type RenovationType = {
  id: string
  label: string
  icon: React.ElementType
  available: boolean
}

const RENOVATIONS: RenovationType[] = [
  { id: "windows", label: "Okna", icon: AppWindow, available: true },
  {
    id: "insulation",
    label: "Zateplení fasády",
    icon: Layers,
    available: true,
  },
  { id: "roof", label: "Zateplení střechy", icon: Home, available: true },
  {
    id: "blinds",
    label: "Venkovní žaluzie",
    icon: SlidersHorizontal,
    available: true,
  },
  {
    id: "heatpump",
    label: "Tepelné čerpadlo",
    icon: Thermometer,
    available: true,
  },
  { id: "heating", label: "Vytápění", icon: Flame, available: true },
  { id: "recuperation", label: "Rekuperace", icon: Wind, available: true },
  { id: "photovoltaics", label: "Fotovoltaika", icon: Sun, available: true },
]

const ONBOARDING_TO_PROJECT: Record<string, string> = {
  windows: "okna",
  insulation: "fasada",
  roof: "strecha",
  blinds: "zaluzie",
  heatpump: "tepelne-cerpadlo",
  heating: "vytapeni",
  recuperation: "rekuperace",
  photovoltaics: "fotovoltaika",
}

// --- Dynamický model nákladů renovace ----------------------------------------
// Geometrie odvozená z RÚIAN dat. "facade" ≈ zastavěná plocha × počet pater;
// 15 % fasády tvoří okna, 85 % plná stěna; okno ≈ 2,25 m².
function buildingGeometry(b: BuildingData | null) {
  const footprint = b?.zastavenaFlocha ?? 400
  const floors = b?.floors ?? 4
  const facade = footprint * floors
  const windowArea = facade * 0.15
  const wallArea = facade * 0.85
  const windowCount = Math.round(windowArea / 2.25)
  return { footprint, floors, facade, windowArea, wallArea, windowCount }
}

type Geometry = ReturnType<typeof buildingGeometry>

// Náklady jedné renovace (Kč). Plošné položky škálují s obálkou budovy,
// zdroje tepla / komfort jsou na byt. Ceny pochází z prices.ts.
function renovationCost(id: string, g: Geometry, units: number): number {
  switch (id) {
    case "windows": // Okna — počet oken × 12000
      return g.windowCount * prices.window
    case "insulation": // Zateplení fasády — plocha stěn × 1800
      return Math.round(g.wallArea * prices.zatepleniM2)
    case "roof": // Zateplení střechy — zastavěná plocha × patra × 2000
      return Math.round(g.footprint * prices.zatepleniStrechyM2)
    case "blinds": // Venkovní žaluzie — počet oken × 12000
      return g.windowCount * prices.venkovniZaluzie
    case "heatpump": // Tepelné čerpadlo — 150000 / byt
      return units * prices.tepelneCerpadlo
    case "heating": // Vytápění (centrální) — 500000 / byt
      return units * prices.centrálníVytapeni
    case "recuperation": // Rekuperace — 50000 / byt
      return units * prices.rekuperace
    case "photovoltaics": // Fotovoltaika — 50000 / byt
      return units * prices.fotovoltaika
    default:
      return 0
  }
}

// Rozpad nákladů pro aktuálně vybrané renovace.
function renovationBreakdown(
  selected: string[],
  g: Geometry,
  units: number
): { id: string; label: string; cost: number }[] {
  return selected.map((id) => ({
    id,
    label: RENOVATIONS.find((r) => r.id === id)?.label ?? id,
    cost: renovationCost(id, g, units),
  }))
}

function calcRepair(c: RepairCalc, totalCost: number, equity: number = 0) {
  const alpha = totalCost
  const maxRentTime = alpha < 1_500_000 ? 10 : 15
  const maxLoanPerUnit = 750_000
  const loanCap = maxLoanPerUnit * c.numberOfUnits
  // Vlastní kapitál se vloží do investice jako první; financuje se jen zbytek.
  const zbyva = Math.max(0, alpha - Math.max(0, equity))
  const loan = Math.min(zbyva, loanCap)
  const n = 12 * c.rentYears
  const r = 0.0499 / 12
  const comLoan = ((loan * (r * (1 + r) ** n)) / ((1 + r) ** n - 1)) * n
  const overCap = Math.max(0, zbyva - loan)
  const monthlyPerUnit =
    c.numberOfUnits > 0 && c.rentYears > 0
      ? loan / c.numberOfUnits / c.rentYears / 12
      : 0
  return {
    alpha,
    maxRentTime,
    maxLoanPerUnit,
    loanCap,
    loan,
    comLoan,
    finalRent: loan, // alias pro stávající konzumenty (uložení do Supabase)
    overCap,
    monthlyPerUnit,
    cappedByMax: zbyva > loanCap,
  }
}

const RENOVATION_PRIORITY: Record<string, string[]> = {
  F: [
    "insulation",
    "windows",
    "roof",
    "heating",
    "heatpump",
    "recuperation",
    "blinds",
    "photovoltaics",
  ],
  E: [
    "insulation",
    "windows",
    "roof",
    "heatpump",
    "heating",
    "recuperation",
    "blinds",
    "photovoltaics",
  ],
  D: [
    "windows",
    "heatpump",
    "insulation",
    "heating",
    "roof",
    "recuperation",
    "blinds",
    "photovoltaics",
  ],
  C: [
    "heatpump",
    "heating",
    "windows",
    "recuperation",
    "insulation",
    "roof",
    "blinds",
    "photovoltaics",
  ],
  B: [
    "heatpump",
    "recuperation",
    "heating",
    "photovoltaics",
    "blinds",
    "windows",
    "insulation",
    "roof",
  ],
  A: [
    "photovoltaics",
    "heatpump",
    "recuperation",
    "blinds",
    "heating",
    "windows",
    "insulation",
    "roof",
  ],
}

const DEFAULT_PRIORITY = [
  "insulation",
  "windows",
  "heatpump",
  "heating",
  "roof",
  "recuperation",
  "blinds",
  "photovoltaics",
]

function getSortedRenovations(grade: string | null): {
  sorted: RenovationType[]
  starId: string
} {
  const order =
    grade && RENOVATION_PRIORITY[grade]
      ? RENOVATION_PRIORITY[grade]
      : DEFAULT_PRIORITY
  const sorted = [...RENOVATIONS].sort((a, b) => {
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
  return { sorted, starId: order[0] }
}

function stripDiacritics(str: string) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "")
}

const ENERGY_LABELS = [
  { id: "A++", color: "bg-emerald-700", text: "text-white" },
  { id: "A+", color: "bg-emerald-600", text: "text-white" },
  { id: "A", color: "bg-emerald-500", text: "text-white" },
  { id: "B", color: "bg-lime-500", text: "text-white" },
  { id: "C", color: "bg-yellow-400", text: "text-zinc-900" },
  { id: "D", color: "bg-orange-400", text: "text-white" },
  { id: "E", color: "bg-orange-500", text: "text-white" },
  { id: "F", color: "bg-red-500", text: "text-white" },
  { id: "G", color: "bg-red-700", text: "text-white" },
]

function calcEnergyScore(
  year: number,
  insulated: boolean,
  newWindows: boolean,
  photovolatic: boolean
) {
  const base =
    year < 1980 ? 7 : year < 1990 ? 6 : year < 2002 ? 5 : year < 2013 ? 4 : 3
  return (
    base - (insulated ? 2 : 0) - (newWindows ? 1 : 0) - (photovolatic ? 1 : 0)
  )
}

const ENERGY_GRADES = [
  {
    maxPts: 2,
    grade: "B",
    label: "Velmi úsporná",
    bg: "bg-emerald-500",
    text: "text-white",
  },
  {
    maxPts: 4,
    grade: "C",
    label: "Úsporná",
    bg: "bg-yellow-400",
    text: "text-zinc-900",
  },
  {
    maxPts: 5,
    grade: "D",
    label: "Méně úsporná",
    bg: "bg-orange-400",
    text: "text-white",
  },
  {
    maxPts: 6,
    grade: "E",
    label: "Nehospodárná",
    bg: "bg-orange-600",
    text: "text-white",
  },
  {
    maxPts: Infinity,
    grade: "F",
    label: "Velmi nehospodárná",
    bg: "bg-red-600",
    text: "text-white",
  },
]

function energyGrade(pts: number) {
  return (
    ENERGY_GRADES.find((g) => pts <= g.maxPts) ??
    ENERGY_GRADES[ENERGY_GRADES.length - 1]
  )
}

const STEP_META = [
  {
    title: "Kde se nachází vaše budova?",
    desc: "Vyhledejte adresu pro automatické načtení dat. Krok je volitelný.",
  },
  {
    title: "Energetický štítek budovy",
    desc: "Odhadnuto z roku výstavby — upravte podle skutečného stavu.",
  },
  {
    title: "Základní kapitál",
    desc: "Zadejte výši vlastních prostředků, které chcete vložit do investice.",
  },
  {
    title: "Co chcete renovovat?",
    desc: "Vyberte oblast pro výpočet příspěvku do fondu oprav.",
  },
]

const BUILDING_FIELDS = [
  {
    label: "Bytové jednotky",
    key: "units" as const,
    min: 1,
    max: 500,
    unit: "",
  },
  { label: "Počet podlaží", key: "floors" as const, min: 1, max: 60, unit: "" },
  {
    label: "Zastavěná plocha",
    key: "zastavenaFlocha" as const,
    min: 50,
    max: 2000,
    unit: "m²",
  },
  {
    label: "Rok dokončení",
    key: "yearBuilt" as const,
    min: 1800,
    max: 2030,
    unit: "",
  },
] as const

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

// Plynulé počítadlo — animuje z poslední zobrazené hodnoty na cílovou (ease-out).
function useCountUp(target: number, durationMs = 700) {
  const [display, setDisplay] = useState(target)
  const displayRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) {
      displayRef.current = target
      setDisplay(target) // eslint-disable-line react-hooks/set-state-in-effect
      return
    }
    const from = displayRef.current
    if (from === target) return
    let start: number | null = null
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const tick = (now: number) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / durationMs)
      const value = from + (target - from) * ease(t)
      displayRef.current = value
      setDisplay(value)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, durationMs])

  return display
}

// iOS-style segmented control. Refaktor čtyř duplicitních toggle dvojic.
// `options` je dvojice [labelFalse, labelTrue]; `value` mapuje na labelTrue.
function SegmentedToggle({
  options,
  value,
  onChange,
}: {
  options: readonly [string, string]
  value: boolean
  onChange: (next: boolean) => void
}) {
  const reduceMotion = useReducedMotion()
  const groupId = useId()
  return (
    <div
      role="radiogroup"
      className="flex gap-0.5 rounded-lg bg-muted/70 p-0.5"
    >
      {options.map((label, i) => {
        const optionValue = i === 1
        const active = value === optionValue
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(optionValue)}
            className={`relative rounded-md px-3 py-1 text-xs font-medium transition-all active:scale-[0.97] ${active ? "text-foreground" : "cursor-pointer text-muted-foreground hover:text-foreground"}`}
          >
            {active && (
              <motion.div
                layoutId={groupId}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }
                }
                className="absolute inset-0 rounded-md bg-background shadow-sm"
              />
            )}
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// Variants pro směrový swipe mezi kroky průvodce.
// `direction` 1 = vpřed (in zprava), -1 = zpět (in zleva).
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
  }),
}

const reducedVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function CalculatorPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [splashPayload, setSplashPayload] = useState<BuildingPayload | null>(
    null
  )

  // Změna kroku se směrem pro swipe animaci.
  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [building, setBuilding] = useState<BuildingData | null>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [energyLabel, setEnergyLabel] = useState<string | null>(null) // PENB manual override
  const [insulated, setInsulated] = useState(false)
  const [newWindows, setNewWindows] = useState(false)
  const [photovolatic, setPhotovolatic] = useState(false)
  const [heater, setHeater] = useState(true)
  const [showPenb, setShowPenb] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [zakladniKapital, setZakladniKapital] = useState<number | null>(null)

  const [repair, setRepair] = useState<RepairCalc>({
    numberOfUnits: 20,
    rentYears: 10,
    isPartial: true,
  })

  const geom = buildingGeometry(building)
  const derivedWindowCount = geom.windowCount
  const breakdown = renovationBreakdown(selected, geom, repair.numberOfUnits)
  const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0)
  const calc = calcRepair(repair, totalCost, zakladniKapital ?? 0)
  const animatedAlpha = useCountUp(calc.alpha)
  const animatedLoan = useCountUp(calc.loan)
  const animatedComLoan = useCountUp(calc.comLoan)
  const animatedOver = useCountUp(calc.overCap)
  const animatedMonthly = useCountUp(calc.monthlyPerUnit)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setShowSuggestions(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (repair.rentYears > calc.maxRentTime) setR("rentYears", calc.maxRentTime)
  }, [calc.maxRentTime]) // eslint-disable-line react-hooks/exhaustive-deps

  function setR<K extends keyof RepairCalc>(key: K, val: RepairCalc[K]) {
    setRepair((p) => ({ ...p, [key]: val }))
  }

  function handleInput(val: string) {
    setQuery(val)
    setBuilding(null)
    setSearchError(null)
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (val.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    suggestTimer.current = setTimeout(() => fetchSuggest(val.trim()), 100)
  }

  async function fetchSuggest(q: string) {
    try {
      const normalized = stripDiacritics(q)
      const [resOrig, resStripped] = await Promise.all([
        fetch(
          `${BASE}/exts/GeocodeSOE/suggest?text=${encodeURIComponent(q)}&maxSuggestions=6&f=json`
        ).then((r) => r.json()),
        normalized !== q
          ? fetch(
              `${BASE}/exts/GeocodeSOE/suggest?text=${encodeURIComponent(normalized)}&maxSuggestions=6&f=json`
            ).then((r) => r.json())
          : Promise.resolve({ suggestions: [] }),
      ])
      const seen = new Set<string>()
      const items: string[] = []
      for (const s of [
        ...(resOrig.suggestions || []),
        ...(resStripped.suggestions || []),
      ]) {
        if (!seen.has(s.text)) {
          seen.add(s.text)
          items.push(s.text)
        }
      }
      setSuggestions(items.slice(0, 6))
      setShowSuggestions(items.length > 0)
    } catch {
      setShowSuggestions(false)
    }
  }

  function selectSuggestion(text: string) {
    setQuery(text)
    setShowSuggestions(false)
    doSearch(text)
  }

  async function doSearch(override?: string) {
    const q = (override ?? query).trim()
    if (!q) return
    setShowSuggestions(false)
    setLoading(true)
    setSearchError(null)
    try {
      const cd = await fetch(
        `${BASE}/exts/GeocodeSOE/findAddressCandidates?SingleLine=${encodeURIComponent(q)}&outFields=*&maxLocations=1&f=json`
      ).then((r) => r.json())
      const candidates = cd.candidates || []
      if (!candidates.length) {
        setSearchError("Adresa nenalezena. Zkuste upřesnit.")
        return
      }
      const best = candidates[0]
      const { x, y } = best.location
      const soRes = await fetch(
        `${BASE}/3/query?geometry=${encodeURIComponent(`${x},${y}`)}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=102067&outFields=*&f=json&distance=5&units=esriSRUnit_Meter`
      ).then((r) => r.json())
      const so = soRes.features?.[0]?.attributes ?? null
      const units = so?.pocetbytu > 0 ? so.pocetbytu : null
      setBuilding({
        address: best.attributes?.Match_addr || best.address || q,
        units,
        floors: so?.pocetpodlazi ?? null,
        yearBuilt: so?.dokonceni ? new Date(so.dokonceni).getFullYear() : null,
        zastavenaFlocha: so?.["st_area(shape)"]
          ? Math.round(so["st_area(shape)"])
          : null,
      })
      if (units) setR("numberOfUnits", Math.min(500, Math.max(1, units)))
    } catch (e) {
      setSearchError(
        "Chyba: " + (e instanceof Error ? e.message : "neznámá chyba")
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCta() {
    if (step === 0) {
      if (building) {
        goToStep(1)
        return
      }
      if (query.trim()) {
        doSearch()
        return
      }
      goToStep(1)
    } else if (step === 1) {
      goToStep(2)
    } else if (step === 2) {
      goToStep(3)
    } else if (step === 3) {
      if (selected.length === 0) return
      const year = building?.yearBuilt ?? null
      const pts = year
        ? calcEnergyScore(year, insulated, newWindows, photovolatic)
        : null
      const g = pts != null ? energyGrade(pts) : null
      const displayGrade = energyLabel ?? g?.grade ?? null
      const selectedLabels = selected.map(
        (id) => RENOVATIONS.find((r) => r.id === id)?.label ?? id
      )
      const costsByProject = Object.fromEntries(
        selected
          .filter((id) => ONBOARDING_TO_PROJECT[id])
          .map((id) => [
            ONBOARDING_TO_PROJECT[id],
            renovationCost(id, geom, repair.numberOfUnits),
          ])
      )
      const payload: BuildingPayload = {
        address: building?.address ?? null,
        zakladni_kapital: zakladniKapital,
        units: repair.numberOfUnits,
        floors: building?.floors ?? null,
        year_built: building?.yearBuilt ?? null,
        zastavena_plocha: building?.zastavenaFlocha ?? null,
        energy_grade: displayGrade,
        insulated,
        new_windows: newWindows,
        selected_renovations: selectedLabels,
        costs_by_project: costsByProject,
        monthly_per_unit: Math.round(calc.monthlyPerUnit),
        total_cost: calc.alpha,
        final_rent: calc.finalRent,
        rent_years: repair.rentYears,
        window_count: derivedWindowCount,
        capped_by_max: calc.cappedByMax,
      }
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          await saveBuilding(supabase, user.id, payload)
        } catch {
          // continue to dashboard even if save fails
        }
        router.push("/dashboard/pruvodce?from=onboarding")
      } else {
        // Not logged in → show the scenario splash first; registration
        // happens only after they pick a path.
        setSplashPayload(payload)
      }
    }
  }

  const ctaLabel =
    step === 0
      ? building
        ? "Pokračovat"
        : query.trim()
          ? "Vyhledat"
          : "Přeskočit"
      : step === 3
        ? "Zobrazit výsledky"
        : "Pokračovat"

  const ctaDisabled = loading || (step === 3 && selected.length === 0)

  const progressDots = (
    <div className="flex justify-center gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
        />
      ))}
    </div>
  )

  const ctaButton = (
    <Button
      onClick={handleCta}
      size="lg"
      className="w-full rounded-xl transition-transform active:scale-[0.99]"
      disabled={ctaDisabled}
    >
      {loading && <Loader2 className="animate-spin" />}
      {ctaLabel}
    </Button>
  )

  const stepTransition = reduceMotion
    ? { duration: 0.2 }
    : { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <div className="flex min-h-svh flex-col overflow-hidden bg-background">
      {/* Persistentní zpět tlačítko — mimo animovaný kontejner */}
      {step > 0 && (
        <button
          onClick={() => goToStep(step - 1)}
          className="group flex items-center gap-1 px-6 pt-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />{" "}
          Zpět
        </button>
      )}

      {/* Perzistentní sloupec: animovaný obsah uvnitř, chrome (dots + CTA) vně */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pt-3 pb-8">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={reduceMotion ? reducedVariants : stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
            className={`flex flex-1 flex-col gap-5 ${step === 0 ? "justify-center" : ""}`}
          >
            <div>
              <h2 className="text-xl font-semibold">{STEP_META[step].title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {STEP_META[step].desc}
              </p>
            </div>

            {/* Step 0 — Address */}
            {step === 0 && (
              <div ref={wrapperRef} className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => handleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") doSearch()
                    }}
                    placeholder="Václavské náměstí 1, Praha"
                    autoFocus
                    autoComplete="off"
                    className="h-9 w-full rounded-lg border border-border bg-background pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  {loading && (
                    <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full right-0 left-0 z-20 mt-1 animate-in overflow-hidden rounded-lg border border-border bg-background shadow-lg duration-200 fade-in slide-in-from-top-1">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => selectSuggestion(s)}
                          className="flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted"
                        >
                          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchError && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {searchError}
                    </p>
                  )}
                </div>

                {building && (
                  <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border">
                    {BUILDING_FIELDS.map(({ label, key, min, max, unit }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <span className="text-sm text-muted-foreground">
                          {label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setBuilding((b) =>
                                b
                                  ? {
                                      ...b,
                                      [key]: Math.max(min, (b[key] ?? min) - 1),
                                    }
                                  : b
                              )
                            }
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={building[key] ?? ""}
                            min={min}
                            max={max}
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                              setBuilding((b) => (b ? { ...b, [key]: val } : b))
                              if (key === "units" && val)
                                setR(
                                  "numberOfUnits",
                                  Math.min(500, Math.max(1, val))
                                )
                            }}
                            className="w-16 [appearance:textfield] bg-transparent text-center text-sm font-semibold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          {unit && (
                            <span className="text-xs text-muted-foreground">
                              {unit}
                            </span>
                          )}
                          <button
                            onClick={() =>
                              setBuilding((b) =>
                                b
                                  ? {
                                      ...b,
                                      [key]: Math.min(max, (b[key] ?? min) + 1),
                                    }
                                  : b
                              )
                            }
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 1 — Energy tag */}
            {step === 1 &&
              (() => {
                const year = building?.yearBuilt ?? null
                const pts = year
                  ? calcEnergyScore(year, insulated, newWindows, photovolatic)
                  : null
                const g = pts != null ? energyGrade(pts) : null
                return (
                  <div className="flex flex-col gap-4">
                    {/* Grade badge */}
                    <div className="flex items-center gap-4 rounded-xl border px-4 py-4">
                      <div
                        className={`flex size-16 shrink-0 items-center justify-center rounded-xl text-4xl font-bold ${g ? `${g.bg} ${g.text}` : "bg-muted text-muted-foreground"}`}
                      >
                        {g ? g.grade : "?"}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {g ? g.label : "Rok výstavby neznámý"}
                        </p>
                        {year != null ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            rok {year}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Zadejte rok v předchozím kroku
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-col divide-y divide-border rounded-xl border">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm">Zateplení fasády</span>
                          <span className="text-xs text-gray-400">
                            Za posledních 15 let
                          </span>
                        </div>
                        <SegmentedToggle
                          options={["Ne", "Ano"]}
                          value={insulated}
                          onChange={setInsulated}
                        />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm">Okna</span>
                        <SegmentedToggle
                          options={["Původní", "Nová"]}
                          value={newWindows}
                          onChange={setNewWindows}
                        />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm">Fotovoltaika</span>
                        <SegmentedToggle
                          options={["Ne", "Ano"]}
                          value={photovolatic}
                          onChange={setPhotovolatic}
                        />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm">Tepelný zdroj</span>
                        <SegmentedToggle
                          options={["Centrální", "Osobní"]}
                          value={!heater}
                          onChange={(v) => setHeater(!v)}
                        />
                      </div>
                    </div>

                    {/* PENB override */}
                    <button
                      onClick={() => setShowPenb((v) => !v)}
                      className="self-start text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                    >
                      {showPenb
                        ? "Skrýt průkaz PENB"
                        : "Mám průkaz PENB — zadat třídu ručně"}
                    </button>
                    {showPenb && (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {ENERGY_LABELS.map((e) => {
                          const isSelected = energyLabel === e.id
                          return (
                            <button
                              key={e.id}
                              onClick={() =>
                                setEnergyLabel(isSelected ? null : e.id)
                              }
                              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 ${
                                isSelected
                                  ? "border-foreground"
                                  : "border-transparent hover:border-border"
                              }`}
                            >
                              <span
                                className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-bold ${e.color} ${e.text}`}
                              >
                                {e.id}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

            {/* Step 2 — Základní kapitál */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-b from-primary/5 to-transparent px-4 py-8">
                  <div className="flex items-baseline gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={zakladniKapital ?? ""}
                      min={0}
                      step={10000}
                      onChange={(e) =>
                        setZakladniKapital(
                          e.target.value === ""
                            ? null
                            : Math.max(0, Number(e.target.value))
                        )
                      }
                      placeholder="0"
                      autoFocus
                      className="w-44 [appearance:textfield] bg-transparent text-center text-4xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-2xl font-semibold text-muted-foreground">
                      Kč
                    </span>
                  </div>
                  {zakladniKapital ? (
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {zakladniKapital.toLocaleString("cs-CZ")} Kč
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Krok je volitelný — částku můžete nechat prázdnou.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[100000, 500000, 1000000, 2000000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() =>
                        setZakladniKapital((prev) =>
                          prev === amount ? null : amount
                        )
                      }
                      className={`rounded-xl border px-2 py-2.5 text-xs font-medium tabular-nums transition-all active:scale-[0.97] ${
                        zakladniKapital === amount
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      {amount.toLocaleString("cs-CZ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Renovation grid with recommendation */}
            {step === 3 &&
              (() => {
                const year = building?.yearBuilt ?? null
                const pts = year
                  ? calcEnergyScore(year, insulated, newWindows, photovolatic)
                  : null
                const g = pts != null ? energyGrade(pts) : null
                const displayGrade = energyLabel ?? g?.grade ?? null
                const { sorted: sortedRenovations, starId } =
                  getSortedRenovations(displayGrade)
                return (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      {sortedRenovations.map((r, i) => {
                        const isSelected = selected.includes(r.id)
                        const isStar = r.id === starId
                        return (
                          <button
                            key={r.id}
                            style={{ animationDelay: `${i * 45}ms` }}
                            onClick={() =>
                              r.available
                                ? setSelected((prev) =>
                                    prev.includes(r.id)
                                      ? prev.filter((id) => id !== r.id)
                                      : [...prev, r.id]
                                  )
                                : undefined
                            }
                            disabled={!r.available}
                            className={`relative flex animate-in flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] fill-mode-both zoom-in-95 fade-in active:scale-[0.97] ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : r.available
                                  ? "border-border hover:border-primary/40 hover:bg-muted/50"
                                  : "cursor-not-allowed border-border opacity-35"
                            }`}
                          >
                            <r.icon
                              className={`size-7 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                              strokeWidth={1.5}
                            />
                            <span
                              className={`text-xs leading-tight font-medium ${isSelected ? "text-primary" : ""}`}
                            >
                              {r.label}
                            </span>
                            {isStar && (
                              <span className="absolute -top-1.5 -left-1.5">
                                <Star className="size-3.5 fill-amber-400 text-amber-400 drop-shadow-sm" />
                              </span>
                            )}
                            {!r.available && (
                              <span className="absolute -top-1.5 -right-1.5 rounded-full bg-muted px-1.5 py-px text-[9px] text-muted-foreground">
                                brzy
                              </span>
                            )}
                            {isSelected && (
                              <span className="absolute top-2 right-2 flex size-4 animate-in items-center justify-center rounded-full bg-primary duration-200 zoom-in">
                                <CheckCircle2 className="size-3 text-primary-foreground" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {selected.length > 0 && (
                      <div className="flex flex-col divide-y divide-border rounded-xl border">
                        {/* rentYears selector – discrete slider */}
                        {(() => {
                          const arr = [5, 7, 10]

                          calc.loan >= 1_500_000 && arr.push(13, 15)

                          const yearOptions = arr.filter(
                            (y) => y <= calc.maxRentTime
                          )
                          const rawIndex = yearOptions.indexOf(repair.rentYears)
                          const currentIndex =
                            rawIndex >= 0
                              ? rawIndex
                              : Math.min(
                                  yearOptions.length - 1,
                                  yearOptions.reduce(
                                    (best, y, i) =>
                                      Math.abs(y - repair.rentYears) <
                                      Math.abs(
                                        yearOptions[best] - repair.rentYears
                                      )
                                        ? i
                                        : best,
                                    0
                                  )
                                )
                          const single = yearOptions.length <= 1
                          const pct = single
                            ? 50
                            : (currentIndex / (yearOptions.length - 1)) * 100

                          return (
                            <div className="flex flex-col gap-4 px-4 py-4">
                              <span className="text-sm text-muted-foreground">
                                Doba splácení úvěru
                              </span>
                              <div className="flex items-baseline justify-center">
                                <span className="text-3xl font-semibold text-primary tabular-nums">
                                  {repair.rentYears} let
                                </span>
                              </div>

                              {/* Track + thumb + native range overlay */}
                              <div className="relative px-2.5">
                                <div className="relative h-2 w-full rounded-full bg-muted">
                                  <div
                                    className="absolute top-0 left-0 h-2 rounded-full bg-primary transition-all duration-150"
                                    style={{ width: `${single ? 100 : pct}%` }}
                                  />
                                  <div
                                    className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow transition-all duration-150"
                                    style={{ left: `${pct}%` }}
                                  />
                                  <input
                                    type="range"
                                    min={0}
                                    max={Math.max(0, yearOptions.length - 1)}
                                    step={1}
                                    value={currentIndex}
                                    onChange={(e) =>
                                      setR(
                                        "rentYears",
                                        yearOptions[Number(e.target.value)]
                                      )
                                    }
                                    aria-label="Doba splácení úvěru"
                                    aria-valuetext={`${repair.rentYears} let`}
                                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                                    style={{ height: "20px", top: "-9px" }}
                                  />
                                </div>

                                {/* Tick labels */}
                                <div className="relative mt-3 h-5">
                                  {yearOptions.map((y, i) => {
                                    const active = i === currentIndex
                                    const labelPct = single
                                      ? 50
                                      : (i / (yearOptions.length - 1)) * 100
                                    return (
                                      <button
                                        key={y}
                                        type="button"
                                        onClick={() => setR("rentYears", y)}
                                        style={{ left: `${labelPct}%` }}
                                        className={`absolute -translate-x-1/2 text-sm whitespace-nowrap tabular-nums transition-colors ${active ? "font-medium text-primary" : "text-muted-foreground"}`}
                                      >
                                        {y}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Live preview — dynamický rozpočet podle výběru */}
                    {selected.length > 0 && (
                      <div className="flex animate-in flex-col overflow-hidden rounded-xl border duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] fade-in slide-in-from-bottom-2">
                        {/* Souhrn: investice → bezúročná půjčka → měsíční splátka */}
                        <div className="flex flex-col divide-y divide-border border-t">
                          <div className="flex flex-col items-center justify-between rounded-xl bg-gradient-to-b from-primary/10 to-primary/5 px-4 py-6">
                            <p className="mb-1.5 font-medium text-primary">
                              NZÚ Vám oproti Komerčnímu úvěru{" "}
                              <span className="font-semibold underline decoration-primary/40 decoration-2 underline-offset-4">
                                ušetří
                              </span>
                            </p>
                            <span className="text-4xl font-bold tracking-tight text-primary tabular-nums sm:text-5xl">
                              {Math.round(
                                animatedComLoan - animatedLoan
                              ).toLocaleString("cs-CZ")}{" "}
                              Kč
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
          </motion.div>
        </AnimatePresence>

        {/* Persistentní chrome — mimo AnimatePresence, aby se nepřemountoval */}
        <div className="mt-6 flex flex-col gap-3 pt-2">
          {progressDots}
          {ctaButton}
        </div>
      </div>
      {splashPayload && (
        <ScenarioSplash
          buildingData={{
            selected_renovations: splashPayload.selected_renovations,
            total_cost: splashPayload.total_cost,
            address: splashPayload.address,
          }}
          onContinue={() => {
            try {
              localStorage.setItem(
                PENDING_BUILDING_KEY,
                JSON.stringify(splashPayload)
              )
            } catch {
              // ignore storage failures
            }
            router.push("/login?mode=signup&from=onboarding")
          }}
          onClose={() => setSplashPayload(null)}
        />
      )}
    </div>
  )
}
