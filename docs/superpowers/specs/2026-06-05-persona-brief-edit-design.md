# Persona brief edit + regenerace statistik

## Shrnutí

Uživatel může upravit `brief` (textový popis) existující persony přímo v detailu. Po uložení se spustí AI regenerace strukturovaných charakteristik (`traits`, `objections`, `motivations`, `rejects`, `sentiment`) a výsledek se uloží do Supabase.

## UX flow

1. V pravém detailu persony je u textu briefu tlačítko „Upravit" (ikona tužky)
2. Kliknutím se brief přepne na `<textarea>` in-place + zobrazí se „Uložit" / „Zrušit"
3. Po „Uložit": celý detail panel se překryje spinnerem (blokující, synchronní)
4. Po odpovědi API: aktualizuje se brief + structured sekce + sentiment badge

## Backend

**Nový soubor:** `/app/api/personas/[id]/route.ts`

`PATCH { brief: string }` → spustí AI charakterizaci (stejná logika jako POST v `/api/personas/route.ts`) → uloží do Supabase → vrátí aktualizovanou personu.

## Frontend

**Soubor:** `/app/dashboard/rezidenti/page.tsx`

Nové lokální stavy:
- `editingBrief: boolean`
- `draftBrief: string`
- `regenerating: boolean`

Po úspěšném PATCH: aktualizuje záznam v `personaList` (brief + structured + sentiment), vypne edit mode.

## Rozsah

Edituje se pouze `brief`. Jméno, role a unit zůstávají beze změny.
