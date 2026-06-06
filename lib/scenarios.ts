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
  "Venkovní žaluzie": "zaluzie",
  "Tepelné čerpadlo": "tepelne-cerpadlo",
  "Vytápění": "vytapeni",
  "Rekuperace": "rekuperace",
  "Fotovoltaika": "fotovoltaika",
  "Modernizace výtahu": "vytah",
}

/**
 * Dva velké scénáře: „Váš plán" (z kalkulace) + „Energie nula".
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
      name: "Váš plán",
      tagline: "Scénáře, které jste zvolili v kalkulaci — modelace jejich přínosu.",
      tone: "emerald",
      projectIds: matchedIds,
    },
    // {
    //   id: "kompletni-obnova",
    //   name: "Energie nula",
    //   tagline:
    //     "Všechny čtyři scénáře najednou. Nejdražší cesta, ale dům bude hotový na desítky let.",
    //   tone: "blue",
    //   projectIds: ["strecha", "okna", "fasada", "vytah"],
    // },
  ]
}

/** Project IDs the user actually picked in the calculator (mapped from labels). */
export function selectedProjectIds(selectedRenovations: string[]): ProjectId[] {
  return selectedRenovations
    .map((label) => RENOVATION_LABEL_TO_PROJECT[label])
    .filter((id): id is ProjectId => id !== undefined)
}

/** Only the projects the user picked — their linked plan, nothing else. */
export function userProjects(selectedRenovations: string[]) {
  const ids = selectedProjectIds(selectedRenovations)
  return projects.filter((p) => ids.includes(p.id))
}

/**
 * A single scenario representing only the user's own selection.
 * Returns [] when the user has no mapped renovations (no plan yet).
 */
export function userScenarios(selectedRenovations: string[]): Scenario[] {
  const ids = selectedProjectIds(selectedRenovations)
  if (ids.length === 0) return []
  return [
    {
      id: "vase-vybrane",
      name: "Váš plán",
      tagline:
        "Scénáře, které jste zvolili v kalkulaci — modelace jejich přínosu.",
      tone: "emerald",
      projectIds: ids,
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
