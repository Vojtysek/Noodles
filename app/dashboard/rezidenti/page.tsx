"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import {
  Plus,
  Sparkles,
  Clock,
  User,
  MessageSquareWarning,
  Heart,
  Ban,
  Lightbulb,
  X,
  ThumbsUp,
  ThumbsDown,
  CircleHelp,
  Pencil,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  personas as initialPersonas,
  projects,
  type Persona,
  type Sentiment,
  type StrategyPoint,
} from "@/lib/mock-data"
import { PersonaType, PERSONA_TYPES } from "@/lib/persona-types"

const SENTIMENTS: Record<
  Sentiment,
  {
    label: string
    icon: typeof ThumbsUp
    badge: string
    tintText: string
    tintBg: string
    dot: string
  }
> = {
  podporuje: {
    label: "Podporuje",
    icon: ThumbsUp,
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    tintText: "text-emerald-600 dark:text-emerald-400",
    tintBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  vaha: {
    label: "Váhá",
    icon: CircleHelp,
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    tintText: "text-amber-600 dark:text-amber-400",
    tintBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  proti: {
    label: "Proti",
    icon: ThumbsDown,
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    tintText: "text-rose-600 dark:text-rose-400",
    tintBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function RezidentiPage() {
  const [personaList, setPersonaList] = useState<Persona[]>(initialPersonas)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newBrief, setNewBrief] = useState("")
  const [adding, setAdding] = useState(false)
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonas[0].id)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0].id)
  const [editingBrief, setEditingBrief] = useState(false)
  const [draftBrief, setDraftBrief] = useState("")
  const [regenerating, setRegenerating] = useState(false)
  const [generatedStrategies, setGeneratedStrategies] = useState<Record<string, StrategyPoint[]>>({})
  const [generatingStrategy, setGeneratingStrategy] = useState(false)
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | null>(null)
  const [selectedPersonaType, setSelectedPersonaType] = useState<PersonaType | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then((rows: Array<{
        id: string
        name: string
        role: string
        unit: string
        status: "zpracovano" | "ceka"
        sentiment: Sentiment
        brief: string
        structured: Persona["structured"]
        persona_type: string | null
      }>) => {
        if (!Array.isArray(rows) || rows.length === 0) return
        const fromDb: Persona[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          role: r.role,
          unit: r.unit,
          status: r.status,
          sentiment: r.sentiment,
          brief: r.brief,
          structured: r.structured,
          personaType: r.persona_type && r.persona_type in PERSONA_TYPES
            ? (r.persona_type as PersonaType)
            : undefined,
        }))
        setPersonaList((prev) => {
          const dbIds = new Set(fromDb.map((p) => p.id))
          return [...fromDb, ...prev.filter((p) => !dbIds.has(p.id))]
        })
        setSelectedPersonaId(fromDb[0].id)
      })
      .catch(() => {/* keep mock data on error */})
      .finally(() => setLoadingPersonas(false))
  }, [])

  useEffect(() => {
    setEditingBrief(false)
    setDraftBrief("")
  }, [selectedPersonaId])

  useEffect(() => {
    setGeneratedStrategies({})
    if (!selectedPersonaId) return
    const controller = new AbortController()
    fetch(`/api/personas/${selectedPersonaId}/strategies`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then((data: Record<string, StrategyPoint[]>) => setGeneratedStrategies(data))
      .catch((err: unknown) => { if ((err as Error).name !== "AbortError") console.error(err) })
    return () => controller.abort()
  }, [selectedPersonaId])

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.from("[data-rz-header]", { y: -20, autoAlpha: 0, duration: 0.6 }, 0)
        .from("[data-rz-reveal]", { y: 32, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, 0.2)
    },
    { scope: rootRef }
  )

  const selectedPersona = personaList.find((p) => p.id === selectedPersonaId)

  function resetForm() {
    setNewName("")
    setNewBrief("")
    setSelectedPersonaType(null)
    setShowForm(false)
  }

  async function addPersona() {
    const name = newName.trim()
    const brief = newBrief.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brief: brief || undefined, personaType: selectedPersonaType ?? undefined }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as {
        id: string
        name: string
        role: string
        unit: string
        status: "zpracovano" | "ceka"
        sentiment: Sentiment
        brief: string
        structured: Persona["structured"]
        persona_type: string | null
      }
      const persona: Persona = {
        id: data.id,
        name: data.name,
        role: data.role,
        unit: data.unit,
        status: data.status,
        sentiment: data.sentiment,
        brief: data.brief,
        structured: data.structured,
        personaType: data.persona_type && data.persona_type in PERSONA_TYPES
          ? (data.persona_type as PersonaType)
          : undefined,
      }
      setPersonaList((prev) => [persona, ...prev])
      setSelectedPersonaId(persona.id)
      resetForm()
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  async function generateStrategyForPersona() {
    if (!selectedPersona || generatingStrategy) return
    setGeneratingStrategy(true)
    try {
      const res = await fetch(`/api/personas/${selectedPersona.id}/strategies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: selectedProjectId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const strategies = await res.json() as StrategyPoint[]
      setGeneratedStrategies((prev) => ({ ...prev, [selectedProjectId]: strategies }))
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingStrategy(false)
    }
  }

  async function updateBrief() {
    if (!selectedPersona || regenerating) return
    const brief = draftBrief.trim()
    if (!brief || brief === selectedPersona.brief) {
      setEditingBrief(false)
      return
    }
    setRegenerating(true)
    try {
      const res = await fetch(`/api/personas/${selectedPersona.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as {
        id: string
        name: string
        role: string
        unit: string
        status: "zpracovano" | "ceka"
        sentiment: Sentiment
        brief: string
        structured: Persona["structured"]
      }
      setPersonaList((prev) =>
        prev.map((p) =>
          p.id === data.id
            ? { ...p, brief: data.brief, structured: data.structured, sentiment: data.sentiment, status: data.status }
            : p
        )
      )
      setEditingBrief(false)
    } catch (err) {
      console.error(err)
    } finally {
      setRegenerating(false)
    }
  }

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

      {/* Header */}
      <div data-rz-header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-7 bg-emerald-500/70" />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
              Profily sousedů
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Rezidenti</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Postoje a profily rezidentů — základ pro přípravu komunikace a exportů.
          </p>
        </div>
        <Button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? <X /> : <Plus />}
          {showForm ? "Zavřít" : "Nový rezident"}
        </Button>
      </div>

      {/* New persona form — full-page takeover */}
      {showForm && (
        <div
          data-rz-reveal
          className="animate-in fade-in duration-200 rounded-2xl border bg-background/60 p-6 backdrop-blur-sm"
        >
          <p className="text-sm font-medium">Popište rezidenta vlastními slovy</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Osobnost a postoj rezidenta — AI agent text automaticky vyhodnotí.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Jméno rezidenta, např. Pan Černý"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              autoFocus
            />
            {/* Persona type selection */}
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PERSONA_TYPES) as [PersonaType, typeof PERSONA_TYPES[PersonaType]][]).map(([key, pt]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPersonaType(selectedPersonaType === key ? null : key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-xs transition-all w-32",
                    selectedPersonaType === key
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-background text-muted-foreground hover:border-emerald-500/50"
                  )}
                >
                  <img src={pt.imagePath} alt={pt.name} className="h-32 w-32 rounded-lg object-cover" />
                  <span className="text-center leading-tight">{pt.name}</span>
                </button>
              ))}
            </div>
            <textarea
              value={newBrief}
              onChange={(e) => setNewBrief(e.target.value)}
              rows={6}
              placeholder="Např. Pan Černý je čtyřicátník, pracuje z domova a vadí mu hlavně hluk. Rekonstrukci podporuje, ale odmítá cokoliv, co by trvalo déle než tři měsíce…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm} disabled={adding}>
                Zrušit
              </Button>
              <Button onClick={addPersona} disabled={!newName.trim() || adding}>
                <Sparkles className={adding ? "animate-spin" : ""} />
                {adding ? "Analyzuji…" : "Uložit personu"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resident list — hidden while form is open */}
      {!showForm && (
        <>
          {/* Sentiment filter */}
          <div data-rz-reveal className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Postoj
            </span>
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
              <button
                onClick={() => setSentimentFilter(null)}
                aria-pressed={sentimentFilter === null}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                  sentimentFilter === null
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Všichni ({personaList.length})
              </button>
              {(["podporuje", "vaha", "proti"] as const).map((sentiment) => {
                const count = personaList.filter((p) => p.sentiment === sentiment).length
                const cfg = SENTIMENTS[sentiment]
                const active = sentimentFilter === sentiment
                return (
                  <button
                    key={sentiment}
                    onClick={() => setSentimentFilter(sentiment)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "bg-background text-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("size-2 shrink-0 rounded-full", cfg.dot)} />
                    {cfg.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resident carousel */}
          <div data-rz-reveal className="-mx-4 flex gap-4 overflow-x-auto px-4 pt-4 pb-8">
            {loadingPersonas
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 w-52 shrink-0 animate-pulse rounded-2xl border bg-muted/40"
                  />
                ))
              : personaList
                  .filter((p) => !sentimentFilter || p.sentiment === sentimentFilter)
                  .map((persona) => {
                  const cfg = SENTIMENTS[persona.sentiment]
                  const selected = persona.id === selectedPersonaId
                  const SentimentIcon = cfg.icon
                  return (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersonaId(persona.id)}
                      className={cn(
                        "relative flex h-44 w-52 shrink-0 flex-col gap-3 rounded-2xl border bg-background/60 p-5 text-left backdrop-blur-sm transition-all duration-200",
                        selected
                          ? "border-foreground/20 shadow-lg scale-[1.02]"
                          : "hover:shadow-md hover:scale-[1.01] opacity-90 hover:opacity-100"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-11 items-center justify-center rounded-full text-sm font-bold",
                          cfg.tintBg
                        )}
                      >
                        {initials(persona.name)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{persona.name}</p>
                      </div>
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.tintText)}>
                        <span className={cn("size-1.5 shrink-0 rounded-full", cfg.dot)} />
                        <SentimentIcon className="size-3.5" />
                        {cfg.label}
                      </div>
                    </button>
                  )
                })}
          </div>

          {/* Detail */}
          {selectedPersona && (
        <div
          data-rz-reveal
          className="relative overflow-hidden rounded-2xl border bg-background/60 p-5 backdrop-blur-sm sm:p-6 lg:rounded-br-[3rem]"
        >
          {regenerating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-background/70 text-sm text-muted-foreground backdrop-blur-sm">
              <Sparkles className="size-4 animate-spin" />
              Přegenerovávám charakteristiky…
            </div>
          )}

          <div className="flex flex-col gap-6">
            {/* Name + status row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-semibold">{selectedPersona.name}</p>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                    SENTIMENTS[selectedPersona.sentiment].badge
                  )}
                >
                  {(() => {
                    const Icon = SENTIMENTS[selectedPersona.sentiment].icon
                    return <Icon className="size-3" />
                  })()}
                  {SENTIMENTS[selectedPersona.sentiment].label}
                </span>
                {selectedPersona.personaType && (
                  <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <img
                      src={PERSONA_TYPES[selectedPersona.personaType].imagePath}
                      alt={PERSONA_TYPES[selectedPersona.personaType].name}
                      className="size-3 rounded-sm object-cover"
                    />
                    {PERSONA_TYPES[selectedPersona.personaType].name}
                  </span>
                )}
              </div>
            </div>

            {/* Brief */}
            {editingBrief ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={draftBrief}
                  onChange={(e) => setDraftBrief(e.target.value)}
                  rows={5}
                  autoFocus
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingBrief(false)} disabled={regenerating}>
                    Zrušit
                  </Button>
                  <Button size="sm" onClick={updateBrief} disabled={!draftBrief.trim() || regenerating}>
                    <Sparkles className={regenerating ? "animate-spin" : ""} />
                    {regenerating ? "Regeneruji…" : "Uložit a přegenerovat"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group/brief relative">
                <p className="text-sm leading-relaxed text-muted-foreground">{selectedPersona.brief}</p>
                <button
                  onClick={() => {
                    setDraftBrief(selectedPersona.brief)
                    setEditingBrief(true)
                  }}
                  className="absolute -top-1 -right-1 hidden rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground group-hover/brief:flex focus-visible:flex"
                  title="Upravit popis"
                  aria-label="Upravit popis"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            )}

            {/* Structured output */}
            {selectedPersona.structured ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { icon: User, title: "Charakteristika", items: selectedPersona.structured.traits },
                  { icon: MessageSquareWarning, title: "Námitky", items: selectedPersona.structured.objections },
                  { icon: Heart, title: "Motivace", items: selectedPersona.structured.motivations },
                  { icon: Ban, title: "Aktuálně odmítá", items: selectedPersona.structured.rejects },
                ].map((block) => (
                  <div key={block.title} className="rounded-xl border bg-muted/20 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <block.icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-medium">{block.title}</p>
                    </div>
                    <ul className="mt-2 flex flex-col gap-1">
                      {block.items.map((item) => (
                        <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" />
                Strukturovaný výstup zatím není k dispozici — brief čeká na zpracování AI agentem.
              </div>
            )}

            {/* Strategy */}
            <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">Argumentační strategie</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={generateStrategyForPersona}
                    disabled={!selectedPersona.structured || generatingStrategy}
                  >
                    <Sparkles className={generatingStrategy ? "animate-spin" : ""} />
                    {generatingStrategy ? "Generuji…" : "Vygenerovat strategie"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {generatedStrategies[selectedProjectId] ? (
                  generatedStrategies[selectedProjectId].map((point, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border bg-background px-4 py-3">
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{point.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{point.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-3 opacity-60">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Vyberte projekt výše a vygenerujte argumentaci.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          )}
        </>
      )}
    </div>
  )
}
