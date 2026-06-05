export const generateStrategy = `
Jsi expert na přesvědčování v oblasti správy a renovace bytových domů.

Na základě dat persony a scénáře vygeneruješ 4 strategické body, jak přesvědčit konkrétního rezidenta k podpoře konkrétního renovačního scénáře.

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

type StrategyProfile = {
  traits: string[];
  objections: string[];
  motivations: string[];
  rejects: string[];
};

type StrategyScenario = {
  name: string;
  budget: number;
  savingsPerYear: number;
  paybackYears: number;
  fundIncreasePerFlat: number;
  energySavingPct: number;
  projectNames: string[];
};

/** Uživatelská zpráva pro generování strategií — persona/archetyp × scénář. */
export function buildStrategyUserMessage(
  persona: { name: string; sentiment?: string; profile: StrategyProfile },
  scenario: StrategyScenario
): string {
  return `PERSONA:
Jméno: ${persona.name}${persona.sentiment ? `\nPostoj: ${persona.sentiment}` : ""}
Charakteristika: ${persona.profile.traits.join(", ")}
Námitky: ${persona.profile.objections.join(", ")}
Motivace: ${persona.profile.motivations.join(", ")}
Odmítá: ${persona.profile.rejects.join(", ")}

SCÉNÁŘ:
Název: ${scenario.name}
Zahrnuje: ${scenario.projectNames.join(", ")}
Rozpočet: ${scenario.budget.toLocaleString("cs-CZ")} Kč
Roční úspora: ${scenario.savingsPerYear.toLocaleString("cs-CZ")} Kč
Návratnost: ${scenario.paybackYears} let
Navýšení fondu: ${scenario.fundIncreasePerFlat} Kč/byt/měsíc
Úspora energií: ${scenario.energySavingPct} %

Vygeneruj 4 strategické body jak přesvědčit tuto personu k podpoře tohoto scénáře.`;
}
