"use client"

import { useEffect, useState } from "react"
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
    card: string
    cardMuted: string
    cardAvatar: string
  }
> = {
  podporuje: {
    label: "Podporuje",
    icon: ThumbsUp,
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    card: "bg-emerald-600",
    cardMuted: "text-white/80",
    cardAvatar: "bg-white/20",
  },
  vaha: {
    label: "Váhá",
    icon: CircleHelp,
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    card: "bg-amber-500/75",
    cardMuted: "text-white/80",
    cardAvatar: "bg-white/20",
  },
  proti: {
    label: "Proti",
    icon: ThumbsDown,
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    card: "bg-rose-500/75",
    cardMuted: "text-white/80",
    cardAvatar: "bg-white/20",
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold">Rezidenti</h1>
        <Button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? <X /> : <Plus />}
          {showForm ? "Zavřít" : "Nový rezident"}
        </Button>
      </div>

      {/* New persona form — full-page takeover */}
      {showForm && (
        <div className="animate-in fade-in duration-200 rounded-xl border bg-muted/30 p-6">
          <p className="text-sm font-medium">Popište rezidenta vlastními slovy</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kdo to je, jak se chová, co mu vadí, jaké má námitky proti rekonstrukcím a co momentálně
            odmítá. Text později zpracuje AI agent do strukturované podoby.
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
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
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
              placeholder="Např. Pan Černý je čtyřicátník, pracuje z domova a vadí mu hlavně hluk. Rekonstrukce podporuje, ale odmítá cokoliv, co by trvalo déle než tři měsíce…"
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
          {/* Sentiment filter badges */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSentimentFilter(null)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                sentimentFilter === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Všichni ({personaList.length})
            </button>
            {(["podporuje", "vaha", "proti"] as const).map((sentiment) => {
              const count = personaList.filter((p) => p.sentiment === sentiment).length
              const cfg = SENTIMENTS[sentiment]
              return (
                <button
                  key={sentiment}
                  onClick={() => setSentimentFilter(sentiment)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all",
                    sentimentFilter === sentiment
                      ? cn(cfg.card, "text-white shadow-md")
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cfg.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Resident carousel */}
          <div className="-mx-1 flex gap-4 overflow-x-auto px-4 pt-4 pb-8">
            {loadingPersonas
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 w-52 shrink-0 animate-pulse rounded-2xl bg-muted"
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
                        "relative flex h-44 w-52 shrink-0 flex-col gap-3 rounded-2xl p-5 text-left transition-all duration-200",
                        cfg.card,
                        selected
                          ? "scale-[1.04] shadow-xl ring-4 ring-white/70"
                          : "hover:scale-[1.02] hover:shadow-lg opacity-85 hover:opacity-100"
                      )}
                    >
                      {persona.status === "ceka" && (
                        <Clock className={cn("absolute top-3 right-3 size-3.5", cfg.cardMuted)} />
                      )}
                      <div
                        className={cn(
                          "flex size-12 items-center justify-center rounded-full text-base font-bold text-white",
                          cfg.cardAvatar
                        )}
                      >
                        {initials(persona.name)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{persona.name}</p>
                        {persona.personaType && (
                          <p className={cn("text-[10px] mt-0.5 opacity-70", cfg.cardMuted)}>
                            {PERSONA_TYPES[persona.personaType].name}
                          </p>
                        )}
                      </div>
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.cardMuted)}>
                        <SentimentIcon className="size-3.5" />
                        {cfg.label}
                      </div>
                    </button>
                  )
                })}
          </div>

          {/* Detail */}
          {selectedPersona && (
        <div className="relative flex flex-col gap-6 rounded-xl border bg-muted/30 p-6">
          {regenerating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-xl bg-background/70 text-sm text-muted-foreground backdrop-blur-sm">
              <Sparkles className="size-4 animate-spin" />
              Přegenerovávám charakteristiky…
            </div>
          )}

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
                <div key={block.title} className="rounded-xl border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <block.icon className="size-3.5 text-primary" />
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
          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">Argumentační strategie</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Personalizovaná argumentace pro {selectedPersona.name}
                </p>
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
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary tabular-nums">
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
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Vyberte projekt a klikněte na „Vygenerovat strategie" pro argumentaci na míru.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
          )}
        </>
      )}
    </div>
  )
}
