"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Building2, Zap, Calculator, Shield, ArrowRight, Loader2 } from "lucide-react"

const BASE = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/MapServer"

const zpVyuziti: Record<number, string> = {
  1: "Průmyslový objekt", 2: "Zemědělská usedlost", 3: "Objekt k bydlení",
  5: "Bytový dům", 6: "Rodinný dům", 7: "Rekreační objekt", 8: "Obchod",
  9: "Administrativa", 11: "Doprava", 12: "Garáž", 13: "Kultura / výzkum",
  14: "Škola", 15: "Zdravotnické zařízení", 16: "Ubytování", 18: "Jiný nebytový",
  40: "Rozestavěná budova", 99: "Není uvedeno",
}
const zpVytapeni: Record<number, string> = {
  1: "Centrální domovní", 2: "Centrální dálkové", 3: "Lokální (kamna)",
  4: "Dálkové (teplovod)", 5: "Elektrické", 6: "Tepelné čerpadlo",
  7: "Solární systém", 8: "Lokální (kotel)", 9: "Nezjištěno", 10: "Jiné",
}
const druhKonstr: Record<number, string> = {
  1: "Cihly / tvárnice", 2: "Kámen", 3: "Kámen a cihly", 4: "Beton / železobeton",
  5: "Kov / ocel", 6: "Dřevo", 7: "Panely prefabrikované", 8: "Smíšené",
  9: "Jiné", 10: "Nezjištěno",
}

function fmt(val: number | null | undefined, map: Record<number, string>) {
  return val != null && map[val] ? map[val] : val != null ? String(val) : "—"
}

type BuildingData = {
  address: string
  score: number
  so: Record<string, number | null> | null
}

const TODO_ITEMS = [
  {
    icon: Calculator,
    title: "Odhad rekonstrukčních nákladů",
    desc: "Na základě zastavěné/podlahové plochy a stáří stavby spočítat orientační náklady na rekonstrukci.",
    tag: "Plánováno",
  },
  {
    icon: Zap,
    title: "Energetická kalkulačka",
    desc: "Porovnat způsob vytápění s moderními alternativami a odhadnout roční úspory.",
    tag: "Plánováno",
  },
  {
    icon: Shield,
    title: "Pojistná hodnota budovy",
    desc: "Odhadnout reprodukční hodnotu stavby pro účely pojištění nemovitosti.",
    tag: "Plánováno",
  },
  {
    icon: Building2,
    title: "Plán renovací",
    desc: "Přiřadit adresu k projektům v Renovations a sledovat průběh oprav.",
    tag: "Plánováno",
  },
]

export default function CalculatorPage() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BuildingData | null>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (val.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return }
    suggestTimer.current = setTimeout(() => fetchSuggest(val.trim()), 250)
  }

  async function fetchSuggest(q: string) {
    try {
      const url = `${BASE}/exts/GeocodeSOE/suggest?text=${encodeURIComponent(q)}&maxSuggestions=6&f=json`
      const r = await fetch(url)
      const d = await r.json()
      const items: string[] = (d.suggestions || []).map((s: { text: string }) => s.text)
      setSuggestions(items)
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

  async function doSearch(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim()
    if (!q) return
    setShowSuggestions(false)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const candidateUrl = `${BASE}/exts/GeocodeSOE/findAddressCandidates?SingleLine=${encodeURIComponent(q)}&outFields=*&maxLocations=1&f=json`
      const cr = await fetch(candidateUrl)
      const cd = await cr.json()
      const candidates = cd.candidates || []
      if (!candidates.length) {
        setError("Adresa nenalezena. Zkuste upřesnit.")
        return
      }
      const best = candidates[0]
      const { x, y } = best.location
      const geom = `${x},${y}`
      const soUrl = `${BASE}/3/query?geometry=${encodeURIComponent(geom)}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&inSR=102067&outFields=*&f=json&distance=5&units=esriSRUnit_Meter`
      const soRes = await fetch(soUrl).then((r) => r.json())
      const so = soRes.features?.[0]?.attributes ?? null
      setResult({
        address: best.attributes?.Match_addr || best.address || q,
        score: best.score ? Math.round(best.score) : 0,
        so,
      })
    } catch (e) {
      setError("Chyba při načítání dat: " + (e instanceof Error ? e.message : "neznámá chyba"))
    } finally {
      setLoading(false)
    }
  }

  const so = result?.so

  return (
    <div className="flex min-h-svh flex-col p-6">
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Kalkulačka nemovitostí</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vyhledej adresu a získej data z RÚIAN ČÚZK
          </p>
        </div>

        {/* Search */}
        <div ref={wrapperRef} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") doSearch() }}
                placeholder="Např. Václavské náměstí 1, Praha"
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-md">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => selectSuggestion(s)}
                      className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                    >
                      <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => doSearch()} disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
              Vyhledat
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-6">
            {/* Address card */}
            <div className="rounded-lg border px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{result.address}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Zdroj: RÚIAN ČÚZK</p>
                </div>
                {result.score > 0 && (
                  <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {result.score} %
                  </span>
                )}
              </div>
            </div>

            {/* Building metrics */}
            {so ? (
              <>
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Stavební objekt
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { label: "Zastavěná plocha", value: so.zastavenaplacha != null ? so.zastavenaplacha : so.zastavenaplocha, unit: "m²" },
                      { label: "Podlahová plocha", value: so.podlahovaplocha, unit: "m²" },
                      { label: "Obestavěný prostor", value: so.obestavenyprostor, unit: "m³" },
                      { label: "Počet podlaží", value: so.pocetpodlazi, unit: "" },
                      { label: "Počet bytů", value: so.pocetbytu, unit: "" },
                      { label: "Rok dokončení", value: so.dokonceni ? new Date(so.dokonceni).getFullYear() : null, unit: "" },
                    ]
                      .filter((m) => m.value != null && Number(m.value) > 0)
                      .map((m) => (
                        <div key={m.label} className="rounded-lg border bg-muted/40 px-3 py-2.5">
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                          <p className="mt-0.5 text-lg font-medium tabular-nums">
                            {Number(m.value).toLocaleString("cs-CZ")}
                            {m.unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{m.unit}</span>}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Technické vybavení
                  </p>
                  <div className="flex flex-col divide-y divide-border rounded-lg border">
                    {[
                      { label: "Způsob využití", value: fmt(so.zpusobvyuzitikod as number, zpVyuziti) },
                      { label: "Způsob vytápění", value: fmt(so.zpusobvytapenikod as number, zpVytapeni) },
                      { label: "Nosná konstrukce", value: fmt(so.druhkonstrukcekod as number, druhKonstr) },
                    ]
                      .filter((r) => r.value && r.value !== "—")
                      .map((r) => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="font-medium">{r.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Detail stavebního objektu nebyl nalezen pro tuto přesnou polohu.
              </p>
            )}
          </div>
        )}

        {/* TODO features */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Co s daty budeš moct dělat
          </p>
          <div className="flex flex-col gap-2">
            {TODO_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-3 opacity-60"
              >
                <item.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
