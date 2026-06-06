// Mock data pro dashboard — pouze FE vrstva, bez napojení na Supabase / AI.
import { PersonaType } from '@/lib/persona-types'

export type ProjectId = "fasada" | "okna" | "strecha" | "vytah" | "zaluzie" | "tepelne-cerpadlo" | "vytapeni" | "rekuperace" | "fotovoltaika"

export type Project = {
  id: ProjectId
  name: string
  shortName: string
  status: "navrh" | "schvalovani" | "realizace"
  /** Pořadí podle dopadu — 1 = nejvýznamnější přínos pro dům. */
  priority: number
  budget: number
  spent: number
  savingsPerYear: number
  paybackYears: number
  fundIncreasePerFlat: number
  energySavingPct: number
  /** Odhadovaná délka realizace v měsících. */
  durationMonths: number
  /** Náklady spojené s danou částí domu dnes a jejich růst, pokud se nerekonstruuje. */
  baseline: { annualCost: number; costGrowthPct: number }
  costBreakdown: { label: string; value: number }[]
  cashflow: { year: string; value: number }[]
  costItems: { item: string; supplier: string; amount: number; share: number }[]
}

export const projects: Project[] = [
  {
    id: "fasada",
    name: "Zateplení fasády",
    shortName: "Fasáda",
    status: "schvalovani",
    priority: 1,
    budget: 8_400_000,
    spent: 480_000,
    savingsPerYear: 620_000,
    paybackYears: 13.5,
    fundIncreasePerFlat: 850,
    energySavingPct: 32,
    durationMonths: 9,
    baseline: { annualCost: 1_350_000, costGrowthPct: 6 },
    costBreakdown: [
      { label: "Izolační materiál", value: 3_100_000 },
      { label: "Lešení a montáž", value: 2_400_000 },
      { label: "Povrchová úprava", value: 1_500_000 },
      { label: "Projektová dokumentace", value: 600_000 },
      { label: "Rezerva", value: 800_000 },
    ],
    cashflow: [
      { year: "2026", value: -8_400_000 },
      { year: "2028", value: -7_160_000 },
      { year: "2030", value: -5_920_000 },
      { year: "2032", value: -4_680_000 },
      { year: "2035", value: -2_820_000 },
      { year: "2039", value: -340_000 },
      { year: "2040", value: 280_000 },
    ],
    costItems: [
      { item: "Izolační desky EPS 150 mm", supplier: "Izolace Praha s.r.o.", amount: 3_100_000, share: 37 },
      { item: "Lešení vč. pronájmu", supplier: "Stav-Lešení a.s.", amount: 1_350_000, share: 16 },
      { item: "Montážní práce", supplier: "Fasády CZ s.r.o.", amount: 1_050_000, share: 12.5 },
      { item: "Silikonová omítka", supplier: "Fasády CZ s.r.o.", amount: 1_500_000, share: 18 },
      { item: "Projekt a stavební dozor", supplier: "Ing. Malý", amount: 600_000, share: 7 },
      { item: "Rezerva 10 %", supplier: "—", amount: 800_000, share: 9.5 },
    ],
  },
  {
    id: "okna",
    name: "Výměna oken",
    shortName: "Okna",
    status: "navrh",
    priority: 2,
    budget: 4_900_000,
    spent: 120_000,
    savingsPerYear: 410_000,
    paybackYears: 12,
    fundIncreasePerFlat: 520,
    energySavingPct: 21,
    durationMonths: 4,
    baseline: { annualCost: 980_000, costGrowthPct: 6 },
    costBreakdown: [
      { label: "Okna a rámy", value: 2_900_000 },
      { label: "Montáž a demontáž", value: 1_100_000 },
      { label: "Parapety a začištění", value: 500_000 },
      { label: "Rezerva", value: 400_000 },
    ],
    cashflow: [
      { year: "2026", value: -4_900_000 },
      { year: "2028", value: -4_080_000 },
      { year: "2030", value: -3_260_000 },
      { year: "2033", value: -2_030_000 },
      { year: "2036", value: -800_000 },
      { year: "2038", value: 20_000 },
      { year: "2040", value: 840_000 },
    ],
    costItems: [
      { item: "Plastová okna 6komorová", supplier: "Okna Bohemia s.r.o.", amount: 2_900_000, share: 59 },
      { item: "Montáž vč. demontáže", supplier: "Okna Bohemia s.r.o.", amount: 1_100_000, share: 22.5 },
      { item: "Vnitřní + vnější parapety", supplier: "Okna Bohemia s.r.o.", amount: 320_000, share: 6.5 },
      { item: "Začištění a malby", supplier: "Malby Dvořák", amount: 180_000, share: 3.5 },
      { item: "Rezerva", supplier: "—", amount: 400_000, share: 8.5 },
    ],
  },
  {
    id: "strecha",
    name: "Rekonstrukce střechy",
    shortName: "Střecha",
    status: "realizace",
    priority: 3,
    budget: 3_200_000,
    spent: 1_950_000,
    savingsPerYear: 180_000,
    paybackYears: 17.8,
    fundIncreasePerFlat: 380,
    energySavingPct: 9,
    durationMonths: 5,
    baseline: { annualCost: 540_000, costGrowthPct: 5 },
    costBreakdown: [
      { label: "Krytina a izolace", value: 1_700_000 },
      { label: "Klempířské prvky", value: 600_000 },
      { label: "Práce", value: 650_000 },
      { label: "Rezerva", value: 250_000 },
    ],
    cashflow: [
      { year: "2026", value: -3_200_000 },
      { year: "2029", value: -2_660_000 },
      { year: "2032", value: -2_120_000 },
      { year: "2036", value: -1_400_000 },
      { year: "2040", value: -680_000 },
      { year: "2043", value: -140_000 },
      { year: "2044", value: 40_000 },
    ],
    costItems: [
      { item: "Střešní krytina + hydroizolace", supplier: "Střechy Novák s.r.o.", amount: 1_700_000, share: 53 },
      { item: "Klempířské prvky a žlaby", supplier: "Klempířství Beneš", amount: 600_000, share: 19 },
      { item: "Pokrývačské práce", supplier: "Střechy Novák s.r.o.", amount: 650_000, share: 20 },
      { item: "Rezerva", supplier: "—", amount: 250_000, share: 8 },
    ],
  },
  {
    id: "vytah",
    name: "Modernizace výtahu",
    shortName: "Výtah",
    status: "navrh",
    priority: 4,
    budget: 2_600_000,
    spent: 0,
    savingsPerYear: 95_000,
    paybackYears: 27.4,
    fundIncreasePerFlat: 310,
    energySavingPct: 4,
    durationMonths: 3,
    baseline: { annualCost: 320_000, costGrowthPct: 8 },
    costBreakdown: [
      { label: "Výtahová technologie", value: 1_800_000 },
      { label: "Stavební úpravy šachty", value: 450_000 },
      { label: "Revize a certifikace", value: 150_000 },
      { label: "Rezerva", value: 200_000 },
    ],
    cashflow: [
      { year: "2026", value: -2_600_000 },
      { year: "2030", value: -2_220_000 },
      { year: "2034", value: -1_840_000 },
      { year: "2040", value: -1_270_000 },
      { year: "2046", value: -700_000 },
      { year: "2052", value: -130_000 },
      { year: "2054", value: 60_000 },
    ],
    costItems: [
      { item: "Výtahová jednotka vč. kabiny", supplier: "Výtahy Schindler CZ", amount: 1_800_000, share: 69 },
      { item: "Stavební úpravy šachty", supplier: "Stavby Kolář s.r.o.", amount: 450_000, share: 17.5 },
      { item: "Revize, certifikace, zkoušky", supplier: "TÜV SÜD Czech", amount: 150_000, share: 6 },
      { item: "Rezerva", supplier: "—", amount: 200_000, share: 7.5 },
    ],
  },
  {
    id: "zaluzie",
    name: "Venkovní žaluzie",
    shortName: "Žaluzie",
    status: "navrh",
    priority: 5,
    budget: 1_600_000,
    spent: 0,
    savingsPerYear: 80_000,
    paybackYears: 20,
    fundIncreasePerFlat: 190,
    energySavingPct: 5,
    durationMonths: 2,
    baseline: { annualCost: 180_000, costGrowthPct: 4 },
    costBreakdown: [
      { label: "Žaluzie a pohony", value: 1_100_000 },
      { label: "Montáž", value: 350_000 },
      { label: "Rezerva", value: 150_000 },
    ],
    cashflow: [
      { year: "2026", value: -1_600_000 },
      { year: "2030", value: -1_280_000 },
      { year: "2035", value: -880_000 },
      { year: "2040", value: -480_000 },
      { year: "2045", value: -80_000 },
      { year: "2046", value: 0 },
    ],
    costItems: [
      { item: "Žaluzie vč. pohonů", supplier: "Stínění CZ s.r.o.", amount: 1_100_000, share: 69 },
      { item: "Montáž a zapojení", supplier: "Stínění CZ s.r.o.", amount: 350_000, share: 22 },
      { item: "Rezerva", supplier: "—", amount: 150_000, share: 9 },
    ],
  },
  {
    id: "tepelne-cerpadlo",
    name: "Tepelné čerpadlo",
    shortName: "TČ",
    status: "navrh",
    priority: 6,
    budget: 3_050_000,
    spent: 0,
    savingsPerYear: 350_000,
    paybackYears: 8.7,
    fundIncreasePerFlat: 380,
    energySavingPct: 45,
    durationMonths: 3,
    baseline: { annualCost: 850_000, costGrowthPct: 9 },
    costBreakdown: [
      { label: "Tepelné čerpadlo vzduch/voda", value: 1_800_000 },
      { label: "Rozvodová soustava", value: 750_000 },
      { label: "Projektová dokumentace", value: 250_000 },
      { label: "Rezerva", value: 250_000 },
    ],
    cashflow: [
      { year: "2026", value: -3_050_000 },
      { year: "2028", value: -2_350_000 },
      { year: "2030", value: -1_650_000 },
      { year: "2032", value: -950_000 },
      { year: "2034", value: -250_000 },
      { year: "2035", value: 100_000 },
    ],
    costItems: [
      { item: "TČ vzduch/voda 60 kW", supplier: "Daikin Czech s.r.o.", amount: 1_800_000, share: 59 },
      { item: "Rozvodové potrubí a armatury", supplier: "Topenáři Praha s.r.o.", amount: 750_000, share: 24.5 },
      { item: "Projekt a revize", supplier: "Ing. Svoboda", amount: 250_000, share: 8 },
      { item: "Rezerva", supplier: "—", amount: 250_000, share: 8.5 },
    ],
  },
  {
    id: "vytapeni",
    name: "Modernizace vytápění",
    shortName: "Vytápění",
    status: "navrh",
    priority: 7,
    budget: 1_030_000,
    spent: 0,
    savingsPerYear: 120_000,
    paybackYears: 8.6,
    fundIncreasePerFlat: 130,
    energySavingPct: 15,
    durationMonths: 2,
    baseline: { annualCost: 480_000, costGrowthPct: 7 },
    costBreakdown: [
      { label: "Kotelna a regulace", value: 620_000 },
      { label: "Rozvody a hlavice", value: 280_000 },
      { label: "Rezerva", value: 130_000 },
    ],
    cashflow: [
      { year: "2026", value: -1_030_000 },
      { year: "2028", value: -790_000 },
      { year: "2030", value: -550_000 },
      { year: "2032", value: -310_000 },
      { year: "2034", value: -70_000 },
      { year: "2035", value: 50_000 },
    ],
    costItems: [
      { item: "Kotel a regulační systém", supplier: "Viessmann CZ s.r.o.", amount: 620_000, share: 60 },
      { item: "Termostatické hlavice a rozvody", supplier: "Topenáři Praha s.r.o.", amount: 280_000, share: 27 },
      { item: "Rezerva", supplier: "—", amount: 130_000, share: 13 },
    ],
  },
  {
    id: "rekuperace",
    name: "Rekuperace vzduchu",
    shortName: "Rekuperace",
    status: "navrh",
    priority: 8,
    budget: 1_000_000,
    spent: 0,
    savingsPerYear: 130_000,
    paybackYears: 7.7,
    fundIncreasePerFlat: 120,
    energySavingPct: 18,
    durationMonths: 4,
    baseline: { annualCost: 300_000, costGrowthPct: 5 },
    costBreakdown: [
      { label: "Vzduchotechnické jednotky", value: 550_000 },
      { label: "Rozvody a montáž", value: 330_000 },
      { label: "Rezerva", value: 120_000 },
    ],
    cashflow: [
      { year: "2026", value: -1_000_000 },
      { year: "2028", value: -740_000 },
      { year: "2030", value: -480_000 },
      { year: "2032", value: -220_000 },
      { year: "2033", value: -90_000 },
      { year: "2034", value: 40_000 },
    ],
    costItems: [
      { item: "Rekuperační jednotky Zehnder", supplier: "Zehnder Group CZ", amount: 550_000, share: 55 },
      { item: "Vzduchovody a tvarovky", supplier: "VZT Montáže s.r.o.", amount: 220_000, share: 22 },
      { item: "Montáž a zprovoznění", supplier: "VZT Montáže s.r.o.", amount: 110_000, share: 11 },
      { item: "Rezerva", supplier: "—", amount: 120_000, share: 12 },
    ],
  },
  {
    id: "fotovoltaika",
    name: "Fotovoltaická elektrárna",
    shortName: "FVE",
    status: "navrh",
    priority: 9,
    budget: 1_200_000,
    spent: 0,
    savingsPerYear: 280_000,
    paybackYears: 4.3,
    fundIncreasePerFlat: 150,
    energySavingPct: 22,
    durationMonths: 2,
    baseline: { annualCost: 550_000, costGrowthPct: 8 },
    costBreakdown: [
      { label: "FV panely a střídač", value: 750_000 },
      { label: "Montáž a zapojení", value: 280_000 },
      { label: "Projekt a revize", value: 100_000 },
      { label: "Rezerva", value: 70_000 },
    ],
    cashflow: [
      { year: "2026", value: -1_200_000 },
      { year: "2027", value: -920_000 },
      { year: "2028", value: -640_000 },
      { year: "2029", value: -360_000 },
      { year: "2030", value: -80_000 },
      { year: "2031", value: 200_000 },
    ],
    costItems: [
      { item: "FV panely 40 kWp", supplier: "SolarEdge Technologies", amount: 600_000, share: 50 },
      { item: "Střídač a baterie", supplier: "SolarEdge Technologies", amount: 150_000, share: 12.5 },
      { item: "Montáž na střechu", supplier: "SolarFix CZ s.r.o.", amount: 280_000, share: 23 },
      { item: "Projekt, revize, připojení", supplier: "Ing. Horák", amount: 100_000, share: 8.5 },
      { item: "Rezerva", supplier: "—", amount: 70_000, share: 6 },
    ],
  },
]

