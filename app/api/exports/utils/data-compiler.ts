import {
  projects,
  scenarios as mockScenarios,
  fmtCzk,
  type Project,
  type Scenario,
  type Persona,
  type ProjectId,
} from '@/lib/mock-data'
import { aggregateScenario, isProjectId, userScenarios } from '@/lib/scenarios'
import { computeFinancials } from '@/app/dashboard/financials/calc'
import { computeFinance } from '@/lib/finance-model'
import { createClient } from '@/lib/supabase/server'
import { ARCHETYPES, isArchetypeId } from '@/lib/archetypes'
import { PERSONA_TYPES } from '@/lib/persona-types'
import type { PersonaType } from '@/lib/persona-types'
import {
  selectBenefits,
  rankBenefitsForPersona,
  BENEFIT_CATEGORIES,
  NON_FINANCIAL_BENEFITS,
  type BenefitCategory,
} from '@/lib/benefits'
import { fetchNonFinancialBenefits } from '@/lib/benefits-db'

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

  // Real financial model (shared with Finance dashboard page)
  breakEvenYear?: number | null
  savingsPctOfCosts?: number
  fundMonthlyPerUnit?: number
  energySavingMonthlyPerUnit?: number
  netMonthlyPerUnit?: number
  units?: number
  horizonYears?: number

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

  // Non-financial benefits (ranked for persona export, impact-sorted otherwise)
  benefits: Array<{
    id: string
    category: BenefitCategory
    categoryLabel: string
    title: string
    description: string
    impact: number
    projectName: string
    meetingPitch?: string
  }>

  // Persona fields (populated only for persona export)
  personaName?: string
  personaRole?: string
  personaSentiment?: string
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
  // Scénáře odvozujeme z renovací vybraných v onboardingu (tabulka buildings).
  // Mock scénáře slouží jen jako fallback bez přihlášení / bez kalkulace.
  // createClient může mimo request kontext vyhodit výjimku — proto try/catch.
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null
  try {
    supabase = await createClient()
  } catch {
    supabase = null
  }

  type BuildingRow = {
    selected_renovations: string[] | null
    costs_by_project: Record<string, number> | null
    units: number | null
    zastavena_plocha: number | null
    floors: number | null
    zakladni_kapital: number | null
    rent_years: number | null
  }

  let builtScenarios: Scenario[] = []
  let building: BuildingRow | null = null
  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('buildings')
          .select(
            'selected_renovations, costs_by_project, units, zastavena_plocha, floors, zakladni_kapital, rent_years'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        building = (data as BuildingRow | null) ?? null
        builtScenarios = userScenarios(
          (building?.selected_renovations as string[] | undefined) ?? []
        )
      }
    } catch {}
  }

  const allScenarios = builtScenarios.length > 0 ? builtScenarios : mockScenarios
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

  // ── Real financial model — IDENTICAL to the Finance dashboard page ──────────
  // Single source of truth: computeFinancials replicates the Finance page's
  // `agg` math; computeFinance gives the per-flat repayment/saving figures.
  const fin0 = computeFinancials({
    projects: selectedProjects,
    costsByProject: building?.costs_by_project ?? null,
    footprint: building?.zastavena_plocha ?? null,
    floors: building?.floors ?? null,
    units: building?.units ?? null,
    horizon: 15,
  })

  // Doba splácení dle ceny renovace — stejné pravidlo jako v onboardingu/Finance:
  // do 1,5 mil. Kč max 10 let, nad 1,5 mil. Kč max 15 let.
  let termYears = building?.rent_years && building.rent_years > 0 ? building.rent_years : 10
  const maxTerm = fin0.budget >= 1_500_000 ? 15 : 10
  if (termYears > maxTerm) termYears = maxTerm

  const fin = computeFinance({
    budget: fin0.budget,
    units: building?.units ?? 0,
    savingsPerYear: fin0.savingsPerYear,
    termYears,
    zakladniKapital: building?.zakladni_kapital ?? 0,
  })

  // ── Non-financial benefits ──────────────────────────────────────────────────
  // Katalog načteme z DB (renovation_benefits) s fallbackem na statický katalog.
  let benefitCatalog = NON_FINANCIAL_BENEFITS
  if (supabase) {
    try {
      benefitCatalog = await fetchNonFinancialBenefits(supabase)
    } catch {
      benefitCatalog = NON_FINANCIAL_BENEFITS
    }
  }

  const projectNameById = new Map(projects.map((p) => [p.id, p.name]))
  const rawBenefits = selectBenefits(benefitCatalog, scenario.projectIds as ProjectId[])
  const compiledBenefits = rawBenefits.map((b) => ({
    id: b.id,
    category: b.category,
    categoryLabel: BENEFIT_CATEGORIES[b.category].label,
    title: b.title,
    description: b.description,
    impact: b.impact,
    projectName: b.projectId === null ? 'Celý dům' : projectNameById.get(b.projectId) ?? b.projectId,
    meetingPitch: b.meetingPitch,
  }))

  // ── Base compiled data ──────────────────────────────────────────────────────
  const compiled: CompiledData = {
    scenarioName: scenario.name,
    scenarioTagline: scenario.tagline,
    scenarioId: scenario.id,
    totalProjects: selectedProjects.length,
    projectNames: aggregates.projectNames,
    totalBudget: fin0.budget,
    totalSavingsPerYear: fin0.savingsPerYear,
    // Roky do bodu zlomu (návratnosti) z reálné modelace.
    paybackYears: fin0.breakEvenYearIndex !== null ? Math.round(fin0.breakEvenYearIndex) : 0,
    totalFundIncreasePerFlat: fin0.fundIncreasePerFlat,
    // % snížení ročních nákladů (NE fiktivní „úspora energie").
    totalEnergySavingPct: fin0.savingsPct,
    // Reálný finanční model — sdílený se stránkou Finance.
    breakEvenYear: fin0.breakEvenYear,
    savingsPctOfCosts: fin0.savingsPct,
    fundMonthlyPerUnit: fin.repayment.monthlyPerUnit,
    energySavingMonthlyPerUnit: fin.repayment.energySavingMonthlyPerUnit,
    netMonthlyPerUnit: fin.repayment.netMonthlyPerUnit,
    units: building?.units ?? 0,
    horizonYears: 15,
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
    benefits: compiledBenefits,
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
      compiled.personaTraits = persona.structured?.traits ?? []
      compiled.personaMotivations = persona.structured?.motivations ?? []
      compiled.personaObjections = persona.structured?.objections ?? []
      compiled.personaRejects = persona.structured?.rejects ?? []

      // Re-rank benefits so the persona's preferred categories come first
      const rankedBenefits = rankBenefitsForPersona(rawBenefits, persona.personaType)
      compiled.benefits = rankedBenefits.map((b) => ({
        id: b.id,
        category: b.category,
        categoryLabel: BENEFIT_CATEGORIES[b.category].label,
        title: b.title,
        description: b.description,
        impact: b.impact,
        projectName: b.projectId === null ? 'Celý dům' : projectNameById.get(b.projectId) ?? b.projectId,
        meetingPitch: b.meetingPitch,
      }))
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
