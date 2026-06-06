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
  Pencil,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ARCHETYPES, isArchetypeId, type Archetype } from "@/lib/archetypes"
import { buildDynamicScenarios, scenarioKey } from "@/lib/scenarios"
import {
  scenarios as staticScenarios,
  type Persona,
  type Scenario,
  type ScenarioTone,
  type StrategyPoint,
} from "@/lib/mock-data"

// Tečka scénáře — stejné mapování jako na stránkách Přehled a Finance.
const TONE_DOT: Record<ScenarioTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/** Vybraný subjekt — vestavěný archetyp, nebo vlastní (řádek v personas). */
type Subject =
  | { kind: "builtin"; archetype: Archetype }
  | { kind: "custom"; persona: Persona }

export default function RezidentiPage() {
  const [customs, setCustoms] = useState<Persona[]>([])
  const [loadingCustoms, setLoadingCustoms] = useState(true)
  const [loadingBuilding, setLoadingBuilding] = useState(true)
  const [selectedId, setSelectedId] = useState<string>(ARCHETYPES[0].id)

  // Vlastní archetyp — formulář + úpravy
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newBrief, setNewBrief] = useState("")
  const [adding, setAdding] = useState(false)
  const [editingBrief, setEditingBrief] = useState(false)
  const [draftBrief, setDraftBrief] = useState("")
  const [regenerating, setRegenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Scénáře + strategie
  const [scenarioList, setScenarioList] = useState<Scenario[]>(staticScenarios)
  const [scenarioId, setScenarioId] = useState(staticScenarios[0].id)
  const [strategies, setStrategies] = useState<Record<string, StrategyPoint[]>>({})
  const [generating, setGenerating] = useState(false)

  // Vlastní archetypy ze Supabase — žádná mock data.
  useEffect(() => {
    fetch("/api/personas")
      .then((r) => r.json())
      .then((rows: Array<{
        id: string
        name: string
        role: string
        unit: string
        status: "zpracovano" | "ceka"
        sentiment: Persona["sentiment"]
        brief: string
        structured: Persona["structured"]
      }>) => {
        if (!Array.isArray(rows)) return
        setCustoms(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            role: r.role,
            unit: r.unit,
            status: r.status,
            sentiment: r.sentiment,
            brief: r.brief,
            structured: r.structured,
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoadingCustoms(false))
  }, [])

  // Dva velké scénáře z poslední kalkulace — scoped na user_id.
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
        if (data) {
          const built = buildDynamicScenarios(
            (data as { selected_renovations: string[] }).selected_renovations ?? []
          )
          setScenarioList(built)
          setScenarioId(built[0].id)
        }
      } catch {} finally {
        setLoadingBuilding(false)
      }
    })()
  }, [])

  const subject: Subject = isArchetypeId(selectedId)
    ? { kind: "builtin", archetype: ARCHETYPES.find((a) => a.id === selectedId)! }
    : {
        kind: "custom",
        persona: customs.find((p) => p.id === selectedId) ?? {
          id: selectedId,
          name: "",
          role: "",
          unit: "",
          status: "ceka",
          sentiment: "vaha",
          brief: "",
          structured: null,
        },
      }

  const strategiesUrl =
    subject.kind === "builtin"
      ? `/api/archetypes/${subject.archetype.id}/strategies`
      : `/api/personas/${subject.persona.id}/strategies`

  /** Výběr subjektu — resetuje stav vázaný na předchozí výběr. */
  function selectSubject(id: string) {
    setSelectedId(id)
    setStrategies({})
    setEditingBrief(false)
    setDraftBrief("")
  }

  // Cache strategií vybraného subjektu — klíčováno scenario_key.
  useEffect(() => {
    const controller = new AbortController()
    fetch(strategiesUrl, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then((data: Record<string, StrategyPoint[]>) => setStrategies(data))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") console.error(err)
      })
    return () => controller.abort()
  }, [strategiesUrl])

  const scenario =
    scenarioList.find((s) => s.id === scenarioId) ?? scenarioList[0] ?? null
  const activeKey = scenario ? scenarioKey(scenario.projectIds) : null
  const activeStrategies = activeKey ? strategies[activeKey] : undefined

  const profile =
    subject.kind === "builtin" ? subject.archetype.profile : subject.persona.structured

  function resetForm() {
    setNewName("")
    setNewBrief("")
    setShowForm(false)
  }

  async function addCustomArchetype() {
    const name = newName.trim()
    const brief = newBrief.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brief: brief || undefined, role: "Vlastní archetyp" }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as Persona
      setCustoms((prev) => [data, ...prev])
      selectSubject(data.id)
      resetForm()
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  async function deleteCustomArchetype() {
    if (subject.kind !== "custom" || deleting) return
    if (!window.confirm(`Smazat archetyp „${subject.persona.name}"?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/personas/${subject.persona.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      setCustoms((prev) => prev.filter((p) => p.id !== subject.persona.id))
      selectSubject(ARCHETYPES[0].id)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  async function updateBrief() {
    if (subject.kind !== "custom" || regenerating) return
    const brief = draftBrief.trim()
    if (!brief || brief === subject.persona.brief) {
      setEditingBrief(false)
      return
    }
    setRegenerating(true)
    try {
      const res = await fetch(`/api/personas/${subject.persona.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as Persona
      setCustoms((prev) =>
        prev.map((p) =>
          p.id === data.id
            ? { ...p, brief: data.brief, structured: data.structured, status: data.status }
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

  async function generateStrategies() {
    if (!profile || !scenario || !activeKey || generating) return
    setGenerating(true)
    try {
      const res = await fetch(strategiesUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_ids: scenario.projectIds,
          scenario_name: scenario.name,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const points = (await res.json()) as StrategyPoint[]
      setStrategies((prev) => ({ ...prev, [activeKey]: points }))
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 -z-10 size-[28rem] rounded-full bg-blue-500/10 blur-[130px]"
      />

      {/* Header */}
      <div
        className="anim-in"
        style={{ "--ai-y": "-20px", "--ai-dur": "0.6s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-7 bg-primary/60" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            Argumentační příprava
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Rezidenti</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Připravte si argumenty na sousedy dřív, než se na schůzi postaví proti.
        </p>
      </div>

      {/* Galerie archetypů */}
      <div
        className="anim-in flex flex-col gap-3"
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.1s" } as React.CSSProperties}
      >
        <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          S kým budete mluvit?
        </span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ARCHETYPES.map((a) => {
            const active = selectedId === a.id
            return (
              <button
                key={a.id}
                onClick={() => selectSubject(a.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-2.5 rounded-2xl border p-3 text-left transition-all duration-200",
                  active
                    ? "scale-[1.02] border-primary/60 bg-primary/5 shadow-lg ring-3 ring-primary/15"
                    : "bg-background/60 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.imagePath}
                  alt={a.name}
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <div>
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.subtitle}</p>
                </div>
              </button>
            )
          })}

          {/* Vlastní archetypy z DB */}
          {loadingCustoms
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border bg-muted/40" />
              ))
            : customs.map((p) => {
                const active = selectedId === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => selectSubject(p.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col gap-2.5 rounded-2xl border p-3 text-left transition-all duration-200",
                      active
                        ? "scale-[1.02] border-primary/60 bg-primary/5 shadow-lg ring-3 ring-primary/15"
                        : "bg-background/60 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg"
                    )}
                  >
                    <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-primary/10">
                      <span className="text-2xl font-bold text-primary">
                        {initials(p.name)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Vlastní archetyp</p>
                    </div>
                  </button>
                )
              })}

          {/* + Vlastní archetyp */}
          <button
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg",
              showForm && "border-primary/60 bg-primary/5"
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              {showForm ? (
                <X className="size-5 text-muted-foreground" />
              ) : (
                <Plus className="size-5 text-muted-foreground" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold">Vlastní archetyp</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Když žádný nesedí</p>
            </div>
          </button>
        </div>
      </div>

      {/* Formulář vlastního archetypu */}
      {showForm && (
        <div className="animate-in fade-in rounded-2xl border bg-background/60 p-6 backdrop-blur-sm duration-200">
          <p className="text-sm font-medium">Popište typ souseda vlastními slovy</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Jak se projevuje, čeho se bojí, co ho přesvědčí — AI z popisu vytvoří profil.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Název archetypu, např. Soused pracující z domova"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              autoFocus
            />
            <textarea
              value={newBrief}
              onChange={(e) => setNewBrief(e.target.value)}
              rows={5}
              placeholder="Např. Pracuje z domova a vadí mu hlavně hluk. Rekonstrukci podporuje, ale odmítá cokoliv, co by trvalo déle než tři měsíce…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm} disabled={adding}>
                Zrušit
              </Button>
              <Button onClick={addCustomArchetype} disabled={!newName.trim() || adding}>
                <Sparkles className={adding ? "animate-spin" : ""} />
                {adding ? "Analyzuji…" : "Vytvořit archetyp"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail archetypu */}
      <div
        className="anim-in relative overflow-hidden rounded-2xl border bg-background/60 p-5 backdrop-blur-sm sm:p-6 lg:rounded-br-[3rem]"
        style={{ "--ai-y": "32px", "--ai-dur": "0.7s", "--ai-delay": "0.2s" } as React.CSSProperties}
      >
        {regenerating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-background/70 text-sm text-muted-foreground backdrop-blur-sm">
            <Sparkles className="size-4 animate-spin" />
            Přegenerovávám profil…
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Hlavička: obrázek / iniciály + jméno + akce */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {subject.kind === "builtin" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={subject.archetype.imagePath}
                  alt={subject.archetype.name}
                  className="size-14 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                  {initials(subject.persona.name)}
                </span>
              )}
              <div>
                <p className="text-lg font-semibold leading-tight">
                  {subject.kind === "builtin" ? subject.archetype.name : subject.persona.name}
                </p>
                <span className="mt-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {subject.kind === "builtin" ? "Vestavěný archetyp" : "Vlastní archetyp"}
                </span>
              </div>
            </div>
            {subject.kind === "custom" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteCustomArchetype}
                disabled={deleting}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
                {deleting ? "Mažu…" : "Smazat"}
              </Button>
            )}
          </div>

          {/* Popis — vestavěný read-only, vlastní s editací briefu */}
          {subject.kind === "builtin" ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {subject.archetype.description}
            </p>
          ) : editingBrief ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={draftBrief}
                onChange={(e) => setDraftBrief(e.target.value)}
                rows={5}
                autoFocus
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBrief(false)}
                  disabled={regenerating}
                >
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
              <p className="text-sm leading-relaxed text-muted-foreground">
                {subject.persona.brief}
              </p>
              <button
                onClick={() => {
                  setDraftBrief(subject.persona.brief)
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

          {/* Strukturovaný profil */}
          {profile ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { icon: User, title: "Charakteristika", items: profile.traits },
                { icon: MessageSquareWarning, title: "Námitky", items: profile.objections },
                { icon: Heart, title: "Motivace", items: profile.motivations },
                { icon: Ban, title: "Aktuálně odmítá", items: profile.rejects },
              ].map((block) => (
                <div key={block.title} className="rounded-xl border bg-muted/20 px-4 py-3">
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
              Profil zatím není k dispozici — popis čeká na zpracování AI agentem.
            </div>
          )}

          {/* Argumentační strategie */}
          <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <p className="text-sm font-medium">Argumentační strategie</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Jak tento typ souseda přesvědčit pro vybraný scénář.
                </p>
              </div>
              <Button onClick={generateStrategies} disabled={!profile || !scenario || generating}>
                <Sparkles className={generating ? "animate-spin" : ""} />
                {generating
                  ? "Generuji…"
                  : activeStrategies
                    ? "Přegenerovat"
                    : "Vygenerovat strategie"}
              </Button>
            </div>

            {/* Přepínač velkých scénářů */}
            {loadingBuilding ? (
              <div className="mt-4 h-9 w-56 animate-pulse rounded-full bg-muted" />
            ) : scenario && (
            <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-muted p-1">
              {scenarioList.map((s) => {
                const active = s.id === scenario.id
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
                    <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[s.tone])} />
                    {s.name}
                  </button>
                )
              })}
            </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {activeStrategies ? (
                activeStrategies.map((point, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border bg-background px-4 py-3"
                  >
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums shadow-sm">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{point.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {point.detail}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-3 opacity-60">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {!scenario
                      ? "Nejdříve si v kalkulaci vyberte renovace — váš plán se pak objeví zde."
                      : profile
                        ? `Pro scénář „${scenario.name}" zatím nejsou strategie — vygenerujte je tlačítkem výše.`
                        : "Nejdříve počkejte na zpracování profilu AI agentem."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
