export const returnData: { [key: string]: [number, number] } = {
  facades: [1.3, 0.2],
  roof: [1.2, 0.18],
  windows: [3, 1],
  externalBlinds: [0.6, 0.1],
}

export const calcReturn = (area: number, type: string): number => {
  return Number(
    ((returnData[type][0] - returnData[type][1]) *
      area *
      14 *
      (4400 / 1000) *
      2) /
      12
  )
}

export const calcBlinds = (windowArea: number): number => {
  const gOld = 0.6
  const gNew = 0.1
  const irradiance = 150
  const hours = 1000
  const priceKwh = 2
  const cop = 2.5

  const savingKwh =
    ((gOld - gNew) * windowArea * irradiance * hours) / 1000 / cop
  return (savingKwh * priceKwh) / 12
}

export const calcHeatPump = (
  annualHeatDemand: number,
  copOld: number,
  priceOld: number,
  copNew: number = 3.5,
  priceNew: number = 5
): number => {
  const costOld = (annualHeatDemand / copOld) * priceOld
  const costNew = (annualHeatDemand / copNew) * priceNew
  return (costOld - costNew) / 12
}

export const calcHeatingSystem = (annualHeatingCost: number): number => {
  const efficiencyGain = 0.15 // 15 % průměrná úspora
  return (annualHeatingCost * efficiencyGain) / 12
}

export const calcRecuperation = (
  annualHeatDemand: number,
  ventilationLoss: number = 0.4,
  efficiency: number = 0.8,
  priceKwh: number = 2
): number => {
  const saving = annualHeatDemand * ventilationLoss * efficiency
  return (saving * priceKwh) / 12
}

export const calcPhotovoltaics = (
  installedKwp: number,
  selfConsumption: number = 0.6,
  gridPrice: number = 5,
  feedInPrice: number = 2
): number => {
  const annualProduction = installedKwp * 1050 // kWh/kWp/rok v ČR
  const saved = annualProduction * selfConsumption * gridPrice
  const sold = annualProduction * (1 - selfConsumption) * feedInPrice
  return (saved + sold) / 12
}

import type { Project } from "@/lib/mock-data"

// --- Napojení formulí na projekty -------------------------------------------
// Geometrie odvozená z RÚIAN dat — stejný model jako onboarding:
// facade = zastavěná plocha × patra; 15 % fasády jsou okna, 85 % plná stěna.
export type SavingsGeometry = {
  footprint: number // zastavěná plocha (m²)
  floors: number
  facade: number // footprint × floors
  windowArea: number // facade × 0.15
  wallArea: number // facade × 0.85
  units: number
}

/** Sestaví geometrii pro formule úspor z hrubých dat budovy (RÚIAN). */
export function buildSavingsGeometry(
  footprint: number | null | undefined,
  floors: number | null | undefined,
  units: number | null | undefined
): SavingsGeometry | null {
  if (!footprint || !floors || footprint <= 0 || floors <= 0) return null
  const facade = footprint * floors
  return {
    footprint,
    floors,
    facade,
    windowArea: facade * 0.15,
    wallArea: facade * 0.85,
    units: units ?? 0,
  }
}

// Měrná potřeba tepla staršího SVJ před rekonstrukcí (kWh/m²/rok).
const SPECIFIC_HEAT_DEMAND = 120
// Cena „staré" energie (plyn / CZT) Kč/kWh — vstup pro tepelné formule.
const OLD_ENERGY_PRICE = 2.5
// Účinnost / COP původního zdroje (přímotop ≈ 1, plyn ≈ 0,95).
const OLD_HEAT_COP = 1

// Vytápěná podlahová plocha ≈ zastavěná plocha × patra.
const heatedFloorArea = (g: SavingsGeometry) => g.footprint * g.floors
// Roční potřeba tepla domu (kWh/rok).
const annualHeatDemand = (g: SavingsGeometry) =>
  heatedFloorArea(g) * SPECIFIC_HEAT_DEMAND
// Instalovaný výkon FVE z využitelné části střechy (~5,5 m²/kWp).
const installedKwp = (g: SavingsGeometry) => (g.footprint * 0.4) / 5.5

/**
 * Roční úspora (Kč/rok) jednoho projektu spočtená z fyzikálních formulí výše.
 * Formule vrací měsíční úsporu, proto ×12. Vrací null pro projekty bez vzorce
 * (např. výtah) — pro ně se použije fallback ze škálovaných mock dat.
 */
