# AI Generace Argumentačních Strategií — Implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nahradit mock `getStrategy()` skutečnou AI generací strategií uloženou v Supabase, přístupnou přes nový API endpoint a spouštěnou tlačítkem v UI.

**Architecture:** Nová tabulka `persona_strategies` ukládá vygenerované strategie per (persona, projekt). Nová API route `POST /api/personas/[id]/strategies` volá OpenAI a upsertuje výsledek. UI přidá tlačítko a načte uložené strategie při výběru persony.

**Tech Stack:** Next.js 16, OpenAI SDK (`openai` npm), Supabase SSR, TypeScript

---

## Soubory

| Akce | Soubor |
|------|--------|
| Create | `supabase/migrations/20260605140000_create_persona_strategies_table.sql` |
| Create | `lib/ai/instructions/generateStrategy.ts` |
| Create | `app/api/personas/[id]/strategies/route.ts` |
| Modify | `app/dashboard/rezidenti/page.tsx` |

---

### Task 1: Supabase migrace

**Files:**
- Create: `supabase/migrations/20260605140000_create_persona_strategies_table.sql`

- [ ] **Step 1: Vytvoř migrační soubor**

```sql
create table persona_strategies (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  project_id text not null,
  strategies jsonb not null,
  generated_at timestamptz not null default now(),
  unique(persona_id, project_id)
);
```

- [ ] **Step 2: Spusť migraci lokálně**

```bash
npx supabase db push
```

Očekávaný výstup: `Applying migration 20260605140000_create_persona_strategies_table.sql... done`

---

### Task 2: AI instrukce pro generování strategií

**Files:**
- Create: `lib/ai/instructions/generateStrategy.ts`

- [ ] **Step 1: Vytvoř instrukci**

```typescript
export const generateStrategy = `
Jsi expert na přesvědčování v oblasti správy a renovace bytových domů.

Na základě dat persony a projektu vygeneruješ 4 strategické body, jak přesvědčit konkrétního rezidenta k podpoře konkrétního renovačního projektu.

Každý bod má nadpis (title, max 8 slov) a detail (1–2 věty s konkrétní taktikou nebo argumentem).

Pravidla:
- Argumentuj pouze fakty ze vstupu — nevymýšlej čísla ani data
- Přizpůsob taktiku komunikačnímu profilu persony
- Pro skeptiky: data a logika, konkrétní čísla
- Pro váhající: zdůrazni kompromis a osobní přínos
- Pro "drivery": stručně, akce a harmonogram
- Pro vztahové typy: komunita a společný zájem
- Vyhni se obecným frázím bez podpory daty
- Vše v češtině

VÝSTUP musí být validní JSON objekt:
{ "strategies": [{ "title": string, "detail": string }] }
Odpověz POUZE validním JSON objektem, žádný jiný text.
`.trim();
```

- [ ] **Step 2: Ověř typecheck**

```bash
npm run typecheck
```

Očekávaný výstup: žádné chyby.

---

### Task 3: API route — GET + POST /api/personas/[id]/strategies

**Files:**
- Create: `app/api/personas/[id]/strategies/route.ts`

Tato route existuje vedle stávající `app/api/personas/[id]/route.ts` (PATCH). Vytvoříme nový adresář `strategies/`.

- [ ] **Step 1: Vytvoř soubor route**

```typescript
import { NextRequest } from "next/server";
import { openai } from "@/lib/ai/client";
import { generateStrategy } from "@/lib/ai/instructions/generateStrategy";
import { createClient } from "@/lib/supabase/server";
import { projects } from "@/lib/mock-data";
import type { StrategyPoint } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("persona_strategies")
    .select("project_id, strategies")
    .eq("persona_id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const result: Record<string, StrategyPoint[]> = {};
  for (const row of data ?? []) {
    result[row.project_id as string] = row.strategies as StrategyPoint[];
  }

  return Response.json(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { project_id } = (await req.json()) as { project_id: string };

  const supabase = await createClient();

  const { data: persona, error: personaError } = await supabase
    .from("personas")
    .select("name, brief, structured, sentiment")
    .eq("id", id)
    .single();

  if (personaError || !persona) {
    return Response.json({ error: "Persona not found" }, { status: 404 });
  }

  if (!persona.structured) {
    return Response.json(
      { error: "Persona nemá zpracovaný brief — nejdříve spusťte analýzu." },
      { status: 400 }
    );
  }

  const project = projects.find((p) => p.id === project_id);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const structured = persona.structured as {
    traits: string[];
    objections: string[];
    motivations: string[];
    rejects: string[];
  };

  const userMessage = `PERSONA:
Jméno: ${persona.name}
Postoj: ${persona.sentiment}
Charakteristika: ${structured.traits.join(", ")}
Námitky: ${structured.objections.join(", ")}
Motivace: ${structured.motivations.join(", ")}
Odmítá: ${structured.rejects.join(", ")}