/** Projekty seřazené podle dopadu — používat všude, kde se projekty vypisují. */
export const projectsByPriority = [...projects].sort((a, b) => a.priority - b.priority)

// ---------------------------------------------------------------------------
// Scénáře — předpřipravené kombinace projektů pro stránku Přehled.
// Tři srozumitelné varianty místo volného mix & match (ten zůstává ve Financích).
// ---------------------------------------------------------------------------

export type ScenarioTone = "emerald" | "amber" | "blue"

export type Scenario = {
  id: string
  name: string
  /** Jedna věta lidskou řečí — co scénář znamená. */
  tagline: string
  tone: ScenarioTone
  /** Pořadí určuje harmonogram — projekty se realizují postupně. */
  projectIds: ProjectId[]
}

export const scenarios: Scenario[] = [
  {
    id: "nejnutnejsi",
    name: "Váš plán",
    tagline: "Dokončíme rozjetou střechu a nic dalšího. Nejlevnější a nejrychlejší scénář.",
    tone: "emerald",
    projectIds: ["strecha"],
  },
  {
    id: "kompletni",
    name: "Energie nula",
    tagline: "Všechny čtyři projekty najednou. Nejdražší cesta, ale dům bude hotový na desítky let.",
    tone: "blue",
    projectIds: ["strecha", "okna", "fasada", "vytah"],
  },
]