export function projectAnnualSavings(
  projectId: string,
  g: SavingsGeometry
): number | null {
  switch (projectId) {
    case "fasada":
      return calcReturn(g.wallArea, "facades") * 12
    case "strecha":
      return calcReturn(g.footprint, "roof") * 12
    case "okna":
      return calcReturn(g.windowArea, "windows") * 12
    case "zaluzie":
      return calcBlinds(g.windowArea) * 12
    case "tepelne-cerpadlo":
      return calcHeatPump(annualHeatDemand(g), OLD_HEAT_COP, OLD_ENERGY_PRICE) * 12
    case "vytapeni":
      return calcHeatingSystem(annualHeatDemand(g) * OLD_ENERGY_PRICE) * 12
    case "rekuperace":
      return calcRecuperation(annualHeatDemand(g)) * 12
    case "fotovoltaika":
      return calcPhotovoltaics(installedKwp(g)) * 12
    default:
      return null
  }
}

// --- Energetická úspora v % --------------------------------------------------
// Spotřeba elektřiny domu (společné prostory + byty) — měrná intenzita kWh/m²/rok.
// Reálné rozmezí staršího bytového domu v ČR je ~20–30 kWh/m²/rok.
const ELECTRICITY_INTENSITY = 28
// Maloobchodní cena elektřiny vč. distribuce (Kč/kWh).
const ELECTRICITY_PRICE = 5

/**
 * Referenční dům pro výpočet energetických %, když nemáme konkrétní geometrii
 * z RÚIAN (typické starší SVJ: 300 m² zastavěné plochy, 5 NP, 24 b.j.).
 * Slouží jako default pro statické zobrazení (badge u projektu, splash bez domu).
 */
export const REFERENCE_GEOMETRY: SavingsGeometry = buildSavingsGeometry(300, 5, 24)!

/**
 * Dnešní roční náklady domu na energie (Kč/rok) — JEDINÝ společný jmenovatel
 * pro všechna energetická %. Teplo na vytápění + elektřina.
 */
export function buildingEnergyCost(g: SavingsGeometry): number {
  const heatCost = annualHeatDemand(g) * OLD_ENERGY_PRICE
  const elecCost = heatedFloorArea(g) * ELECTRICITY_INTENSITY * ELECTRICITY_PRICE
  return heatCost + elecCost
}

/**
 * Energetická úspora jednoho opatření jako % dnešních nákladů domu na energie.
 * Čitatel je reálná Kč úspora z fyzikálních formulí (projectAnnualSavings),
 * jmenovatel je sdílený (buildingEnergyCost) — proto se výsledná % dají sčítat.
 * Vrací null pro projekty bez vzorce (např. výtah).
 */
export function projectEnergySavingPct(
  projectId: string,
  g: SavingsGeometry
): number | null {
  const saving = projectAnnualSavings(projectId, g)
  if (saving == null) return null
  const base = buildingEnergyCost(g)
  if (base <= 0) return 0
  return Math.round((saving / base) * 100)
}

/**
 * Energetická úspora scénáře v % — součet úspor přes vybrané projekty dělený
 * stejným jmenovatelem. Díky sdílené základně je součet metodicky správný
 * (na rozdíl od sčítání předpočítaných procent). Cap 90 % zohledňuje překryv
 * opatření (obálka + zdroj tepla působí na stejnou potřebu — first-order model).
 */
export function scenarioEnergySavingPct(
  projectIds: readonly string[],
  g: SavingsGeometry
): number {
  const base = buildingEnergyCost(g)
  if (base <= 0) return 0
  const totalSaving = projectIds.reduce((sum, id) => {
    const s = projectAnnualSavings(id, g)
    return sum + (s ?? 0)
  }, 0)
  return Math.min(90, Math.round((totalSaving / base) * 100))
}

// --- Sdílený agregát financí (shodný se stránkou Finance) --------------------
// Výchozí rok modelace — stejný jako START_YEAR na stránce Finance.
export const FIN_START_YEAR = 2026

/**
 * Naškáluje vybrané projekty na konkrétní dům: přepíše rozpočet skutečnými
 * náklady z kalkulace a roční úsporu spočítá z fyzikálních formulí (fallback:
 * škálovaný mock). Přesně shodné s logikou na stránce Finance.
 */
export function scaleProjectsToBuilding(
  baseProjects: Project[],
  costsByProject: Record<string, number> | null,
  geometry: SavingsGeometry | null
): Project[] {
  return baseProjects.map((p) => {
    // Roční úspora z fyzikálních formulí (calc.ts). null = projekt bez vzorce.
    const formulaSavings = geometry ? projectAnnualSavings(p.id, geometry) : null
    const projectCost = costsByProject?.[p.id]

    // Bez nákladů z kalkulace ponecháme základní rozpočet,
    // jen případně přepíšeme úsporu spočtenou z formulí.
    if (!projectCost || projectCost <= 0) {
      return formulaSavings != null
        ? { ...p, savingsPerYear: Math.round(formulaSavings) }
        : p
    }

    const sf = projectCost / p.budget
    return {
      ...p,
      budget: projectCost,
      spent: 0,
      savingsPerYear:
        formulaSavings != null
          ? Math.round(formulaSavings)
          : Math.round(p.savingsPerYear * sf),
      fundIncreasePerFlat: Math.round(p.fundIncreasePerFlat * sf),
      baseline: {
        ...p.baseline,
        annualCost: Math.round(p.baseline.annualCost * sf),
      },
      costBreakdown: p.costBreakdown.map((cb) => ({
        ...cb,
        value: Math.round(cb.value * sf),
      })),
      costItems: p.costItems.map((ci) => ({
        ...ci,
        amount: Math.round(ci.amount * sf),
      })),
      cashflow: p.cashflow.map((cf) => ({
        ...cf,
        value: Math.round(cf.value * sf),
      })),
    }
  })
}

