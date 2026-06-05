// Mock data pro dashboard — pouze FE vrstva, bez napojení na Supabase / AI.
import { PersonaType } from '@/lib/persona-types'

export type ProjectId = "fasada" | "okna" | "strecha" | "vytah"

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
    name: "Jen to nejnutnější",
    tagline: "Dokončíme rozjetou střechu a nic dalšího. Nejlevnější a nejrychlejší varianta.",
    tone: "emerald",
    projectIds: ["strecha"],
  },
  {
    id: "kompromis",
    name: "Rozumný kompromis",
    tagline: "Střecha plus nová okna — citelná úspora energií za rozumný měsíční příspěvek.",
    tone: "amber",
    projectIds: ["strecha", "okna"],
  },
  {
    id: "kompletni",
    name: "Kompletní obnova",
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

export const personas: Persona[] = [
  {
    id: "novakova",
    name: "Paní Nováková",
    role: "Důchodkyně, vlastník 35 let",
    unit: "Byt 2+1, 3. patro",
    status: "zpracovano",
    sentiment: "proti",
    brief:
      "Paní Nováková je v důchodu a v domě bydlí přes třicet let. Žije z fixního příjmu a každé zvýšení fondu oprav ji reálně bolí. Rekonstrukcím nevěří, protože si pamatuje nepovedenou opravu stoupaček. Vadí jí hluk a nepořádek během stavby. Aktuálně odmítá zateplení fasády, protože podle ní „dům stál padesát let a stát bude dál“.",
    structured: {
      traits: ["Konzervativní", "Citlivá na náklady", "Dlouhodobý vztah k domu"],
      objections: ["Zvýšení fondu oprav", "Hluk a nepořádek při stavbě", "Nedůvěra po minulé špatné zkušenosti"],
      motivations: ["Stabilita měsíčních výdajů", "Klid v domě", "Hodnota bytu pro vnoučata"],
      rejects: ["Zateplení fasády", "Navýšení záloh o více než 500 Kč"],
    },
  },
  {
    id: "dvorak",
    name: "Pan Dvořák",
    role: "Investor, byt pronajímá",
    unit: "Byt 3+kk, 5. patro",
    status: "zpracovano",
    sentiment: "vaha",
    brief:
      "Pan Dvořák byt pronajímá a v domě se téměř nevyskytuje. Zajímá ho čistě návratnost — kolik investice přidá na nájmu nebo ceně bytu. Vadí mu dlouhé schvalovací procesy a schůze SVJ považuje za ztrátu času. Odmítá projekty s návratností delší než 15 let, výtah považuje za zbytečný luxus.",
    structured: {
      traits: ["Analytický", "Orientovaný na výnos", "Minimální osobní vazba na dům"],
      objections: ["Dlouhá návratnost", "Neefektivní schůze", "Náklady bez vlivu na nájem"],
      motivations: ["Růst ceny bytu", "Vyšší nájemné", "Rychlé a věcné rozhodování"],
      rejects: ["Modernizace výtahu", "Projekty s návratností nad 15 let"],
    },
  },
  {
    id: "svobodovi",
    name: "Rodina Svobodova",
    role: "Mladá rodina, 2 děti",
    unit: "Byt 4+kk, 2. patro",
    status: "zpracovano",
    sentiment: "podporuje",
    structured: {
      traits: ["Pro-renovační", "Citliví na bezpečnost", "Omezený rozpočet (hypotéka)"],
      objections: ["Jednorázové vysoké platby", "Stavební práce o prázdninách"],
      motivations: ["Nižší účty za energie", "Bezpečné a moderní bydlení", "Hodnota bytu"],
      rejects: ["Mimořádný jednorázový příspěvek nad 30 000 Kč"],
    },
    brief:
      "Svobodovi se přistěhovali před třemi lety, mají hypotéku a dvě malé děti. Renovace obecně podporují, hlavně kvůli úsporám energií a lepšímu prostředí pro děti. Vadí jim ale jednorázové vysoké platby — preferují rozložení do fondu oprav. Nechtějí stavební práce přes letní prázdniny, kdy jsou děti doma.",
  },
  {
    id: "horak",
    name: "Pan Horák",
    role: "Stavební inženýr v důchodu",
    unit: "Byt 2+kk, 1. patro",
    status: "ceka",
    sentiment: "proti",
    brief:
      "Pan Horák je bývalý stavební inženýr a každý návrh detailně rozporuje. Nevěří dodavatelům vybraným bez výběrového řízení a chce vidět technické podklady. Není proti rekonstrukcím, ale odmítá cokoliv schválit bez nezávislého posudku. Aktuálně blokuje výměnu oken kvůli pochybnostem o kvalitě navržených profilů.",
    structured: null,
  },
  {
    id: "prochazka",
    name: "Pan Procházka",
    role: "IT konzultant, home office",
    unit: "Byt 3+kk, 4. patro",
    status: "zpracovano",
    sentiment: "vaha",
    brief:
      "Pan Procházka pracuje z domova a největší obavu má z hluku během stavby. Renovace v principu podporuje, ale chce přesný harmonogram hlučných prací a kompenzaci, pokud se protáhnou. Odmítá práce trvající déle než tři měsíce v kuse.",
    structured: {
      traits: ["Pragmatický", "Citlivý na hluk", "Vyžaduje plánování"],
      objections: ["Hluk při home office", "Neurčité harmonogramy"],
      motivations: ["Klid na práci", "Úspory energií", "Moderní dům"],
      rejects: ["Práce delší než 3 měsíce v kuse"],
    },
  },
  {
    id: "vesela",
    name: "Paní Veselá",
    role: "Učitelka, předsedkyně výboru",
    unit: "Byt 3+1, 6. patro",
    status: "zpracovano",
    sentiment: "podporuje",
    brief:
      "Paní Veselá je předsedkyně výboru SVJ a hlavní tahounka rekonstrukcí. Potřebuje hlavně argumenty pro ostatní — sama je přesvědčená. Vadí jí pomalé schvalování a věční odpůrci. Chce materiály, které dokáže srozumitelně odprezentovat na schůzi.",
    structured: {
      traits: ["Energická", "Komunikativní", "Tahounka změn"],
      objections: ["Pomalé schvalování", "Obstrukce menšiny"],
      motivations: ["Lepší stav domu", "Úspory pro všechny", "Hladký průběh schůzí"],
      rejects: ["Odkládání rozhodnutí na další schůzi"],
    },
  },
  {
    id: "marek",
    name: "Pan Marek",
    role: "Řidič kamionu, často pryč",
    unit: "Byt 1+kk, 7. patro",
    status: "ceka",
    sentiment: "vaha",
    brief:
      "Pan Marek je většinu měsíce na cestách a schůzí se neúčastní. Hlasuje per rollam, pokud vůbec. K rekonstrukcím je lhostejný — hlavně ať ho nikdo neobtěžuje a ať se výrazně nezvedne fond oprav.",
    structured: null,
  },
  {
    id: "kralova",
    name: "Paní Králová",
    role: "Matka samoživitelka",
    unit: "Byt 2+kk, 4. patro",
    status: "zpracovano",
    sentiment: "proti",
    brief:
      "Paní Králová má napjatý rodinný rozpočet a každé zvýšení záloh je pro ni problém. Není proti opravám z principu, ale bojí se, že na ně prostě nebude mít. Odmítá vše, co zvedne měsíční náklady o více než pár set korun.",
    structured: {
      traits: ["Opatrná", "Finančně napjatá", "Věcná"],
      objections: ["Zvýšení měsíčních nákladů", "Jednorázové platby"],
      motivations: ["Nižší účty za energie", "Předvídatelné výdaje"],
      rejects: ["Navýšení záloh nad 400 Kč měsíčně"],
    },
  },
  {
    id: "benes",
    name: "Pan Beneš",
    role: "Podnikatel, 2 byty v domě",
    unit: "Byty 2+kk a 3+kk, 8. patro",
    status: "zpracovano",
    sentiment: "podporuje",
    brief:
      "Pan Beneš vlastní v domě dva byty a rekonstrukce vnímá jako zhodnocení majetku. Podporuje téměř vše, ale chce kvalitní dodavatele a tlačí na rychlost. Vadí mu šetření na nesprávných místech.",
    structured: {
      traits: ["Rozhodný", "Orientovaný na kvalitu", "Dva hlasy v SVJ"],
      objections: ["Nekvalitní dodavatelé", "Zbytečné průtahy"],
      motivations: ["Zhodnocení majetku", "Reprezentativní dům"],
      rejects: ["Nejlevnější nabídky bez referencí"],
    },
  },
  {
    id: "sykorovi",
    name: "Manželé Sýkorovi",
    role: "Senioři, vlastníci 28 let",
    unit: "Byt 3+1, 1. patro",
    status: "ceka",
    sentiment: "vaha",
    brief:
      "Sýkorovi jsou senioři v prvním patře. Výtah nepotřebují, zateplení by uvítali kvůli úsporám. Rozhodují se podle toho, co řeknou sousedé, kterým věří. Bojí se hlavně dlouhého rozkopaného domu.",
    structured: null,
  },
  {
    id: "fialova",
    name: "Paní Fialová",
    role: "Lékařka, noční směny",
    unit: "Byt 2+kk, 5. patro",
    status: "zpracovano",
    sentiment: "proti",
    brief:
      "Paní Fialová slouží noční směny a přes den spí. Stavební hluk je pro ni zásadní problém — kvůli němu je aktuálně proti všem velkým projektům. Kdyby existoval režim tichých hodin dopoledne, byla by ochotná jednat.",
    structured: {
      traits: ["Unavená směnami", "Principiální", "Otevřená kompromisu"],
      objections: ["Hluk v dopoledních hodinách", "Dlouhé trvání staveb"],
      motivations: ["Klid na spánek", "Tepelný komfort bytu"],
      rejects: ["Hlučné práce mezi 8.00 a 14.00"],
    },
  },
  {
    id: "urban",
    name: "Pan Urban",
    role: "Student, byt po babičce",
    unit: "Byt 1+1, 6. patro",
    status: "ceka",
    sentiment: "podporuje",
    brief:
      "Pan Urban zdědil byt po babičce a je nejmladší vlastník v domě. Moderní technologie ho baví — chtěl by fotovoltaiku a chytré měření. Na schůze nechodí, ale online hlasování by uvítal. Podporuje skoro vše.",
    structured: null,
  },
  {
    id: "pokorna",
    name: "Paní Pokorná",
    role: "Účetní, členka výboru",
    unit: "Byt 2+1, 2. patro",
    status: "zpracovano",
    sentiment: "vaha",
    brief:
      "Paní Pokorná hlídá finance SVJ a každý rozpočet projde řádek po řádku. Nepodpoří nic bez jasného finančního krytí a realistické rezervy. Vadí jí optimistické odhady — chce vidět nejhorší scénář.",
    structured: {
      traits: ["Precizní", "Konzervativní ve financích", "Respektovaná sousedy"],
      objections: ["Podhodnocené rozpočty", "Chybějící rezervy"],
      motivations: ["Zdravé finance SVJ", "Transparentní čerpání"],
      rejects: ["Projekty bez 10% rezervy"],
    },
  },
  {
    id: "zeman",
    name: "Pan Zeman",
    role: "Nový vlastník, 2 měsíce",
    unit: "Byt 2+kk, 7. patro",
    status: "ceka",
    sentiment: "vaha",
    brief:
      "Pan Zeman se přistěhoval před dvěma měsíci a poměry v domě teprve poznává. Při koupi počítal s určitou investicí do domu, ale chce nejdřív rozumět tomu, co se plánuje a proč. Zatím se hlasování zdržuje.",
    structured: null,
  },
]

export type StrategyPoint = { title: string; detail: string }

// Mock argumentační strategie — v budoucnu generuje AI agent.
export function getStrategy(persona: Persona, project: Project): StrategyPoint[] {
  return [
    {
      title: "Začněte tím, co ho/ji zajímá",
      detail: `${persona.name} reaguje na: ${persona.structured?.motivations.slice(0, 2).join(", ").toLowerCase() ?? "stabilitu a předvídatelnost"}. Otevřete projekt „${project.name}“ právě přes tato témata.`,
    },
    {
      title: "Předejděte hlavní námitce",
      detail: `Nejsilnější námitka: ${persona.structured?.objections[0]?.toLowerCase() ?? "nedůvěra k procesu"}. Ukažte konkrétní čísla — navýšení fondu o ${project.fundIncreasePerFlat.toLocaleString("cs-CZ")} Kč/byt měsíčně a úsporu energií ${project.energySavingPct} %.`,
    },
    {
      title: "Argumentujte návratností",
      detail: `Projekt má návratnost ${project.paybackYears.toLocaleString("cs-CZ")} let při roční úspoře ${project.savingsPerYear.toLocaleString("cs-CZ")} Kč. Pro tuto personu prezentujte dopad na hodnotu bytu, ne jen na účty.`,
    },
    {
      title: "Nabídněte kompromis",
      detail: `Respektujte, co persona odmítá (${persona.structured?.rejects[0]?.toLowerCase() ?? "rychlá rozhodnutí bez podkladů"}), a nabídněte variantu, která se tomu vyhne — např. etapizaci nebo úpravu financování.`,
    },
  ]
}

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
      "Obecné informace o projektech, základní data a hlavní argumenty. Vhodné pro nástěnku nebo hromadný e-mail vlastníkům.",
    format: "PDF",
    pages: "2–3 strany",
    bestFor: "Nejlepší pro: zaneprázdněné rezidenty",
    needsPersona: false,
    includes: [
      "Přehled projektů a přínosů",
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
      "Přehled projektů a přínosů",
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
      "Porovnání projektů",
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
    name: "Fasáda — přehled pro schůzi",
    type: "Stručný přehled",
    format: "PDF",
    project: "Zateplení fasády",
    createdAt: "2026-06-02",
    size: "1,2 MB",
  },
  {
    id: "e2",
    name: "Argumenty pro paní Novákovou",
    type: "Personalizovaný export",
    format: "PDF",
    project: "Zateplení fasády",
    createdAt: "2026-05-28",
    size: "860 kB",
  },
  {
    id: "e3",
    name: "Okna — detailní report",
    type: "Detailní report",
    format: "PDF",
    project: "Výměna oken",
    createdAt: "2026-05-21",
    size: "4,8 MB",
  },
  {
    id: "e4",
    name: "Schůze SVJ červen — prezentace",
    type: "Prezentace",
    format: "PPTX",
    project: "Všechny projekty",
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