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
