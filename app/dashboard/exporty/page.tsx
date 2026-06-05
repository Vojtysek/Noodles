"use client"

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
  ChartPie,
  Lightbulb,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  exportTypes,
  exportHistory,
  distributionTips,
  personas as mockPersonas,
  projects,
  fmtCzkShort,
  type Persona,
  type Sentiment,
} from "@/lib/mock-data"
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
  const [personaList, setPersonaList] = useState<Persona[]>(mockPersonas)
  const [personaId, setPersonaId] = useState(mockPersonas[0].id)
  const [projectId, setProjectId] = useState<string>("all")
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  // Fetch real personas from Supabase, merge with mock fallback
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
        setPersonaList((prev) => {
          const dbIds = new Set(fromDb.map((p) => p.id))
          return [...fromDb, ...prev.filter((p) => !dbIds.has(p.id))]
        })
        setPersonaId(fromDb[0].id)
      })
      .catch(() => {/* keep mock personas on error */})
  }, [])

  const selectedType = exportTypes.find((t) => t.id === selectedTypeId) ?? exportTypes[0]
  const selectedPersona = personaList.find((p) => p.id === personaId)
  const scopedProjects = projectId === "all" ? projects : projects.filter((p) => p.id === projectId)
  const totalBudget = scopedProjects.reduce((sum, p) => sum + p.budget, 0)

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
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6">
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

      {/* Context: project scope + stats */}
      <div
        className="anim-in flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-gradient-to-br from-primary/8 to-primary/[0.02] px-4 py-3"
        style={{ "--ai-y": "28px", "--ai-dur": "0.6s", "--ai-delay": "0.15s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
            1
          </span>
          <p className="text-sm font-medium">Co exportovat</p>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">Všechny projekty</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-background/80 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="size-3.5" />
            <span className="font-medium text-foreground tabular-nums">
              {scopedProjects.length}
            </span>
            {scopedProjects.length === 1 ? "projekt" : "projekty"}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5" />
            <span className="font-medium text-foreground tabular-nums">{personaList.length}</span>
            rezidentů
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <ChartPie className="size-3.5" />
            <span className="font-medium text-foreground tabular-nums">
              {fmtCzkShort(totalBudget)}
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-600 rounded px-1 py-0.5 font-medium">mock</span>
          </span>
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="size-3.5" />
              Pro rezidenta:
            </span>
            <select
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {personaList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.role}
                </option>
              ))}
            </select>
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
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Poslední exporty
            </p>
            <span className="text-[10px] bg-amber-500/10 text-amber-600 rounded px-1.5 py-0.5 font-medium">ukázková data</span>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Název</th>
                <th className="px-4 py-2.5 font-medium">Typ</th>
                <th className="px-4 py-2.5 font-medium">Projekt</th>
                <th className="px-4 py-2.5 font-medium">Vytvořeno</th>
                <th className="px-4 py-2.5 text-right font-medium">Velikost</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {exportHistory.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {row.format === "PPTX" ? (
                        <Presentation className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="font-medium">{row.name}</span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          row.format === "PPTX"
                            ? "bg-chart-1/20 text-chart-3"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {row.format}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.project}</td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                    {new Date(row.createdAt).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                    {row.size}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button variant="ghost" size="icon-sm" aria-label={`Stáhnout ${row.name}`}>
                      <Download />
                    </Button>
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