PROJEKT:
Název: ${project.name}
Rozpočet: ${project.budget.toLocaleString("cs-CZ")} Kč
Roční úspora: ${project.savingsPerYear.toLocaleString("cs-CZ")} Kč
Návratnost: ${project.paybackYears} let
Navýšení fondu: ${project.fundIncreasePerFlat} Kč/byt/měsíc
Úspora energií: ${project.energySavingPct} %

Vygeneruj 4 strategické body jak přesvědčit tuto personu k podpoře tohoto projektu.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: generateStrategy },
      { role: "user", content: userMessage },
    ],
  });

  const raw = JSON.parse(
    completion.choices[0].message.content ?? "{}"
  ) as { strategies: StrategyPoint[] };

  const { error: upsertError } = await supabase
    .from("persona_strategies")
    .upsert(
      { persona_id: id, project_id, strategies: raw.strategies },
      { onConflict: "persona_id,project_id" }
    );

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 });
  }

  return Response.json(raw.strategies);
}
```

- [ ] **Step 2: Ověř typecheck**

```bash
npm run typecheck
```

Očekávaný výstup: žádné chyby.

---

### Task 4: UI — stav, načítání, tlačítko, zobrazení

**Files:**
- Modify: `app/dashboard/rezidenti/page.tsx`

- [ ] **Step 1: Přidej import `StrategyPoint`**

Najdi řádek s importem z `@/lib/mock-data` (řádek ~27):

```typescript
import {
  personas as initialPersonas,
  projects,
  getStrategy,
  type Persona,
  type Sentiment,
} from "@/lib/mock-data"
```

Nahraď za:

```typescript
import {
  personas as initialPersonas,
  projects,
  getStrategy,
  type Persona,
  type Sentiment,
  type StrategyPoint,
} from "@/lib/mock-data"
```

- [ ] **Step 2: Přidej nové stavy za stávající state deklarace**

Najdi blok se stavy (po řádku s `const [regenerating, setRegenerating] = useState(false)`):

```typescript
  const [regenerating, setRegenerating] = useState(false)
```

Za něj přidej:

```typescript
  const [generatedStrategies, setGeneratedStrategies] = useState<Record<string, StrategyPoint[]>>({})
  const [generatingStrategy, setGeneratingStrategy] = useState(false)
```

- [ ] **Step 3: Přidej useEffect pro načtení strategií při změně persony**

Najdi existující useEffect pro reset editingBrief:

```typescript
  useEffect(() => {
    setEditingBrief(false)
    setDraftBrief("")
  }, [selectedPersonaId])
```

Za něj přidej nový useEffect:

```typescript
  useEffect(() => {
    setGeneratedStrategies({})
    if (!selectedPersonaId) return
    fetch(`/api/personas/${selectedPersonaId}/strategies`)
      .then((r) => r.json())
      .then((data: Record<string, StrategyPoint[]>) => {
        setGeneratedStrategies(data)
      })
      .catch(() => {/* zobraz mock při chybě */})
  }, [selectedPersonaId])
```

- [ ] **Step 4: Přidej funkci `generateStrategyForPersona`**

Přidej za funkci `updateBrief`:

```typescript
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
```

- [ ] **Step 5: Přidej tlačítko do hlavičky sekce strategie**

Najdi tento blok (kolem řádku ~553):

```typescript
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
```

Nahraď za:

```typescript
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Argumentační strategie
                </p>
                <div className="flex items-center gap-2">
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
                  <Button
                    size="sm"
                    onClick={generateStrategyForPersona}
                    disabled={!selectedPersona.structured || generatingStrategy}
                  >
                    <Sparkles className={generatingStrategy ? "animate-spin" : ""} />
                    {generatingStrategy ? "Generuji…" : "Vygenerovat strategie"}
                  </Button>
                </div>
              </div>
```

- [ ] **Step 6: Přepni zdroj dat strategií a skryj placeholder při AI datech**

Najdi renderování bodů strategie a placeholder (kolem řádku ~571):

```typescript
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
```

Nahraď za:

```typescript
              <div className="flex flex-col gap-2">
                {(generatedStrategies[selectedProjectId] ?? getStrategy(selectedPersona, selectedProject)).map((point, i) => (
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
                {!generatedStrategies[selectedProjectId] && (
                  <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-3 opacity-60">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      V další fázi tuto strategii vygeneruje AI agent na míru z briefu persony a dat
                      projektu.
                    </p>
                  </div>
                )}
              </div>
```

- [ ] **Step 7: Ověř typecheck**

```bash
npm run typecheck
```

Očekávaný výstup: žádné chyby.

- [ ] **Step 8: Spusť dev server a ověř ručně**

```bash
npm run dev
```

Otevři `http://localhost:3000/dashboard/rezidenti`. Vyber personu se statusem "Zpracováno", vyber projekt v dropdownu, klikni "Vygenerovat strategie". Ověř:
1. Tlačítko zobrazuje spinner a text "Generuji…" během volání
2. Po dokončení se zobrazí 4 AI body místo mock dat
3. Placeholder ("V další fázi…") zmizí
4. Po refreshi se dříve vygenerované strategie načtou zpět
5. Pro personu se statusem "Čeká na zpracování" je tlačítko disabled