/** Délka v měsících → česky („5 měsíců", „rok a 2 měsíce", „2 roky"). */
export function fmtDuration(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const monthWord = (n: number) => (n === 1 ? "měsíc" : n < 5 ? "měsíce" : "měsíců")
  const yearWord = (n: number) => (n === 1 ? "rok" : n < 5 ? "roky" : "let")
  if (years === 0) return `${rest} ${monthWord(rest)}`
  const yearPart = years === 1 ? "rok" : `${years} ${yearWord(years)}`
  if (rest === 0) return yearPart
  return `${yearPart} a ${rest} ${monthWord(rest)}`
}

export type Sentiment = "podporuje" | "vaha" | "proti"

export type Persona = {
  id: string
  name: string
  role: string
  unit: string
  status: "zpracovano" | "ceka"
  sentiment: Sentiment
  brief: string
  structured: {
    traits: string[]
    objections: string[]
    motivations: string[]
    rejects: string[]
  } | null
  personaType?: PersonaType
}

export type StrategyPoint = { title: string; detail: string }

export type ExportType = {
  id: string
  title: string
  description: string
  format: "PDF" | "PPTX"
  pages: string
  bestFor: string
  needsPersona: boolean
  includes: string[]
  cta: string
}

export const exportTypes: ExportType[] = [
  {
    id: "overall-brief",
    title: "Stručný přehled",
    description:
      "Obecné informace o scénářích, základní data a hlavní argumenty. Vhodné pro nástěnku nebo hromadný e-mail vlastníkům.",
    format: "PDF",
    pages: "2–3 strany",
    bestFor: "Nejlepší pro: zaneprázdněné rezidenty",
    needsPersona: false,
    includes: [
      "Přehled scénářů a přínosů",
      "Klíčová čísla na jedné straně",
      "Hlavní argumenty pro rekonstrukci",
      "Dopad na fond oprav",
    ],
    cta: "Vygenerovat stručný přehled (PDF)",
  },
  {
    id: "persona",
    title: "Personalizovaný export",
    description:
      "Výběr dat a argumentů upravený pro konkrétní personu — připravený k přímému předložení danému rezidentovi.",
    format: "PDF",
    pages: "3–4 strany",
    bestFor: "Nejlepší pro: jednání 1 : 1",
    needsPersona: true,
    includes: [
      "Argumenty šité na míru personě",
      "Odpovědi na její hlavní námitky",
      "Dopad na její měsíční náklady",
      "Relevantní úspory a přínosy",
    ],
    cta: "Vygenerovat personalizovaný PDF",
  },
  {
    id: "overall-detail",
    title: "Detailní report",
    description:
      "Rozšířená verze se všemi důležitými detaily: rozpočty, rozpady nákladů, predikce návratnosti a harmonogramy.",
    format: "PDF",
    pages: "10–15 stran",
    bestFor: "Nejlepší pro: analytické povahy",
    needsPersona: false,
    includes: [
      "Přehled scénářů a přínosů",
      "Finanční rozpad po položkách",
      "Návratnost a predikce úspor",
      "Harmonogram a milníky",
      "Technické specifikace",
      "Rizika a rezervy",
    ],
    cta: "Vygenerovat detailní report (PDF)",
  },
  {
    id: "presentation",
    title: "Prezentace",
    description:
      "Nejdůležitější metriky a grafy ve formě snímků — připraveno pro promítání na schůzi SVJ.",
    format: "PPTX",
    pages: "8–10 snímků",
    bestFor: "Nejlepší pro: schůze SVJ",
    needsPersona: false,
    includes: [
      "Klíčové metriky a grafy",
      "Porovnání scénářů",
      "Mluvící body ke každému snímku",
      "Příprava na časté dotazy",
    ],
    cta: "Vygenerovat prezentaci (PPTX)",
  },
]

