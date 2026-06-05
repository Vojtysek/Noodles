"use client"

import { useEffect, useMemo, useState } from "react"
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
  Search,
  ThumbsUp,
  ThumbsDown,
  CircleHelp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  personas as initialPersonas,
  projects,
  getStrategy,
  type Persona,
  type Sentiment,
} from "@/lib/mock-data"

// Jemné barevné odlišení postoje rezidenta k rekonstrukcím.
const SENTIMENTS: Record<
  Sentiment,
  {
    label: string
    icon: typeof ThumbsUp
    dot: string
    text: string
    badge: string
    activeCard: string
  }
> = {
  podporuje: {
    label: "Podporuje",
    icon: ThumbsUp,
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    activeCard: "border-emerald-500/40 bg-emerald-500/5",
  },
  vaha: {
    label: "Váhá",
    icon: CircleHelp,
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    activeCard: "border-amber-500/40 bg-amber-500/5",
  },
  proti: {
    label: "Proti",
    icon: ThumbsDown,
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    activeCard: "border-rose-500/40 bg-rose-500/5",
  },
}

const SENTIMENT_ORDER: Sentiment[] = ["proti", "vaha", "podporuje"]

export default function RezidentiPage() {
  const [personaList, setPersonaList] = useState<Persona[]>(initialPersonas)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newBrief, setNewBrief] = useState("")
  const [adding, setAdding] = useState(false)
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [search, setSearch] = useState("")

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
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | "all">("all")
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonas[0].id)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0].id)

  const selectedPersona = personaList.find((p) => p.id === selectedPersonaId)
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return personaList.filter((p) => {
      if (sentimentFilter !== "all" && p.sentiment !== sentimentFilter) return false
      if (!q) return true
      return [p.name, p.role, p.unit, p.brief].some((field) => field.toLowerCase().includes(q))
    })
  }, [personaList, search, sentimentFilter])

  const grouped = SENTIMENT_ORDER.map((sentiment) => ({
    sentiment,
    items: filtered.filter((p) => p.sentiment === sentiment),
  })).filter((g) => g.items.length > 0)

  const counts = SENTIMENT_ORDER.map((sentiment) => ({
    sentiment,
    count: personaList.filter((p) => p.sentiment === sentiment).length,
  }))

  async function addPersona() {
    const name = newName.trim()
    const brief = newBrief.trim()
    if (!name || !brief || adding) return

    setAdding(true)
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brief }),
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
      const persona: Persona = {
        id: data.id,
        name: data.name,
        role: data.role,
        unit: data.unit,
        status: data.status,
        sentiment: data.sentiment,
        brief: data.brief,
        structured: data.structured,
      }
      setPersonaList((prev) => [persona, ...prev])
      setSelectedPersonaId(persona.id)
      setNewName("")
      setNewBrief("")
      setShowForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Rezidenti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {personaList.length} rezidentů v domě. Persony popsané v přirozené řeči — strukturovaný
            výstup zatím jako mock.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X /> : <Plus />}
          {showForm ? "Zavřít" : "Nová persona"}
        </Button>
      </div>

      {/* New persona form */}
      {showForm && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Popište rezidenta vlastními slovy</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kdo to je, jak se chová, co mu vadí, jaké má námitky proti rekonstrukcím a co momentálně
            odmítá. Text později zpracuje AI agent do strukturované podoby.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Jméno persony, např. Pan Černý"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <textarea
              value={newBrief}
              onChange={(e) => setNewBrief(e.target.value)}
              rows={4}
              placeholder="Např. Pan Černý je čtyřicátník, pracuje z domova a vadí mu hlavně hluk. Rekonstrukce podporuje, ale odmítá cokoliv, co by trvalo déle než tři měsíce…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)} disabled={adding}>
                Zrušit
              </Button>
              <Button onClick={addPersona} disabled={!newName.trim() || !newBrief.trim() || adding}>
                <Sparkles className={adding ? "animate-spin" : ""} />
                {adding ? "Analyzuji…" : "Uložit personu"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment summary */}
      <div className="grid grid-cols-3 gap-3">
        {loadingPersonas
          ? SENTIMENT_ORDER.map((sentiment) => {
              const cfg = SENTIMENTS[sentiment]
              return (
                <div key={sentiment} className="rounded-lg border px-4 py-3">
                  <div className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.text)}>
                    <cfg.icon className="size-3.5" />
                    {cfg.label}
                  </div>
                  <div className="mt-1 h-8 w-8 animate-pulse rounded-md bg-muted" />
                  <div className="mt-1 h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              )
            })
          : counts.map(({ sentiment, count }) => {
              const cfg = SENTIMENTS[sentiment]
              const active = sentimentFilter === sentiment
              return (
                <button
                  key={sentiment}
                  onClick={() => setSentimentFilter(active ? "all" : sentiment)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left transition-colors",
                    active ? cfg.activeCard : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.text)}>
                    <cfg.icon className="size-3.5" />
                    {cfg.label}
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((count / personaList.length) * 100)} % rezidentů
                  </p>
                </button>
              )
            })}
      </div>

      {/* Master–detail */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(260px,330px)_1fr]">
        {/* Left: search + grouped list */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-6">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat jméno, byt, klíčové slovo…"
              className="h-9 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="relative flex max-h-[60svh] flex-col gap-4 overflow-y-auto rounded-lg border p-2 lg:max-h-[calc(100svh-220px)]">
            {loadingPersonas && (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-lg bg-background/70 text-sm text-muted-foreground backdrop-blur-sm">
                <Sparkles className="size-4 animate-spin" />
                Načítám…
              </div>
            )}
            {grouped.length === 0 && !loadingPersonas && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Žádný rezident neodpovídá hledání.
              </p>
            )}
            {grouped.map(({ sentiment, items }) => {
              const cfg = SENTIMENTS[sentiment]
              return (
                <div key={sentiment}>
                  <div className="flex items-center gap-1.5 px-2 pb-1.5">
                    <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      {cfg.label} · {items.length}
                    </p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {items.map((persona) => {
                      const active = persona.id === selectedPersonaId
                      return (
                        <button
                          key={persona.id}
                          onClick={() => setSelectedPersonaId(persona.id)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                            active ? "bg-muted" : "hover:bg-muted/50"
                          )}
                        >
                          <div className="relative shrink-0">
                            <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                              <User className="size-3.5 text-muted-foreground" />
                            </div>
                            <span
                              className={cn(
                                "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-background",
                                cfg.dot
                              )}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium">{persona.name}</p>
                              {persona.status === "ceka" && (
                                <Clock className="size-3 shrink-0 text-muted-foreground" />
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {persona.role} · {persona.unit}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: detail */}
        {selectedPersona ? (
          <div className="flex min-w-0 flex-col gap-4">
            {/* Detail header */}
            <div
              className={cn(
                "rounded-lg border p-4",
                SENTIMENTS[selectedPersona.sentiment].activeCard
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background">
                    <User className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedPersona.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPersona.role} · {selectedPersona.unit}
                    </p>
                  </div>
                </div>
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
                  {selectedPersona.status === "zpracovano" ? (
                    <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      <Sparkles className="size-3" />
                      Zpracováno
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Clock className="size-3" />
                      Čeká na zpracování
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{selectedPersona.brief}</p>
            </div>

            {/* Structured output */}
            {selectedPersona.structured ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: User,
                    title: "Charakteristika",
                    items: selectedPersona.structured.traits,
                  },
                  {
                    icon: MessageSquareWarning,
                    title: "Námitky",
                    items: selectedPersona.structured.objections,
                  },
                  { icon: Heart, title: "Motivace", items: selectedPersona.structured.motivations },
                  {
                    icon: Ban,
                    title: "Aktuálně odmítá",
                    items: selectedPersona.structured.rejects,
                  },
                ].map((block) => (
                  <div key={block.title} className="rounded-lg border bg-muted/40 px-4 py-3">
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
              <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" />
                Strukturovaný výstup zatím není k dispozici — brief čeká na zpracování AI agentem.
              </div>
            )}

            {/* Strategy */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Argumentační strategie
                </p>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                {getStrategy(selectedPersona, selectedProject).map((point, i) => (
                  <div
                    key={point.title}
                    className="flex items-start gap-3 rounded-lg border px-4 py-3"
                  >
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary tabular-nums">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{point.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {point.detail}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-3 opacity-60">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    V další fázi tuto strategii vygeneruje AI agent na míru z briefu persony a dat
                    projektu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
            Vyberte rezidenta ze seznamu.
          </div>
        )}
      </div>
    </div>
  )
}
