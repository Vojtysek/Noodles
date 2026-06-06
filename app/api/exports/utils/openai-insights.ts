import { OpenAI } from 'openai'
import type { Persona, Scenario } from '@/lib/mock-data'
import { aggregateScenario, isProjectId } from '@/lib/scenarios'

export interface InsightsResult {
  personaArguments: string[]
  counterpoints: string[]
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
  benefits: Array<{ title: string; description: string; meetingPitch?: string }> = []
): Promise<InsightsResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const client = new OpenAI({ apiKey })

  const projectIds = scenario.projectIds.filter(isProjectId)
  const aggregates = aggregateScenario(projectIds)

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
Celkový rozpočet: ${aggregates.budget.toLocaleString('cs-CZ')} Kč
Roční úspory: ${aggregates.savingsPerYear.toLocaleString('cs-CZ')} Kč
Návratnost: ${aggregates.paybackYears} let
Úspora energie: ${aggregates.energySavingPct} %

Nefinanční přínosy (seřazené dle relevance pro tuto personu — využij ty nejrelevantnější):
${benefitsBlock}

Vygeneruj:
1. 3 personalizované argumenty PROČ tato persona by měla souhlasit s rekonstrukcí (každý 1–2 věty, konkrétní, data-driven, šité na míru jejím motivacím). Tam, kde to dává smysl, přirozeně zapracuj relevantní nefinanční přínosy výše.
2. 2 přímé odpovědi na její hlavní námitky (konkrétní řešení nebo alternativa, buduj důvěru)

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
