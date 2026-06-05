# Rezidenti → Archetypy: redesign a pivot funkcionality

**Datum:** 2026-06-05
**Stav:** schváleno

## Cíl

Stránka `/dashboard/rezidenti` přestává sledovat konkrétní rezidenty a stává se
nástrojem na **přípravu argumentů proti archetypům sousedů** v SVJ. Uživatel
vybere archetyp (Skrblík, Investor, …), zvolí jeden ze dvou velkých scénářů
rekonstrukce a dostane AI argumentační strategii. Vlastní archetyp vytváří jen
tehdy, když žádný vestavěný nesedí. Vizuálně stránka přebírá design language
z redesignovaných Financí (hero, eyebrow sekce, segmented pills, anim-in).

## Rozhodnutí (z brainstormingu)

1. **Plný pivot** — žádné jméno/byt/sentiment tracking. Sentiment zmizí z UI
   (v DB schématu zůstává, jen se nezobrazuje).
2. **Vestavěné archetypy mají statické profily v kódu** — žádné AI volání při
   výběru. AI zůstává pro: tvorbu vlastního archetypu (existující pipeline
   `characterizePersona`) a generování strategií (`generateStrategy`).
3. **Ponechat stávajících 6 archetypů** (skrblik, investor, technik, ekolog,
   lhostejny, novacek) — mají obrázky v `/public/personas/`. Další lze přidat
   později.
4. **Scénáře dynamické jako na /prehled** — „Co jste si vybrali" (z poslední
   kalkulace v tabulce `buildings`) + „Kompletní obnova". Bez kalkulace
   fallback na dva statické scénáře z `lib/mock-data.ts`.
5. **Custom archetypy jsou mazatelné** — nový DELETE endpoint; staré řádky
   residentů v DB se zobrazí jako vlastní archetypy a uživatel je smaže.
   Formulář pro vlastní archetyp se zjednoduší na jméno + popis (bez dlaždic
   typů).
6. **Struktura stránky: galerie → detail** (žádný wizard) — grid karet
   archetypů + „+ Vlastní archetyp", pod tím detail s profilem a strategiemi.

## Datová vrstva

- **Nový `lib/archetypes.ts`** — rozšiřuje `PERSONA_TYPES` o statické profily:
  `{ subtitle, traits, objections, motivations, rejects }` (česky, ručně
  psané). Klíče = `PersonaType`.
- **`lib/mock-data.ts`** — smazat pole `personas` a funkci `getStrategy()`.
  Typ `Persona` zůstává (typuje API custom archetypů); `Sentiment` zůstává
  (DB schéma).
- **Nový `lib/scenarios.ts`** — přesun `buildDynamicScenarios` +
  `RENOVATION_LABEL_TO_PROJECT` z `/prehled`, sdílí je stránka Přehled,
  Rezidenti i API. Fallback bez kalkulace: oba statické scénáře.
- **`scenario_key`** = seřazená project ID spojená `+` (např.
  `fasada+okna`). Změna výběru v kalkulaci ⇒ automaticky nový cache klíč.

## UI stránky

- Ambient blobs, eyebrow hlavička („Argumentační příprava" / **Rezidenti**),
  `anim-in` vstupy.
- **Galerie archetypů** — wrap grid: 6 vestavěných (obrázek, jméno,
  jednořádkový podtitul), poté vlastní (avatar z iniciál), nakonec čárkovaná
  dlaždice „+ Vlastní archetyp". Vybraná karta: ring + scale jako dnešní
  carousel.
- **Detail** — obrázek/avatar + jméno + badge (Vestavěný/Vlastní), popis,
  stávající 4-blokový grid (charakteristika / námitky / motivace / odmítá).
  Vlastní archetypy: editovatelný brief s AI re-analýzou (stávající flow)
  + tlačítko smazat. Vestavěné: read-only.
- **Strategie** (v detailu) — segmented pill přepínač dvou scénářů (nahrazuje
  `<select>` projektů), cached strategie se načtou hned (GET), jinak CTA
  „Vygenerovat strategie". Číslované body ve stávajícím stylu.

## API

- **Migrace:** `archetype_strategies (id uuid pk, archetype text,
  scenario_key text, strategies jsonb, generated_at timestamptz,
  unique(archetype, scenario_key))` — cache vestavěných archetypů (nemají
  řádek v `personas`).
- **Nová route `/api/archetypes/[type]/strategies`** — GET vrátí cache pro
  všechny scenario_key daného archetypu; POST `{ project_ids }` → validace ID,
  agregace čísel scénáře z `projects` (Σ budget, Σ savings, payback =
  budget/savings, Σ fond, Σ energie %), `generateStrategy` prompt se statickým
  profilem, upsert cache.
- **`/api/personas/[id]/strategies`** — POST přijímá `project_ids` místo
  `project_id`; `scenario_key` se ukládá do stávajícího text sloupce
  `project_id` (bez migrace). GET beze změny tvaru (klíčováno scenario_key).
- **`/api/personas/[id]`** — přidat DELETE (FK cascade smaže strategie).
- **`/api/personas` POST** — beze změny (personaType volitelný, formulář ho
  už neposílá).

## Dopad na /prehled

Chip „X rezidentů podporuje" ztrácí zdroj dat → odstranit fetch
`/api/personas` a chip nahradit „N bytových jednotek" z kalkulace
(`buildings.units`). Tři chipy zůstávají.

## Ověření

`npx tsc --noEmit` + eslint čisté; manuální průchod v dev serveru: výběr
vestavěného archetypu → generování → reload z cache; vytvoření vlastního →
generování; smazání vlastního; přepínání scénářů; /prehled chipy.
