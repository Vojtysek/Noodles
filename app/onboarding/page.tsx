"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
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

const BASE = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer"
const PRICE_PER_WINDOW = 12_000

type RepairCalc = {
  numberOfUnits: number
  rentYears: number
  isFirstRepair: boolean
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

function calcRepair(c: RepairCalc, windowCount: number) {
  const alpha = windowCount * PRICE_PER_WINDOW
  const maxRentTime = alpha < 1_500_000 ? 10 : 15
  const maxRentPerUnit = c.isFirstRepair ? 250_000 : 750_000
  const finalRent = Math.min(alpha, maxRentPerUnit * c.numberOfUnits)
  const monthlyPerUnit = finalRent / c.numberOfUnits / c.rentYears / 12
  return {
    alpha,
    maxRentTime,
    finalRent,
    monthlyPerUnit,
    cappedByMax: alpha > maxRentPerUnit * c.numberOfUnits,
  }
}

const RENOVATION_PRIORITY: Record<string, string[]> = {
  F: ["insulation", "windows", "roof", "heating", "heatpump", "recuperation", "blinds", "photovoltaics"],
  E: ["insulation", "windows", "roof", "heatpump", "heating", "recuperation", "blinds", "photovoltaics"],
  D: ["windows", "heatpump", "insulation", "heating", "roof", "recuperation", "blinds", "photovoltaics"],
  C: ["heatpump", "heating", "windows", "recuperation", "insulation", "roof", "blinds", "photovoltaics"],
  B: ["heatpump", "recuperation", "heating", "photovoltaics", "blinds", "windows", "insulation", "roof"],
  A: ["photovoltaics", "heatpump", "recuperation", "blinds", "heating", "windows", "insulation", "roof"],
}

const DEFAULT_PRIORITY = ["insulation", "windows", "heatpump", "heating", "roof", "recuperation", "blinds", "photovoltaics"]

function getSortedRenovations(grade: string | null): { sorted: RenovationType[]; starId: string } {
  const order = (grade && RENOVATION_PRIORITY[grade]) ? RENOVATION_PRIORITY[grade] : DEFAULT_PRIORITY
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
  newWindows: boolean
) {
  const base =
    year < 1980 ? 7 : year < 1990 ? 6 : year < 2002 ? 5 : year < 2013 ? 4 : 3
  return base - (insulated ? 2 : 0) - (newWindows ? 1 : 0)
}

const ENERGY_GRADES = [
  {
    maxPts: 0,
    grade: "A",
    label: "Mimořádně úsporná",
    bg: "bg-green-600",
    text: "text-white",
  },
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
    title: "Co chcete renovovat?",
    desc: "Vyberte oblast pro výpočet příspěvku do fondu oprav.",
  },
  {
    title: "Výsledek kalkulace",
    desc: "Orientační měsíční příspěvek na jednu jednotku.",
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

export default function CalculatorPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

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
  const [showPenb, setShowPenb] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const [repair, setRepair] = useState<RepairCalc>({
    numberOfUnits: 20,
    rentYears: 10,
    isFirstRepair: true,
  })

  const derivedWindowCount = Math.round(
    ((building?.zastavenaFlocha ?? 400) * (building?.floors ?? 4) * 0.15) / 2.25
  )
  const calc = calcRepair(repair, derivedWindowCount)

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
      if (units) setR("numberOfUnits", Math.min(50, Math.max(5, units)))
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
        setStep(1)
        return
      }
      if (query.trim()) {
        doSearch()
        return
      }
      setStep(1)
    } else if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      if (selected.length > 0) setStep(3)
    } else if (step === 3) {
      const year = building?.yearBuilt ?? null
      const pts = year ? calcEnergyScore(year, insulated, newWindows) : null
      const g = pts != null ? energyGrade(pts) : null
      const displayGrade = energyLabel ?? g?.grade ?? null
      const selectedLabels = selected.map(
        (id) => RENOVATIONS.find((r) => r.id === id)?.label ?? id
      )
      try {
        const supabase = createClient()
        await supabase.from("buildings").insert({
          address: building?.address ?? null,
          units: repair.numberOfUnits,
          floors: building?.floors ?? null,
          year_built: building?.yearBuilt ?? null,
          zastavena_plocha: building?.zastavenaFlocha ?? null,
          energy_grade: displayGrade,
          insulated,
          new_windows: newWindows,
          selected_renovations: selectedLabels,
          monthly_per_unit: Math.round(calc.monthlyPerUnit),
          total_cost: calc.alpha,
          final_rent: calc.finalRent,
          rent_years: repair.rentYears,
          window_count: derivedWindowCount,
          capped_by_max: calc.cappedByMax,
        })
      } catch {
        // continue to dashboard even if save fails
      }
      router.push("/dashboard")
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
        ? "Hotovo"
        : "Pokračovat"

  const ctaDisabled = loading || (step === 2 && selected.length === 0)

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
      className="w-full rounded-xl"
      disabled={ctaDisabled}
    >
      {loading && <Loader2 className="animate-spin" />}
      {ctaLabel}
    </Button>
  )

  return (
    <div className="flex min-h-svh flex-col overflow-hidden bg-background">
      {/* ── Step 0: full-page centered layout ─────────────────── */}
      {step === 0 && (
        <div className="flex min-h-svh flex-col">
          <div
            key={step}
            className="mx-auto flex w-full max-w-lg flex-1 animate-in flex-col justify-center gap-5 px-6 py-8 duration-200 fade-in slide-in-from-bottom-3"
          >
            <div>
              <h2 className="text-xl font-semibold">{STEP_META[0].title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {STEP_META[0].desc}
              </p>
            </div>

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
                  <div className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
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
                                Math.min(50, Math.max(5, val))
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

            <div className="flex flex-col gap-3">
              {progressDots}
              {ctaButton}
            </div>
          </div>
        </div>
      )}

      {/* ── Steps 1–3: same centered layout as step 0 ─────────── */}
      {step > 0 && (
        <>
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 px-6 pt-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> Zpět
          </button>

          <div
            key={step}
            className="mx-auto flex w-full max-w-lg flex-1 animate-in flex-col gap-5 px-6 pt-3 pb-8 duration-200 fade-in slide-in-from-bottom-3"
          >
            <div>
              <h2 className="text-xl font-semibold">{STEP_META[step].title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {STEP_META[step].desc}
              </p>
            </div>

            {/* Step 1 — Energy tag */}
            {step === 1 &&
              (() => {
                const year = building?.yearBuilt ?? null
                const pts = year
                  ? calcEnergyScore(year, insulated, newWindows)
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
                        <span className="text-sm">Zateplení fasády</span>
                        <div className="flex gap-1.5">
                          {(["Ne", "Ano"] as const).map((label) => {
                            const active =
                              label === "Ano" ? insulated : !insulated
                            return (
                              <button
                                key={label}
                                onClick={() => setInsulated(label === "Ano")}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm">Okna</span>
                        <div className="flex gap-1.5">
                          {(["Původní", "Nová"] as const).map((label) => {
                            const active =
                              label === "Nová" ? newWindows : !newWindows
                            return (
                              <button
                                key={label}
                                onClick={() => setNewWindows(label === "Nová")}
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
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

            {/* Step 2 — Renovation grid with recommendation */}
            {step === 2 && (() => {
              const year = building?.yearBuilt ?? null
              const pts = year ? calcEnergyScore(year, insulated, newWindows) : null
              const g = pts != null ? energyGrade(pts) : null
              const displayGrade = energyLabel ?? g?.grade ?? null
              const { sorted: sortedRenovations, starId } = getSortedRenovations(displayGrade)
              return (
                <div className="flex flex-col gap-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {displayGrade
                      ? <>Seřazeno podle doporučení pro třídu&nbsp;<strong className="text-foreground">{displayGrade}</strong></>
                      : "Obecné doporučení — zadejte rok výstavby pro přesnější pořadí"
                    }
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {sortedRenovations.map((r) => {
                      const isSelected = selected.includes(r.id)
                      const isStar = r.id === starId
                      return (
                        <button
                          key={r.id}
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
                          className={`relative flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition-all duration-150 ${
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
                          <span className={`text-xs leading-tight font-medium ${isSelected ? "text-primary" : ""}`}>
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
                            <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary">
                              <CheckCircle2 className="size-3 text-primary-foreground" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Step 3 — Results */}
            {step === 3 && (
              <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border">
                {[
                  { label: "Celková cena opravy", value: calc.alpha },
                  {
                    label: "Cena na jednotku",
                    value: Math.round(calc.alpha / repair.numberOfUnits),
                  },
                  {
                    label: "Splácitelná částka",
                    value: calc.finalRent,
                    warn: calc.cappedByMax,
                  },
                  {
                    label: "Měsíčně / jednotka",
                    value: Math.round(calc.monthlyPerUnit),
                    highlight: true,
                  },
                ].map(({ label, value, warn, highlight }) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 text-sm ${highlight ? "bg-primary/5" : ""}`}
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span
                      className={`font-semibold tabular-nums ${highlight ? "text-primary" : ""} ${warn ? "text-amber-600 dark:text-amber-400" : ""}`}
                    >
                      {value.toLocaleString("cs-CZ")} Kč
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Progress + CTA */}
            <div className="mt-auto flex flex-col gap-3 pt-2">
              {progressDots}
              {ctaButton}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
