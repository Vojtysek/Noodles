// Orientační finanční model rekonstrukce SVJ.
//
// Slouží jako ZJEDNODUŠENÝ, orientační odhad financování — NE jako závazná
// nabídka úvěru. Model rozdělí celkovou investici na tři zdroje (vlastní
// kapitál / fond oprav, bezúročný NZÚ úvěr a komerční úvěr), spočítá měsíční
// splátky a pár „FOMO" čísel (kolik stojí nečinnost). Financování vychází ze
// stejných konstant jako kalkulačka v onboardingu (`calcRepair`):
//   - komerční úvěr ≈ 5 % p.a. anuitně,
//   - NZÚ jako 0% (bezúročný) úvěr se stropem 750 000 Kč na byt.

export const COMMERCIAL_RATE = 0.0499 // p.a. — komerční úvěr (≈ 5 %), shodné s onboardingem
export const NZU_LOAN_RATE = 0 // p.a. — NZÚ bezúročný (0%) úvěr
export const MAX_NZU_LOAN_PER_UNIT = 750_000 // strop NZÚ úvěru na byt
export const BUILD_INFLATION_PCT = 6 // roční stavební inflace (%) — pro FOMO
export const RATE_RISK_PCT = 7 // možná budoucí komerční sazba (%) — pro FOMO

export type FinanceInput = {
  budget: number // celková investice (Kč)
  units: number // počet bytů (0 = neznámý → částky na byt = na dům)
  savingsPerYear: number // roční úspora na energiích po rekonstrukci (Kč)
  termYears: number // zvolená doba splácení úvěru (let)
  zakladniKapital?: number // vlastní zdroje vložené do investice (Kč)
}

export type FinanceModel = {
  split: {
    budget: number
    kapital: number // základní kapitál (vlastní zdroje / fond oprav)
    nzu: number // NZÚ 0% úvěr (dotovaná část)
    komercni: number // zbytek — 5% komerční úvěr
  }
  repayment: {
    termYears: number
    nzuMonthly: number // měsíční splátka NZÚ 0% části (jistina/měsíce) — za celý dům
    komercniMonthly: number // měsíční anuita komerční části @ COMMERCIAL_RATE — za celý dům
    totalMonthly: number // nzuMonthly + komercniMonthly
    monthlyPerUnit: number // totalMonthly / units (nebo totalMonthly když units<=0)
    energySavingMonthly: number // savingsPerYear / 12 — za celý dům
    energySavingMonthlyPerUnit: number // / units
    netMonthlyPerUnit: number // monthlyPerUnit - energySavingMonthlyPerUnit (záporné = už v plusu)
  }
  nzuSavings: {
    commercialTotalIfNoNzu: number // kolik byste celkem zaplatili, kdyby NZÚ část byla 5% komerční úvěr (jistina+úrok)
    nzuTotalPaid: number // co reálně zaplatíte s NZÚ (0% → jen jistina)
    totalSaved: number // commercialTotalIfNoNzu - nzuTotalPaid (ušetřený úrok)
  }
  fomo: {
    inflationCostPerYear: number // o kolik dráž bude stejná rekonstrukce za 1 rok (stavební inflace)
    inflationCostIn2Years: number // ... za 2 roky
    heatLossPerYear: number // kolik peněz uteče nečinností každý rok (= savingsPerYear)
    heatLossPerYearPerUnit: number // / units
    rateRiskExtraInterest: number // o kolik víc úroku na komerční části při sazbě RATE_RISK_PCT místo COMMERCIAL_RATE
  }
}

// Měsíční splátka úvěru. Bezúročný úvěr (0%) = prostá jistina / počet měsíců,
// jinak standardní anuitní vzorec.
function monthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0
  if (annualRate === 0) return principal / (years * 12)
  const r = annualRate / 12
  const n = years * 12
  return (principal * (r * (1 + r) ** n)) / ((1 + r) ** n - 1)
}

// Celkem zaplaceno za dobu úvěru (jistina + úrok). U 0% úvěru = jen jistina.
function annuityTotalPaid(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0) return 0
  if (annualRate === 0) return principal
  return monthlyPayment(principal, annualRate, years) * years * 12
}

export function computeFinance(input: FinanceInput): FinanceModel {
  const { budget, units, savingsPerYear, termYears, zakladniKapital = 0 } = input
  // Pro dělení „na byt" — při neznámém počtu bytů počítáme na celý dům.
  const unitsSafe = units > 0 ? units : 1

  // --- Rozdělení zdrojů financování ---
  // Vlastní kapitál se vloží do investice jako první (max do výše rozpočtu),
  // zbytek se dofinancuje: nejdřív bezúročný NZÚ úvěr (do stropu), pak komerční.
  const kapital = Math.min(Math.max(0, Math.round(zakladniKapital)), budget)
  const zbyva = Math.max(0, budget - kapital)
  // Strop NZÚ úvěru: 750 000 Kč × počet bytů. Při neznámém počtu bytů strop neuplatňujeme.
  const loanCap = units > 0 ? MAX_NZU_LOAN_PER_UNIT * units : Infinity
  const nzu = Math.round(Math.min(zbyva, loanCap))
  const komercni = Math.max(0, zbyva - nzu)

  const split = { budget, kapital, nzu, komercni }

  // --- Splátky ---
  const nzuMonthly = Math.round(
    monthlyPayment(split.nzu, NZU_LOAN_RATE, termYears)
  )
  const komercniMonthly = Math.round(
    monthlyPayment(split.komercni, COMMERCIAL_RATE, termYears)
  )
  const totalMonthly = nzuMonthly + komercniMonthly
  const monthlyPerUnit = Math.round(totalMonthly / unitsSafe)
  const energySavingMonthly = Math.round(savingsPerYear / 12)
  const energySavingMonthlyPerUnit = Math.round(savingsPerYear / 12 / unitsSafe)
  const netMonthlyPerUnit = monthlyPerUnit - energySavingMonthlyPerUnit

  const repayment = {
    termYears,
    nzuMonthly,
    komercniMonthly,
    totalMonthly,
    monthlyPerUnit,
    energySavingMonthly,
    energySavingMonthlyPerUnit,
    netMonthlyPerUnit,
  }

  // --- Úspora díky NZÚ (0% místo komerčního úvěru na dotované části) ---
  const commercialTotalIfNoNzu = Math.round(
    annuityTotalPaid(split.nzu, COMMERCIAL_RATE, termYears)
  )
  const nzuTotalPaid = split.nzu
  const totalSaved = Math.max(0, commercialTotalIfNoNzu - nzuTotalPaid)

  const nzuSavings = { commercialTotalIfNoNzu, nzuTotalPaid, totalSaved }

  // --- FOMO: cena nečinnosti ---
  const inflationCostPerYear = Math.round((budget * BUILD_INFLATION_PCT) / 100)
  const inflationCostIn2Years = Math.round(
    budget * ((1 + BUILD_INFLATION_PCT / 100) ** 2 - 1)
  )
  const heatLossPerYear = savingsPerYear
  const heatLossPerYearPerUnit = Math.round(savingsPerYear / unitsSafe)
  const rateRiskExtraInterest = Math.round(
    annuityTotalPaid(split.komercni, RATE_RISK_PCT / 100, termYears) -
      annuityTotalPaid(split.komercni, COMMERCIAL_RATE, termYears)
  )

  const fomo = {
    inflationCostPerYear,
    inflationCostIn2Years,
    heatLossPerYear,
    heatLossPerYearPerUnit,
    rateRiskExtraInterest,
  }

  return { split, repayment, nzuSavings, fomo }
}