export const distributionTips = [
  {
    title: "Pro analytické rezidenty",
    tip: "Pošlete detailní report e-mailem 3–5 dní před schůzí. Potřebují čas na prostudování.",
  },
  {
    title: "Pro rozhodné povahy",
    tip: "Použijte stručný přehled. Začněte návratností a harmonogramem, buďte struční.",
  },
  {
    title: "Pro vztahové rezidenty",
    tip: "Předejte dokument osobně s krátkým vysvětlením. Zdůrazněte přínos pro celý dům.",
  },
  {
    title: "Pro schůze SVJ",
    tip: "Promítejte prezentaci a mějte detailní report po ruce jako zálohu na dotazy.",
  },
]

export type ExportHistoryItem = {
  id: string
  name: string
  type: string
  format: "PDF" | "PPTX"
  project: string
  createdAt: string
  size: string
}

export const exportHistory: ExportHistoryItem[] = [
  {
    id: "e1",
    name: "Scénář A — stručný přehled",
    type: "Stručný přehled",
    format: "PDF",
    project: "Váš plán",
    createdAt: "2026-06-02",
    size: "1,2 MB",
  },
  {
    id: "e2",
    name: "Argumenty pro paní Novákovou",
    type: "Personalizovaný export",
    format: "PDF",
    project: "Energie nula",
    createdAt: "2026-05-28",
    size: "860 kB",
  },
  {
    id: "e3",
    name: "Scénář B — detailní report",
    type: "Detailní report",
    format: "PDF",
    project: "Energie nula",
    createdAt: "2026-05-21",
    size: "4,8 MB",
  },
  {
    id: "e4",
    name: "Schůze SVJ červen — prezentace",
    type: "Prezentace",
    format: "PPTX",
    project: "Oba scénáře",
    createdAt: "2026-05-15",
    size: "6,1 MB",
  },
]

export function fmtCzk(value: number): string {
  return `${value.toLocaleString("cs-CZ")} Kč`
}

export function fmtCzkShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} mil. Kč`
  if (abs >= 1_000)
    return `${(value / 1_000).toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} tis. Kč`
  return fmtCzk(value)
}