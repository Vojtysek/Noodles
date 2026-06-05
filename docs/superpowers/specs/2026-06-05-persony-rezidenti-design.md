# Design: Persony jako archetypy pro rezidenty

**Datum:** 2026-06-05  
**Projekt:** Noodles — SVJ manažer renovačních projektů

---

## Kontext

V aplikaci se míchaly pojmy "persona" a "rezident". Cílem je zavést jasné rozlišení:

- **Persona** = předdefinovaný archetyp chování (Skrblík, Investor, Technický kritik, Ekologický nadšenec, Lhostejný, Nováček)
- **Rezident** = konkrétní člověk v budově, který personu může volitelně využívat

## Rozhodnutí

| Otázka | Rozhodnutí |
|--------|-----------|
| Kde jsou persony uloženy | Napevno v kódu (`lib/persona-types.ts`) |
| Je výběr persony povinný | Ne — staré chování (jen jméno + brief) funguje |
| Jak persona ovlivní AI | Hint v system promptu; AI stále plně generuje strukturu |
| UI pro výběr persony | Inline kartičky s obrázkem + názvem v tvůrčím formuláři |
| Tlačítko v hlavičce | "Nová persona" → "Nový rezident" |

## Archetypy

| ID | Název | Popis pro AI |
|----|-------|-------------|
| `skrblik` | Skrblík | Primárně motivován náklady, vznáší námitky k ceně a fondu oprav |
| `investor` | Investor | Analytický, zajímá ho návratnost a zhodnocení bytu |
| `technik` | Technický kritik | Zpochybňuje materiály a řešení, chce dokumentaci |
| `ekolog` | Ekologický nadšenec | Prosazuje zelená řešení, odmítá projekty bez eko přínosu |
| `lhostejny` | Lhostejný | Neangažuje se, schválí cokoliv, rozhoduje se pozdě |
| `novacek` | Nováček | Nový v budově, klade základní otázky, potřebuje kontext |

## Architektura

### Datový model

```
personas tabulka (rozšíření):
+ persona_type: text | null
```

```typescript
// lib/mock-data.ts
type Persona = {
  ...stávající pole...
  personaType?: PersonaType  // volitelné
}
```

### Nové soubory

- `lib/persona-types.ts` — `PersonaType` union, `PERSONA_TYPES` konstanta (name, imagePath, aiHint)
- `supabase/migrations/20260605150000_add_persona_type_to_personas.sql` — ALTER TABLE

### Změněné soubory

- `lib/mock-data.ts` — přidat `personaType` do typu `Persona`
- `lib/ai/instructions/characterizePersona.ts` — string → builder funkce s volitelným hint parametrem
- `app/api/personas/route.ts` — POST přijímá a ukládá `personaType`
- `app/api/personas/[id]/route.ts` — PATCH čte `persona_type` z DB, předá do AI
- `app/dashboard/rezidenti/page.tsx` — UI změny (viz níže)

### UI formuláře

```
[ Nový rezident ] (hlavička)

Formulář:
  Jméno: [input]
  
  Typ rezidenta (volitelné):
  [ 🖼 Skrblík ] [ 🖼 Investor ] [ 🖼 Technik ] [ 🖼 Ekolog ] [ 🖼 Lhostejný ] [ 🖼 Nováček ]
  (kartičky s obrázkem, jedno kliknutí = výběr, druhé = zrušení)
  
  Brief (volitelné):
  [textarea]
  
  [ Zrušit ] [ Uložit rezidenta ]
```

### Zobrazení persony po vytvoření

- **Karusel karta:** malý text s názvem persony pod jménem rezidenta
- **Detail panel:** badge s obrázkem + názvem persony vedle sentiment badge

## Tok dat

```
Uživatel vyplní formulář (jméno + volitelná persona + volitelný brief)
  ↓
POST /api/personas { name, brief?, personaType? }
  ↓
buildCharacterizePersonaPrompt(personaType?) → systém prompt s nebo bez hintu
  ↓
OpenAI GPT-4o generuje traits/objections/motivations/rejects/sentiment
  ↓
Supabase INSERT do personas (+ persona_type)
  ↓
UI přidá rezidenta do karuselu s badge persony
```

## Obrazová aktiva

Umístění: `/public/personas/{skrblik,investor,technik,ekolog,lhostejny,novacek}.png`  
Dodat: uživatel

## Ověření

1. Otevřít `/dashboard/rezidenti`
2. Kliknout "Nový rezident" — formulář se otevře s kartičkami person
3. Vybrat personu, zadat jméno, uložit → rezident se přidá s badge
4. Vytvořit rezidenta bez persony (jen jméno + brief) → funguje jako dřív
5. V DB ověřit `persona_type` je uložen
6. Regenerace brief (PATCH) stále funguje s původní personu
