# Persona Brief Edit + Regenerace statistik — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Umožnit inline editaci `brief` u existující persony a po uložení přegenerovat AI charakteristiky (traits, objections, motivations, rejects, sentiment) v Supabase.

**Architecture:** Nový dynamický API endpoint `PATCH /api/personas/[id]` přijme nový brief, spustí stejnou AI charakterizaci jako stávající POST, uloží výsledek a vrátí aktualizovanou personu. Frontend přidá do detailu persony inline edit mode se třemi stavy: čtení, editace, regenerace.

**Tech Stack:** Next.js 16 App Router, OpenAI SDK (gpt-4o), Supabase, React 19, TypeScript, Tailwind CSS, lucide-react

---

## File Map

| Soubor | Akce | Zodpovědnost |
|--------|------|--------------|
| `app/api/personas/[id]/route.ts` | Vytvořit | PATCH handler — přijme brief, spustí AI, uloží do Supabase |
| `app/dashboard/rezidenti/page.tsx` | Upravit | Inline edit mode, draftBrief state, regenerating overlay, updatePersona call |

---

### Task 1: PATCH endpoint `/api/personas/[id]/route.ts`

**Files:**
- Create: `app/api/personas/[id]/route.ts`

- [ ] **Step 1: Vytvořit soubor s PATCH handlerem**

```typescript
import { NextRequest } from "next/server";
import { openai } from "@/lib/ai/client";
import { characterizePersona } from "@/lib/ai/instructions/characterizePersona";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { brief } = await req.json() as { brief: string };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: characterizePersona },
      { role: "user", content: brief },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content ?? "{}") as {
    traits: string[];
    objections: string[];
    motivations: string[];
    rejects: string[];
    sentiment: "podporuje" | "vaha" | "proti";
  };

  const { sentiment, ...structured } = raw;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personas")
    .update({ brief, structured, sentiment, status: "zpracovano" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
```

- [ ] **Step 2: Ověřit typecheck**

```bash
npm run typecheck
```

Očekávaný výstup: žádné chyby.

- [ ] **Step 3: Commit**

```bash
git add app/api/personas/[id]/route.ts
git commit -m "feat: add PATCH /api/personas/[id] for brief re-characterization"
```

---

### Task 2: Inline edit mode v detailu persony

**Files:**
- Modify: `app/dashboard/rezidenti/page.tsx`

Přidat tři nové stavy za existující `const [selectedProjectId, setSelectedProjectId]`:

- [ ] **Step 1: Přidat state pro edit mode**

Najít blok stavů (řádek ~112–114) a přidat za `selectedProjectId`:

```tsx
const [editingBrief, setEditingBrief] = useState(false)
const [draftBrief, setDraftBrief] = useState("")
const [regenerating, setRegenerating] = useState(false)
```

- [ ] **Step 2: Přidat funkci `updateBrief`**

Přidat za existující funkci `addPersona` (za uzavírací `}` na řádku ~181):

```tsx
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
```

- [ ] **Step 3: Nahradit statický brief text inline edit UI**

V detailu persony (okolo řádku ~406) najít:

```tsx
<p className="mt-3 text-sm leading-relaxed">{selectedPersona.brief}</p>
```

Nahradit:

```tsx
{editingBrief ? (
  <div className="mt-3 flex flex-col gap-2">
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
      <Button
        size="sm"
        onClick={updateBrief}
        disabled={!draftBrief.trim() || regenerating}
      >
        <Sparkles className={regenerating ? "animate-spin" : ""} />
        {regenerating ? "Regeneruji…" : "Uložit a přegenerovat"}
      </Button>
    </div>
  </div>
) : (
  <div className="group/brief relative mt-3">
    <p className="text-sm leading-relaxed">{selectedPersona.brief}</p>
    <button
      onClick={() => {
        setDraftBrief(selectedPersona.brief)
        setEditingBrief(true)
      }}
      className="absolute -top-1 -right-1 hidden rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground group-hover/brief:flex"
      title="Upravit popis"
    >
      <Pencil className="size-3.5" />
    </button>
  </div>
)}
```

- [ ] **Step 4: Přidat import ikony `Pencil`**

V importu z `lucide-react` (řádek ~6) přidat `Pencil`:

```tsx
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
  Pencil,
} from "lucide-react"
```

- [ ] **Step 5: Přidat regenerating overlay na detail panel**

Najít otevírací `div` detailu persony (řádek ~360):

```tsx
<div className="flex min-w-0 flex-col gap-4">
```

Nahradit:

```tsx
<div className="relative flex min-w-0 flex-col gap-4">
  {regenerating && (
    <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-lg bg-background/70 text-sm text-muted-foreground backdrop-blur-sm">
      <Sparkles className="size-4 animate-spin" />
      Přegenerovávám charakteristiky…
    </div>
  )}
```

Pozor: tento přidaný `div` s overlayem je nový child — původní obsah panelu zůstává beze změny. Ujisti se, že uzavírací `</div>` detailu je na správném místě (stávající uzavírací `</div>` na řádku ~502 zůstává jako uzavření `relative flex` divu).

- [ ] **Step 6: Resetovat edit mode při přepnutí persony**

Přidat `useEffect` za existující `useEffect` (po řádku ~111):

```tsx
useEffect(() => {
  setEditingBrief(false)
  setDraftBrief("")
}, [selectedPersonaId])
```

- [ ] **Step 7: Ověřit typecheck**

```bash
npm run typecheck
```

Očekávaný výstup: žádné chyby.

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/rezidenti/page.tsx
git commit -m "feat: inline brief edit with AI re-characterization"
```

---

### Task 3: Manuální ověření

- [ ] **Step 1: Spustit dev server**

```bash
npm run dev
```

- [ ] **Step 2: Otevřít `/dashboard/rezidenti`**

Vybrat personu se statusem `zpracovano` (např. Paní Nováková).

- [ ] **Step 3: Ověřit edit flow**

1. Hover nad textem briefu → zobrazí se ikona tužky
2. Kliknout na tužku → brief se přepne na textarea s předvyplněným textem
3. Upravit text → kliknout „Uložit a přegenerovat"
4. Spinner overlay se zobrazí na celém detailu
5. Po dokončení: brief je aktualizovaný, structured sekce zobrazuje nové charakteristiky, sentiment badge reflektuje nový výsledek

- [ ] **Step 4: Ověřit „Zrušit"**

Kliknout tužku → změnit text → kliknout „Zrušit" → brief se vrátí na původní text, žádné API volání.
