"use client"

import { useEffect, useMemo } from "react"
import { ArrowRight, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtCzk, fmtCzkShort, projects } from "@/lib/mock-data"
import { scenarioEnergySavingPct, REFERENCE_GEOMETRY } from "@/app/dashboard/financials/calc"

type BuildingData = {
  selected_renovations: string[]
  total_cost: number
  address?: string | null
}

const RENOVATION_LABEL_TO_PROJECT: Record<string, string> = {
  "Okna": "okna",
  "Zateplení fasády": "fasada",
  "Zateplení střechy": "strecha",
  "Venkovní žaluzie": "zaluzie",
  "Tepelné čerpadlo": "tepelne-cerpadlo",
  "Vytápění": "vytapeni",
  "Rekuperace": "rekuperace",
  "Fotovoltaika": "fotovoltaika",
}

const RENOVATION_BENEFITS: Record<string, string[]> = {
  "Okna": ["Nižší hlučnost", "Lepší těsnost"],
  "Zateplení fasády": ["Tepelný komfort", "Moderní vzhled"],
  "Zateplení střechy": ["Tepelný komfort", "Ochrana konstrukce"],
  "Venkovní žaluzie": ["Letní pohoda", "Bez přehřívání"],
  "Tepelné čerpadlo": ["Energetická nezávislost", "Nízkouhlíkové vytápění"],
  "Vytápění": ["Spolehlivost vytápění", "Moderní rozvody"],
  "Rekuperace": ["Čistý vzduch", "Zdravé prostředí"],
  "Fotovoltaika": ["Vlastní elektřina", "Snížení emisí CO₂"],
}

function getBenefits(selectedRenovations: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const ren of selectedRenovations) {
    for (const b of RENOVATION_BENEFITS[ren] ?? []) {
      if (!seen.has(b)) {
        seen.add(b)
        result.push(b)
      }
    }
  }
  const universal = "Vyšší hodnota nemovitosti"
  if (!seen.has(universal)) result.push(universal)
  return result
}

const CONSULTATION_COST = 25_000

function buildStats(data: BuildingData) {
  const selectedIds = data.selected_renovations
    .map((label) => RENOVATION_LABEL_TO_PROJECT[label])
    .filter((id): id is string => Boolean(id))

  const selected = selectedIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)

  const mockTotal = selected.reduce((sum, p) => sum + p.budget, 0)
  const scale = mockTotal > 0 ? data.total_cost / mockTotal : 1

  const savingsPerYear = Math.round(
    selected.reduce((sum, p) => sum + p.savingsPerYear * scale, 0)
  )
  const fundIncreasePerFlat = Math.round(
    selected.reduce((sum, p) => sum + p.fundIncreasePerFlat * scale, 0)
  )
  const energySavingPct = scenarioEnergySavingPct(selectedIds, REFERENCE_GEOMETRY)

  const docsCost = Math.round((data.total_cost * 0.03) / 10_000) * 10_000
  const totalCost = CONSULTATION_COST + docsCost + data.total_cost

  return { savingsPerYear, fundIncreasePerFlat, energySavingPct, totalCost }
}

export function ScenarioSplash({
  onClose,
  onContinue,
  buildingData,
}: {
  onClose: () => void
  onContinue: () => void
  buildingData?: BuildingData
}) {
  const stats = useMemo(
    () => (buildingData ? buildStats(buildingData) : null),
    [buildingData]
  )

  const benefits = useMemo(
    () => getBenefits(buildingData?.selected_renovations ?? []),
    [buildingData]
  )

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  const statTiles = stats
    ? [
        {
          label: "Dům ušetří ročně",
          value: fmtCzkShort(stats.savingsPerYear),
          sub: "na energiích a provozu",
        },
        {
          label: "Úspora energií",
          value: `${stats.energySavingPct} %`,
          sub: "méně spotřeby oproti dnes",
        },
        {
          label: "Navíc / byt / měs",
          value: `+${fmtCzk(stats.fundIncreasePerFlat)}`,
          sub: "příspěvek do fondu oprav",
        },
        {
          label: "Celková investice",
          value: fmtCzkShort(stats.totalCost),
          sub: "vč. konzultace a projektu",
        },
      ]
    : []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Výsledky kalkulace rekonstrukce"
      className="animate-in fade-in fixed inset-0 z-50 overflow-y-auto bg-background duration-300"
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 size-[70%] rounded-full bg-blue-500/8 blur-[120px]" />
        <div className="absolute -right-1/4 -bottom-1/4 size-[70%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <button
        onClick={onClose}
        aria-label="Zavřít a prozkoumat aplikaci"
        className="fixed top-5 right-5 z-20 flex size-10 items-center justify-center rounded-full border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-foreground sm:top-6 sm:right-6"
      >
        <X className="size-4" />
      </button>

      <div className="relative z-10 mx-auto flex min-h-svh max-w-lg flex-col justify-center px-5 py-16 sm:py-20">
        {/* Header */}
        <div
          className="animate-in fade-in slide-in-from-top-4 fill-mode-both text-center duration-500"
          style={{ animationDelay: "100ms" }}
        >
          {buildingData?.address && (
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              {buildingData.address}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Máme to spočítané.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tady jsou čísla za renovace, které jste vybrali.
          </p>
        </div>

        {/* Stats grid */}
        {statTiles.length > 0 && (
          <div
            className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both mt-8 grid grid-cols-2 gap-3 duration-500 sm:gap-4"
            style={{ animationDelay: "250ms" }}
          >
            {statTiles.map((tile) => (
              <div
                key={tile.label}
                className="rounded-2xl border bg-card p-4 sm:p-5"
              >
                <p className="text-xs text-muted-foreground">{tile.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-blue-600 tabular-nums sm:text-3xl dark:text-blue-400">
                  {tile.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{tile.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Benefit chips */}
        {benefits.length > 0 && (
          <div
            className="animate-in fade-in fill-mode-both mt-6 duration-500"
            style={{ animationDelay: "400ms" }}
          >
            <p className="mb-3 text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
              Co renovace přinesou
            </p>
            <div className="flex flex-wrap gap-2">
              {benefits.map((b) => (
                <span
                  key={b}
                  className="rounded-full border bg-muted/60 px-4 py-2 text-sm font-medium text-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both mt-8 flex flex-col gap-3 duration-500"
          style={{ animationDelay: "500ms" }}
        >
          <button
            onClick={onContinue}
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400"
          >
            Vytvořit účet a pokračovat
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
