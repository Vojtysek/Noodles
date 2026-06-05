# AI generace argumentačních strategií

## Přehled

Nahrazení mock `getStrategy()` funkce skutečnou AI generací argumentačních strategií. Uživatel vybere personu, vybere projekt v dropdownu a klikne na "Vygenerovat strategie". AI sestaví 3–5 strategických bodů přizpůsobených personě a projektu, výsledek se uloží do Supabase a zobrazí místo mock dat.

## Datový model

Nová tabulka `persona_strategies`:

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

- `project_id` odpovídá hodnotám z `lib/mock-data.ts`: `fasada | okna | strecha | vytah`
- `strategies` je `StrategyPoint[]` — `[{ title: string; detail: string }]`
- Unique constraint na `(persona_id, project_id)` umožňuje upsert — nová generace přepíše předchozí

## API

### POST /api/personas/[id]/strategies

**Request:** `{ project_id: string }`

**Logika:**
1. Načte personu z Supabase (`brief`, `structured`, `sentiment`)
2. Najde projekt v `projects` z `lib/mock-data.ts`
3. Sestaví prompt z `generateArguments` instrukce + data persony + finanční data projektu
4. Zavolá OpenAI s `response_format: json_object`, vynutí výstup `{ strategies: [{ title, detail }] }`
5. Upsertne do `persona_strategies` přes `onConflict: ['persona_id', 'project_id']`
6. Vrátí `StrategyPoint[]`

**Chybové stavy:**
- Persona neexistuje → 404
- Persona nemá `structured` (status `ceka`) → 400 s chybovou zprávou
- OpenAI nebo Supabase chyba → 500

### GET /api/personas/[id]/strategies

Vrátí všechny uložené strategie pro personu jako `Record<project_id, StrategyPoint[]>`. Používá se při načtení stránky pro zobrazení dříve vygenerovaných strategií.

## UI změny

Soubor: `app/dashboard/rezidenti/page.tsx`

### Nový state
```ts
const [generatedStrategies, setGeneratedStrategies] = useState<Record<string, StrategyPoint[]>>({})
const [generatingStrategy, setGeneratingStrategy] = useState(false)
```

### Načtení uložených strategií
Při načtení person (nebo při změně `selectedPersonaId`) se volá GET endpoint a výsledek se uloží do `generatedStrategies`.

### Tlačítko
Vedle dropdown selektu projektů přibude tlačítko "Vygenerovat strategie":
- Disabled pokud `selectedPersona.status === 'ceka'` (nemá `structured`)
- Disabled pokud `generatingStrategy === true`
- Loading state: "Generuji…" + Sparkles s `animate-spin`

### Zobrazení strategií
- Pokud `generatedStrategies[selectedProjectId]` existuje → zobrazí AI data místo mock
- Jinak → zobrazí mock data z `getStrategy()` (zpětná kompatibilita)
- Dashed placeholder ("V další fázi tuto strategii vygeneruje AI agent…") zmizí, pokud jsou reálná data

## AI prompt

Instrukce z `lib/ai/instructions/generateArguments.ts` se rozšíří o formátovací požadavek:

**Vstup uživatele (user message):**
```
PERSONA:
Jméno: {name}
Postoj: {sentiment}
Charakteristika: {traits}
Námitky: {objections}
Motivace: {motivations}
Odmítá: {rejects}

PROJEKT:
Název: {project.name}
Rozpočet: {budget} Kč
Roční úspora: {savingsPerYear} Kč
Návratnost: {paybackYears} let
Navýšení fondu: {fundIncreasePerFlat} Kč/byt/měsíc
Úspora energií: {energySavingPct} %

Vygeneruj 4 strategické body, jak přesvědčit tuto personu k podpoře tohoto projektu.
Výstup: JSON objekt { "strategies": [{ "title": "...", "detail": "..." }] }
```

## Typy

`StrategyPoint` je již definován v `lib/mock-data.ts`:
```ts
export type StrategyPoint = { title: string; detail: string }
```

Tento typ se importuje i v nové API route.

## Migrace

Nový soubor: `supabase/migrations/20260605140000_create_persona_strategies_table.sql`
