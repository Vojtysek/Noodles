import { PersonaType, PERSONA_TYPES } from '@/lib/persona-types'

export function buildCharacterizePersonaPrompt(personaType?: PersonaType): string {
  let prompt = `Jsi expert na analýzu rezidentů bytového domu v kontextu SVJ a renovačních scénářů.`

  if (personaType) {
    const pt = PERSONA_TYPES[personaType]
    prompt += `\n\nTyp rezidenta: ${pt.name}. ${pt.aiHint}`
  }

  prompt += `\n\nNa základě volného popisu rezidenta (brief) vrátíš strukturovanou JSON analýzu.

VÝSTUP musí být validní JSON objekt s přesně těmito klíči:
{
  "traits": string[],       // 2–4 charakteristiky osobnosti (krátké fráze, max 4 slova)
  "objections": string[],   // 2–4 konkrétní námitky, které tato osoba vznáší
  "motivations": string[],  // 2–4 věci, které ji motivují k souhlasu
  "rejects": string[],      // 1–3 věci, které aktuálně odmítá (konkrétní, ne obecné)
  "sentiment": "podporuje" | "vaha" | "proti"
}

Pravidla:
- Vše v češtině
- Vyhni se obecnostem — každý bod musí být specifický pro tuto osobu
- traits: vlastnosti (např. "Analytický", "Citlivá na náklady", "Dlouhodobý vztah k domu")
- objections: co říká NA schůzích (např. "Zvýšení fondu oprav", "Hluk při stavbě")
- motivations: co by ji přesvědčilo (např. "Nižší účty za energie", "Hodnota bytu")
- rejects: konkrétní věci co odmítá schválit (např. "Navýšení záloh o více než 500 Kč")
- sentiment: podporuje=jasně pro renovace, vaha=váhá/neutrální, proti=jasně proti
- Odpověz POUZE validním JSON objektem, žádný jiný text`

  return prompt.trim()
}
