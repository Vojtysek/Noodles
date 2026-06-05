// Sdílená logika scénářů — dynamické scénáře z kalkulace budovy a agregace
// čísel pro AI generování strategií. Používá Přehled, Rezidenti i API.
import {
  projects,
  scenarios as staticScenarios,
  type ProjectId,
  type Scenario,
} from "@/lib/mock-data"

/** Mapování názvů renovací z kalkulačky (tabulka buildings) na projekty. */
export const RENOVATION_LABEL_TO_PROJECT: Record<string, ProjectId> = {
  "Okna": "okna",
  "Zateplení fasády": "fasada",
  "Zateplení střechy": "strecha",
}

/**
 * Dva velké scénáře: „Co jste si vybrali" (z kalkulace) + „Kompletní obnova".
 * Bez kalkulace fallback na oba statické scénáře z mock-data.
 */
export function buildDynamicScenarios(selectedRenovations: string[]): Scenario[] {
  const matchedIds = selectedRenovations
    .map((label) => RENOVATION_LABEL_TO_PROJECT[label])
    .filter((id): id is ProjectId => id !== undefined)

  if (matchedIds.length === 0) {
    return staticScenarios
  }

  return [
    {
      id: "vase-vybrane",
      name: "Jen to nejnutnější",
      tagline: "Scénáře, které jste zvolili v kalkulaci — modelace jejich přínosu.",
      tone: "emerald",
      projectIds: matchedIds,
    },
    {
      id: "kompletni-obnova",
      name: "Kompletní obnova",
      tagline:
        "Všechny čtyři scénáře najednou. Nejdražší cesta, ale dům bude hotový na desítky let.",
      tone: "blue",
      projectIds: ["strecha", "okna", "fasada", "vytah"],
    },
  ]
}

export function isProjectId(value: string): value is ProjectId {
  return projects.some((p) => p.id === value)
}

/**
 * Klíč scénáře pro cache strategií — seřazená ID projektů. Změna výběru
 * v kalkulaci tak automaticky znamená nový cache záznam.
 */
export function scenarioKey(projectIds: readonly ProjectId[]): string {
  return [...projectIds].sort().join("+")
}

export type ScenarioAggregates = {
  budget: number
  savingsPerYear: number
  paybackYears: number
  fundIncreasePerFlat: number
  energySavingPct: number
  projectNames: string[]
}

/** Souhrnná čísla scénáře pro prompt — součty přes vybrané projekty. */
export function aggregateScenario(projectIds: readonly ProjectId[]): ScenarioAggregates {
  const selected = projects.filter((p) => projectIds.includes(p.id))
  const budget = selected.reduce((sum, p) => sum + p.budget, 0)
  const savingsPerYear = selected.reduce((sum, p) => sum + p.savingsPerYear, 0)
  return {
    budget,
    savingsPerYear,
    paybackYears: savingsPerYear > 0 ? Math.round((budget / savingsPerYear) * 10) / 10 : 0,
    fundIncreasePerFlat: selected.reduce((sum, p) => sum + p.fundIncreasePerFlat, 0),
    energySavingPct: selected.reduce((sum, p) => sum + p.energySavingPct, 0),
    projectNames: selected.map((p) => p.name),
  }
}