/**
 * Index roku bodu zlomu z plných ročních kumulativních polí (0 = výchozí rok),
 * interpolovaný mezi roky. `withArr` je scénář s rekonstrukcí (kvůli investici
 * startuje výš), `withoutArr` bez ní. Čistá funkce — kopie z charts.tsx, aby ji
 * bylo možné použít i na serveru (charts.tsx je 'use client').
 */
export function crossingYearIndex(
  withArr: number[],
  withoutArr: number[]
): number | null {
  const n = Math.min(withArr.length, withoutArr.length)
  for (let i = 0; i < n - 1; i++) {
    const d0 = withArr[i] - withoutArr[i]
    const d1 = withArr[i + 1] - withoutArr[i + 1]
    if (d0 > 0 && d1 <= 0) {
      const frac = d0 / (d0 - d1)
      return i + frac
    }
  }
  return null
}

export interface FinancialsResult {
  budget: number
  savingsPerYear: number
  fundIncreasePerFlat: number
  annualCost: number
  growthPct: number
  annualWithout: number[]
  annualWith: number[]
  cumWithout: number[]
  cumWith: number[]
  breakEvenYearIndex: number | null
  breakEvenYear: number | null
  lossAtHorizon: number
  savingsPct: number
  units: number
}

/**
 * Spočítá finanční agregát plánu — JEDINÝ zdroj pravdy sdílený stránkou Finance
 * i PDF exportem. Replikuje math z `agg` useMemo na stránce Finance.
 */
export function computeFinancials(input: {
  projects: Project[]
  costsByProject: Record<string, number> | null
  footprint: number | null
  floors: number | null
  units: number | null
  horizon?: number
}): FinancialsResult {
  const horizon = input.horizon ?? 15
  const geometry = buildSavingsGeometry(
    input.footprint,
    input.floors,
    input.units
  )
  const scaled = scaleProjectsToBuilding(
    input.projects,
    input.costsByProject,
    geometry
  )

  const budget = scaled.reduce((sum, p) => sum + p.budget, 0)
  const savingsPerYear = scaled.reduce((sum, p) => sum + p.savingsPerYear, 0)
  const fundIncreasePerFlat = scaled.reduce(
    (sum, p) => sum + p.fundIncreasePerFlat,
    0
  )
  const annualCost = scaled.reduce((sum, p) => sum + p.baseline.annualCost, 0)
  // Růst nákladů vážený podle jejich výše (guard dělení nulou).
  const growth =
    annualCost === 0
      ? 0
      : scaled.reduce(
          (sum, p) => sum + p.baseline.costGrowthPct * p.baseline.annualCost,
          0
        ) /
        annualCost /
        100

  // Roční modelace obou scénářů — shodná s agg useMemo.
  const annualWithout: number[] = []
  const annualWith: number[] = []
  const cumWithout: number[] = [0]
  const cumWith: number[] = [budget]
  for (let t = 0; t <= horizon; t++) {
    const factor = Math.pow(1 + growth, t)
    annualWithout.push(annualCost * factor)
    annualWith.push((annualCost - savingsPerYear) * factor)
    if (t > 0) {
      cumWithout.push(cumWithout[t - 1] + annualWithout[t - 1])
      cumWith.push(cumWith[t - 1] + annualWith[t - 1])
    }
  }

  const lossAtHorizon = cumWithout[horizon] - cumWith[horizon]
  const breakEvenYearIndex = crossingYearIndex(cumWith, cumWithout)
  const breakEvenYear =
    breakEvenYearIndex !== null
      ? Math.round(FIN_START_YEAR + breakEvenYearIndex)
      : null
  const savingsPct =
    annualCost > 0 ? Math.round((savingsPerYear / annualCost) * 100) : 0

  return {
    budget,
    savingsPerYear,
    fundIncreasePerFlat,
    annualCost,
    growthPct: growth * 100,
    annualWithout,
    annualWith,
    cumWithout,
    cumWith,
    breakEvenYearIndex,
    breakEvenYear,
    lossAtHorizon,
    savingsPct,
    units: input.units ?? 0,
  }
}
