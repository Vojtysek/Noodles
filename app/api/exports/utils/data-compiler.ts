import {
  projects,
  scenarios as mockScenarios,
  fmtCzk,
  type Project,
  type Scenario,
  type Persona,
  type ProjectId,
} from '@/lib/mock-data'
import { aggregateScenario, isProjectId } from '@/lib/scenarios'
import { createClient } from '@/lib/supabase/server'
import { ARCHETYPES, isArchetypeId } from '@/lib/archetypes'
import { PERSONA_TYPES } from '@/lib/persona-types'
import type { PersonaType } from '@/lib/persona-types'

export interface CompiledData {
  // Scenario info
  scenarioName: string
  scenarioTagline: string
  scenarioId: string

  // Aggregates
  totalProjects: number
  projectNames: string[]
  totalBudget: number
  totalSavingsPerYear: number
  paybackYears: number
  totalFundIncreasePerFlat: number
  totalEnergySavingPct: number

  // Full project list
  projects: Array<{
    id: string
    name: string
    budget: number
    savingsPerYear: number
    paybackYears: number
    fundIncreasePerFlat: number
    energySavingPct: number
    durationMonths: number
    costItems: Array<{ item: string; supplier: string; amount: number; share: number }>
  }>

  // Persona fields (populated only for persona export)
  personaName?: string
  personaRole?: string
  personaSentiment?: string
  personaBrief?: string
  personaTraits?: string[]
  personaMotivations?: string[]
  personaObjections?: string[]
  personaRejects?: string[]
  persona?: Persona

  // AI-generated fields (added by route after compileData)
  personaArguments?: string[]
  counterpoints?: string[]

  // Meta
  generatedDate: string
  documentTitle: string
}

/**
 * Compile all data needed for PDF generation.
 * Fetches the persona server-side from Supabase (or falls back to archetype).
 */
export async function compileData(
  exportType: string,
  personaId?: string,
  scenarioId?: string
): Promise<CompiledData> {
  // ── Resolve scenario ────────────────────────────────────────────────────────
  const allScenarios = mockScenarios
  const defaultScenario = allScenarios[0]
  const targetScenarioId = scenarioId || defaultScenario.id

  let scenario: Scenario
  let selectedProjects: Project[]

  if (targetScenarioId === 'all' && allScenarios.length > 1) {
    // Comparison: union of all project IDs
    const allIds = new Set<ProjectId>()
    allScenarios.forEach((s) => s.projectIds.forEach((id) => { if (isProjectId(id)) allIds.add(id) }))
    selectedProjects = projects.filter((p) => allIds.has(p.id))
    scenario = {
      id: 'all',
      name: 'Porovnání scénářů',
      tagline: 'Všechny projekty ze všech scénářů vedle sebe',
      tone: 'blue',
      projectIds: Array.from(allIds),
    }
  } else {
    scenario = allScenarios.find((s) => s.id === targetScenarioId) ?? defaultScenario
    selectedProjects = projects.filter((p) => scenario.projectIds.includes(p.id as ProjectId))
  }

  const aggregates = aggregateScenario(scenario.projectIds as ProjectId[])

  // ── Base compiled data ──────────────────────────────────────────────────────
  const compiled: CompiledData = {
    scenarioName: scenario.name,
    scenarioTagline: scenario.tagline,
    scenarioId: scenario.id,
    totalProjects: selectedProjects.length,
    projectNames: aggregates.projectNames,
    totalBudget: aggregates.budget,
    totalSavingsPerYear: aggregates.savingsPerYear,
    paybackYears: aggregates.paybackYears,
    totalFundIncreasePerFlat: aggregates.fundIncreasePerFlat,
    totalEnergySavingPct: aggregates.energySavingPct,
    projects: selectedProjects.map((p) => ({
      id: p.id,
      name: p.name,
      budget: p.budget,
      savingsPerYear: p.savingsPerYear,
      paybackYears: p.paybackYears,
      fundIncreasePerFlat: p.fundIncreasePerFlat,
      energySavingPct: p.energySavingPct,
      durationMonths: p.durationMonths,
      costItems: p.costItems,
    })),
    generatedDate: new Date().toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long', day: 'numeric' }),
    documentTitle: getDocumentTitle(exportType, scenario.name),
  }

  // ── Persona data (persona export only) ─────────────────────────────────────
  if (exportType === 'persona' && personaId) {
    const persona = await resolvePersona(personaId)
    if (persona) {
      compiled.persona = persona
      compiled.personaName = persona.name
      compiled.personaRole = persona.role
      compiled.personaSentiment = persona.sentiment
      compiled.personaBrief = persona.brief
      compiled.personaTraits = persona.structured?.traits ?? []
      compiled.personaMotivations = persona.structured?.motivations ?? []
      compiled.personaObjections = persona.structured?.objections ?? []
      compiled.personaRejects = persona.structured?.rejects ?? []
    }
  }

  return compiled
}

/**
 * Resolve a persona by ID: first try Supabase, then fall back to archetype.
 */
async function resolvePersona(personaId: string): Promise<Persona | null> {
  // 1. Check if it's an archetype ID
  if (isArchetypeId(personaId)) {
    const arch = ARCHETYPES.find((a) => a.id === personaId)
    if (arch) {
      return {
        id: arch.id,
        name: arch.name,
        role: arch.subtitle,
        unit: '',
        status: 'zpracovano',
        sentiment: 'vaha',
        brief: arch.description,
        structured: arch.profile,
        personaType: arch.id as PersonaType,
      }
    }
  }

  // 2. Try Supabase — may throw if called outside request context; we catch it
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      unit: data.unit ?? '',
      status: data.status,
      sentiment: data.sentiment,
      brief: data.brief ?? '',
      structured: data.structured ?? null,
      personaType:
        data.persona_type && data.persona_type in PERSONA_TYPES
          ? (data.persona_type as PersonaType)
          : undefined,
    }
  } catch {
    return null
  }
}

function getDocumentTitle(exportType: string, scenarioName: string): string {
  const titles: Record<string, string> = {
    'overall-brief': `Stručný přehled — ${scenarioName}`,
    persona: `Personalizovaný přehled — ${scenarioName}`,
    'overall-detail': `Detailní report — ${scenarioName}`,
    presentation: `Prezentace SVJ — ${scenarioName}`,
  }
  return titles[exportType] ?? `Export — ${scenarioName}`
}

export function formatCurrency(value: number): string {
  return fmtCzk(value)
}
