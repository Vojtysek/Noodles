"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import {
  FileText,
  Presentation,
  Download,
  Loader2,
  Check,
  CircleCheck,
  UserRound,
  BookOpenText,
  Sparkles,
  Building2,
  Users,
  Lightbulb,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  exportTypes,
  distributionTips,
  fmtCzkShort,
  type Persona,
  type Scenario,
  type Sentiment,
  type Scenario,
} from "@/lib/mock-data"
import { createClient } from "@/lib/supabase/client"
import { buildDynamicScenarios } from "@/lib/scenarios"
import { ARCHETYPES } from "@/lib/archetypes"
import { userScenarios } from "@/lib/scenarios"
import { createClient } from "@/lib/supabase/client"
import { PERSONA_TYPES } from "@/lib/persona-types"
import type { PersonaType } from "@/lib/persona-types"

const TYPE_ICONS: Record<string, typeof FileText> = {
  "overall-brief": FileText,
  persona: UserRound,
  "overall-detail": BookOpenText,
  presentation: Presentation,
}

export default function ExportyPage() {
  const [selectedTypeId, setSelectedTypeId] = useState(exportTypes[0].id)
  const [personaList, setPersonaList] = useState<Persona[]>([])
  const [personaId, setPersonaId] = useState<string>("")
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [scenarioId, setScenarioId] = useState<string>("all")
  const [dynamicScenarios, setDynamicScenarios] = useState<Scenario[]>(scenarios)
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  // Fetch only the logged-in user's real personas from Supabase.
  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then((rows: Array<{
        id: string; name: string; role: string; unit: string
        status: "zpracovano" | "ceka"; sentiment: Sentiment; brief: string
        structured: Persona["structured"]; persona_type: string | null
      }>) => {
        if (!Array.isArray(rows) || rows.length === 0) return
        const fromDb: Persona[] = rows.map((r) => ({
          id: r.id, name: r.name, role: r.role, unit: r.unit,
          status: r.status, sentiment: r.sentiment, brief: r.brief,
          structured: r.structured,
          personaType: r.persona_type && r.persona_type in PERSONA_TYPES
            ? (r.persona_type as PersonaType) : undefined,
        }))
        setPersonaList(fromDb)
        setPersonaId(fromDb[0].id)
      })
      .catch(() => {/* no personas available */})
  }, [])

  // Fetch the user's building plan and build their own scenario ("Váš plán").
  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("buildings")
          .select("selected_renovations")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        const renovations = (data?.selected_renovations as string[] | undefined) ?? []
        const built = userScenarios(renovations)
        setScenarios(built)
        // S jediným scénářem rovnou vyber „Váš plán" (volba „all" se nezobrazuje).
        if (built.length === 1) setScenarioId(built[0].id)
      } catch {/* leave scenarios empty */}
    })()
  }, [])

  const selectedType = exportTypes.find((t) => t.id === selectedTypeId) ?? exportTypes[0]
  const selectedPersona = personaList.find((p) => p.id === personaId)
  const selectedScenario = dynamicScenarios.find((s) => s.id === scenarioId)

  // Mock generování — pouze vizuální stav, žádný skutečný export.
  function generate() {
    setGenerating(true)
    setDone(false)
    setTimeout(() => {
      setGenerating(false)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    }, 1200)
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-primary/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/2 -z-10 size-96 rounded-full bg-emerald-500/8 blur-[120px]"
      />

      {/* Header */}
      <div
        className="anim-in"
        style={{ "--ai-y": "-20px", "--ai-dur": "0.6s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-7 bg-primary/60" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            Materiály pro sousedy
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Exporty</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          PDF a prezentace připravené pro různé situace — nástěnka, osobní jednání i schůze SVJ.
        </p>
      </div>

      {/* Context: scenario scope + stats */}
      <div
        className="anim-in flex items-center gap-3"
        style={{ "--ai-y": "28px", "--ai-dur": "0.6s", "--ai-delay": "0.15s" } as React.CSSProperties}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
          1
        </span>
        <p className="text-sm font-medium">Co exportovat</p>
      </div>
      <div
        className="anim-in rounded-2xl border bg-gradient-to-br from-primary/8 to-primary/[0.02] px-4 py-4"
        style={{ "--ai-y": "28px", "--ai-dur": "0.6s", "--ai-delay": "0.18s" } as React.CSSProperties}
      >
        {/* Segmented switcher — pouze scénář(e) přihlášeného uživatele */}
        {scenarios.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-background/70 px-4 py-4 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <Building2 className="size-4 shrink-0 text-muted-foreground/70" />
            <span>
              Zatím nemáte žádný plán. Dokončete kalkulaci budovy a váš scénář se
              tu objeví.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-xl bg-background/70 p-1 shadow-sm backdrop-blur w-full">
            {/* Porovnání všech scénářů — jen pokud jich je víc */}
            {scenarios.length > 1 && (
              <button
                type="button"
                onClick={() => setScenarioId("all")}
                aria-pressed={scenarioId === "all"}
                className={cn(
                  "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-3 text-sm font-medium transition-all duration-150",
                  scenarioId === "all"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 shrink-0" />
                  Porovnání scénářů
                </span>
                <span className={cn(
                  "text-[10px] font-normal leading-tight",
                  scenarioId === "all" ? "text-primary-foreground/70" : "text-muted-foreground/60"
                )}>
                  side-by-side přehled
                </span>
              </button>
            )}

            {scenarios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScenarioId(s.id)}
                aria-pressed={scenarioId === s.id}
                className={cn(
                  "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-3 text-sm font-medium transition-all duration-150",
                  scenarioId === s.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <span>{s.name}</span>
                <span className={cn(
                  "text-[10px] font-normal leading-tight",
                  scenarioId === s.id ? "text-primary-foreground/70" : "text-muted-foreground/60"
                )}>
                  {s.projectIds.length} {s.projectIds.length === 1 ? "projekt" : "projekty"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" />
            <span className="tabular-nums font-medium text-foreground">{personaList.length}</span>
            rezidentů v domě
          </span>
          {selectedScenario && (
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground/50">·</span>
              <span>{selectedScenario.tagline}</span>
            </span>
          )}
          {scenarioId === "all" && (
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground/50">·</span>
              <span>Oba scénáře vedle sebe — ideální pro přesvědčení nerozhodnutých</span>
            </span>
          )}
        </div>
      </div>

      {/* Export type cards — clickable, selected gets outline */}
      <div
        className="anim-in flex items-center gap-3"
        style={{ "--ai-y": "28px", "--ai-dur": "0.6s", "--ai-delay": "0.23s" } as React.CSSProperties}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
          2
        </span>
        <p className="text-sm font-medium">Pro koho dokument je</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {exportTypes.map((exp, i) => {
          const Icon = TYPE_ICONS[exp.id] ?? FileText
          const selected = exp.id === selectedTypeId
          return (
            <button
              key={exp.id}
              onClick={() => setSelectedTypeId(exp.id)}
              aria-pressed={selected}
              style={{
                "--ai-y": "24px",
                "--ai-dur": "0.5s",
                "--ai-delay": `${0.35 + i * 0.07}s`,
              } as React.CSSProperties}
              className={cn(
                "anim-in flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                selected
                  ? "scale-[1.02] border-primary/60 bg-primary/5 shadow-xl ring-3 ring-primary/15"
                  : "hover:scale-[1.02] hover:bg-muted/50 hover:shadow-lg"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    selected ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-foreground"
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
                {selected && <CircleCheck className="size-4.5 shrink-0 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium">{exp.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {exp.description}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-medium",
                    selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {exp.pages}
                </span>
                <span className="text-muted-foreground">{exp.bestFor}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Generate panel */}
      <div
        className="anim-in rounded-2xl border bg-background/60 p-4 backdrop-blur-sm"
        style={{ "--ai-y": "28px", "--ai-dur": "0.6s", "--ai-delay": "0.31s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
            3
          </span>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-medium">Vygenerovat dokument</p>
          </div>
        </div>

        {selectedType.needsPersona && (
          <div className="mt-4 space-y-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <UserRound className="size-3.5 shrink-0" />
              Pro rezidenta:
            </span>

            {/* Visual card picker — pouze vlastní personas uživatele */}
            {personaList.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-dashed bg-background/60 px-3 py-3 text-xs text-muted-foreground">
                <UserRound className="size-4 shrink-0 text-muted-foreground/70" />
                <span>
                  Zatím nemáte žádné rezidenty. Přidejte je v sekci Rezidenti a
                  pak pro ně vytvoříte materiál na míru.
                </span>
              </div>
            ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {personaList.map((p) => {
                const selected = p.id === personaId
                const imgSrc = p.personaType && p.personaType in PERSONA_TYPES
                  ? PERSONA_TYPES[p.personaType].imagePath
                  : null
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersonaId(p.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex shrink-0 flex-col items-center gap-1.5 rounded-xl border p-2 transition-all duration-150 w-[88px]",
                      selected
                        ? "border-primary/60 bg-primary/5 ring-2 ring-primary/20 shadow-md"
                        : "border-border bg-background hover:bg-muted/60 hover:shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "relative size-12 shrink-0 overflow-hidden rounded-lg",
                      selected ? "ring-2 ring-primary/40" : "ring-1 ring-border"
                    )}>
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <UserRound className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className={cn(
                      "text-center text-[10px] font-medium leading-tight",
                      selected ? "text-primary" : "text-foreground"
                    )}>
                      {p.name}
                    </p>
                  </button>
                )
              })}
            </div>
            )}

            {/* Selected persona info chip */}
            {selectedPersona && (
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2.5">
                {selectedPersona.personaType && selectedPersona.personaType in PERSONA_TYPES && (
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-primary/20 mt-0.5">
                    <Image
                      src={PERSONA_TYPES[selectedPersona.personaType].imagePath}
                      alt={selectedPersona.name}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{selectedPersona.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{selectedPersona.role}</p>
                  {selectedPersona.brief && (
                    <p className="mt-1 text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2">
                      {selectedPersona.brief}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-medium text-muted-foreground">Dokument bude obsahovat:</p>
          <div className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {selectedType.includes.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CircleCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={generate} disabled={generating} className="mt-3 w-full rounded-full shadow-lg" size="lg">
          {generating ? <Loader2 className="animate-spin" /> : done ? <Check /> : <Download />}
          {generating
            ? "Generuji…"
            : done
              ? "Připraveno ke stažení"
              : selectedType.needsPersona && selectedPersona
                ? `${selectedType.cta} — ${selectedPersona.name}`
                : selectedType.cta}
        </Button>
      </div>

      {/* Distribution tips */}
      <div
        className="anim-in rounded-2xl border bg-gradient-to-br from-primary/8 to-primary/[0.02] p-4"
        style={{ "--ai-y": "28px", "--ai-dur": "0.6s", "--ai-delay": "0.39s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-primary" />
          <p className="text-sm font-medium text-primary">Tipy k distribuci</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {distributionTips.map((tip) => (
            <div key={tip.title}>
              <p className="text-sm font-medium">{tip.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{tip.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export history */}
      <div
        className="anim-in"
        style={{ "--ai-y": "28px", "--ai-dur": "0.6s", "--ai-delay": "0.47s" } as React.CSSProperties}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Poslední exporty
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-background/60 px-6 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Download className="size-5" />
          </div>
          <p className="text-sm font-medium">Zatím jste nic nevyexportovali</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Až vygenerujete dokument výše, najdete ho tady připravený ke stažení.
          </p>
        </div>
      </div>
    </div>
  )
}
