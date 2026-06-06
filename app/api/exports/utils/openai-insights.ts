import { OpenAI } from 'openai'
import type { Persona, Scenario } from '@/lib/mock-data'

export interface InsightsResult {
  personaArguments: string[]
  counterpoints: string[]
}

/** Already-correct aggregates from the real financial model (Finance page). */
export interface InsightsAggregates {
  budget: number
  savingsPerYear: number
  breakEvenYear: number | null
  savingsPctOfCosts: number
  fundMonthlyPerUnit: number
  energySavingMonthlyPerUnit: number
  units: number
}

/**
 * Generate AI-powered persuasion insights for a persona about a scenario.
 * Returns 3 personalised arguments and 2 counterpoints to their objections.
 *
 * @throws Error when OPENAI_API_KEY is missing or the API call fails
 */
export async function generateInsights(
  persona: Persona,
  scenario: Scenario,
  aggregates: InsightsAggregates,
  benefits: Array<{ title: string; description: string; meetingPitch?: string }> = []
): Promise<InsightsResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const client = new OpenAI({ apiKey })

  const motivations = persona.structured?.motivations?.join(', ') || '—'
  const objections = persona.structured?.objections?.join(', ') || '—'
  const traits = persona.structured?.traits?.join(', ') || '—'

  const benefitsBlock =
    benefits.length > 0
      ? benefits
          .slice(0, 5)
          .map((b) =>
            b.meetingPitch
              ? `- ${b.title}: ${b.description}\n  Jak to říct na schůzi: „${b.meetingPitch}"`
              : `- ${b.title}: ${b.description}`
          )
          .join('\n')
      : '—'

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `Jsi expert na komunikaci s rezidenty bytových domů o rekonstrukcích a energetických úsporách.

Persona: ${persona.name}, ${persona.role}
Vlastnosti: ${traits}
Sentiment: ${persona.sentiment} (podporuje/váhá/proti rekonstrukci)
Motivace: ${motivations}
Námitky: ${objections}

Scénář rekonstrukce: ${scenario.name} — ${scenario.tagline}
Celková investice (celý dům): ${aggregates.budget.toLocaleString('cs-CZ')} Kč
Roční úspora na energiích (celý dům): ${aggregates.savingsPerYear.toLocaleString('cs-CZ')} Kč
Úspora na energiích na byt: ~${aggregates.energySavingMonthlyPerUnit.toLocaleString('cs-CZ')} Kč/měsíc
Příspěvek do fondu (splátka) na byt: ~${aggregates.fundMonthlyPerUnit.toLocaleString('cs-CZ')} Kč/měsíc po dobu splácení
Roční náklady domu klesnou o ${aggregates.savingsPctOfCosts} %
Investice se vrátí v roce ${aggregates.breakEvenYear ?? 'za horizontem 15 let'}

Nefinanční přínosy (seřazené dle relevance pro tuto personu — využij ty nejrelevantnější):
${benefitsBlock}

Piš přímo této osobě, jako bys jí psal osobní dopis. Oslovuj ji ve druhé osobě (vykání: Vy, vám, váš byt). Text bude tato osoba číst sama doma — nepiš o ní ve třetí osobě, nepiš pokyny pro někoho jiného. Buď vřelý, uctivý a osobní, ale zároveň konkrétní a opřený o data výše.

Vygeneruj:
1. 3 osobní důvody, proč je tato rekonstrukce výhodná právě pro vás (každý 1–2 věty, konkrétní, data-driven, navázané na to, na čem této osobě záleží). Tam, kde to dává smysl, přirozeně zohledni relevantní nefinanční přínosy výše.
2. 2 vstřícné odpovědi na obavy, které byste mohli mít (nejprve s pochopením uznej obavu, pak nabídni konkrétní řešení nebo ujištění a buduj důvěru). Píšeš přímo tomu, kdo tu obavu má.

Odpověz jako JSON: { "arguments": ["...", "...", "..."], "counterpoints": ["...", "..."] }`,
      },
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from OpenAI')
  }

  const parsed = JSON.parse(content) as { arguments?: string[]; counterpoints?: string[] }

  return {
    personaArguments: Array.isArray(parsed.arguments) ? parsed.arguments : [],
    counterpoints: Array.isArray(parsed.counterpoints) ? parsed.counterpoints : [],
  }
}
