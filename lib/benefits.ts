// Katalog NEFINANČNÍCH přínosů rekonstrukcí — komfort, zdraví, prostředí a další.
// Slouží k tomu, aby vedle čísel (úspory, návratnost) byly vidět i kvalitativní
// důvody, proč do projektu jít. Pouze FE vrstva, bez napojení na backend / AI.
import { type ProjectId } from "@/lib/mock-data"
import { type PersonaType } from "@/lib/persona-types"

export type BenefitCategory =
  | "komfort"
  | "zdravi"
  | "prostredi"
  | "hodnota"
  | "bezpecnost"
  | "hluk"
  | "nezavislost"

/** Metadata kategorie — label pro UI, icon = název lucide-react ikony. */
export const BENEFIT_CATEGORIES: Record<BenefitCategory, { label: string; icon: string }> = {
  komfort: { label: "Komfort bydlení", icon: "Thermometer" },
  zdravi: { label: "Zdraví a kvalita vzduchu", icon: "HeartPulse" },
  prostredi: { label: "Životní prostředí", icon: "Leaf" },
  hodnota: { label: "Hodnota nemovitosti", icon: "TrendingUp" },
  bezpecnost: { label: "Bezpečnost a spolehlivost", icon: "Shield" },
  hluk: { label: "Klid a ticho", icon: "VolumeX" },
  nezavislost: { label: "Energetická nezávislost", icon: "PlugZap" },
}

export type NonFinancialBenefit = {
  id: string // `${projectId}-${slug}`
  projectId: ProjectId | null // null = celostavební přínos (komplexní renovace celého domu)
  category: BenefitCategory
  title: string // krátký titulek, čeština
  description: string // 1–2 věty, čeština
  impact: 1 | 2 | 3 // síla přínosu (3 = nejsilnější)
  meetingPitch?: string // hotová formulace, jak přínos podat sousedům na schůzi SVJ
}

export const NON_FINANCIAL_BENEFITS: NonFinancialBenefit[] = [
  // Fasáda
  {
    id: "fasada-stabilni-teplota",
    projectId: "fasada",
    category: "komfort",
    title: "Konec studených zdí",
    description: "Teplé zdi, vyhřátý byt.",
    impact: 3,
    meetingPitch:
      "Po zateplení budou obvodové zdi na dotek teplé. Konec táhnoucího chladu od stěn.",
  },
  {
    id: "fasada-konec-plisni",
    projectId: "fasada",
    category: "zdravi",
    title: "Konec plísní",
    description: "Žádné plísně ani vlhké mapy.",
    impact: 3,
  },

  // Okna
  {
    id: "okna-mene-hluku",
    projectId: "okna",
    category: "hluk",
    title: "Ticho z ulice",
    description: "Hluk z ulice zmizí.",
    impact: 3,
    meetingPitch:
      "Nová okna dokonale odhlučí ulici. Konečně se vyspíte.",
  },
  {
    id: "okna-konec-pruvanu",
    projectId: "okna",
    category: "komfort",
    title: "Konec průvanu",
    description: "Žádný průvan od oken.",
    impact: 3,
  },

  // Střecha
  {
    id: "strecha-ochrana-pred-zatekanim",
    projectId: "strecha",
    category: "bezpecnost",
    title: "Ochrana před zatékáním",
    description: "Konec zatékání a škod.",
    impact: 3,
  },
  {
    id: "strecha-prijemnejsi-klima",
    projectId: "strecha",
    category: "komfort",
    title: "Chladnější horní byty",
    description: "Žádné přehřáté podkroví.",
    impact: 2,
    meetingPitch:
      "Sousedé pod střechou už v létě neuvaří. A do domu dalších pár desítek let nezateče.",
  },

  // Výtah
  {
    id: "vytah-tichy-provoz",
    projectId: "vytah",
    category: "komfort",
    title: "Tichý a spolehlivý provoz",
    description: "Tichá jízda bez poruch.",
    impact: 3,
  },
  {
    id: "vytah-bezpecnostni-prvky",
    projectId: "vytah",
    category: "bezpecnost",
    title: "Bezpečný výtah",
    description: "Pomoc si přivolá sám.",
    impact: 3,
    meetingPitch:
      "Nikdo už neuvízne mezi patry a nemusí marně bouchat na dveře. Pomoc přijede sama.",
  },

  // Venkovní žaluzie
  {
    id: "zaluzie-leto-bez-klimatizace",
    projectId: "zaluzie",
    category: "komfort",
    title: "Léto bez klimatizace",
    description: "Slunce zastaví před oknem.",
    impact: 3,
    meetingPitch:
      "Konec přehřátých bytů v červenci. A v noci vám lampy z ulice nesvítí do postele.",
  },
  {
    id: "zaluzie-lepsi-spanek",
    projectId: "zaluzie",
    category: "zdravi",
    title: "Lepší spánek",
    description: "Dokonalé zatemnění, klidný spánek.",
    impact: 2,
  },

  // Tepelné čerpadlo
  {
    id: "tepelne-cerpadlo-nezavislost-na-plynu",
    projectId: "tepelne-cerpadlo",
    category: "nezavislost",
    title: "Nezávislost na plynu",
    description: "Konec závislosti na plynu.",
    impact: 3,
  },
  {
    id: "tepelne-cerpadlo-nizsi-uhlikova-stopa",
    projectId: "tepelne-cerpadlo",
    category: "prostredi",
    title: "Nižší uhlíková stopa",
    description: "Topíte čistě, bez plynu.",
    impact: 3,
  },

  // Vytápění
  {
    id: "vytapeni-rovnomerne-teplo",
    projectId: "vytapeni",
    category: "komfort",
    title: "Rovnoměrné teplo",
    description: "Stejné teplo v každém bytě.",
    impact: 3,
    meetingPitch:
      "Konec dohadů, kdo přetápí a komu je zima. Každý byt dostane přesně tolik tepla, kolik potřebuje.",
  },
  {
    id: "vytapeni-mene-havarii",
    projectId: "vytapeni",
    category: "bezpecnost",
    title: "Méně havárií",
    description: "Spolehlivá soustava bez poruch.",
    impact: 2,
  },

  // Rekuperace
  {
    id: "rekuperace-cerstvy-vzduch",
    projectId: "rekuperace",
    category: "zdravi",
    title: "Čerstvý vzduch nonstop",
    description: "Čistý vzduch i se zavřenými okny.",
    impact: 3,
    meetingPitch:
      "Dýcháte čerstvý vzduch 24 hodin denně. Pylové filtry uleví alergikům a zmizí plísně v rozích.",
  },
  {
    id: "rekuperace-mene-co2",
    projectId: "rekuperace",
    category: "zdravi",
    title: "Méně CO₂ v bytě",
    description: "Méně CO₂, lepší spánek.",
    impact: 2,
  },

  // Fotovoltaika
  {
    id: "fotovoltaika-vlastni-elektrina",
    projectId: "fotovoltaika",
    category: "nezavislost",
    title: "Vlastní elektřina",
    description: "Vlastní elektřina ze střechy.",
    impact: 3,
    meetingPitch:
      "Nejsme už závislí na tom, co si diktují velké energetické firmy. Energii máme vlastní.",
  },
  {
    id: "fotovoltaika-cista-energie",
    projectId: "fotovoltaika",
    category: "prostredi",
    title: "Čistá energie",
    description: "Sluneční elektřina bez emisí.",
    impact: 3,
  },

  // Celostavební přínosy — projeví se až u komplexní renovace celého domu
  {
    id: "dum-rust-hodnoty",
    projectId: null,
    category: "hodnota",
    title: "Skokový růst hodnoty",
    description: "Z paneláku moderní novostavba.",
    impact: 3,
    meetingPitch:
      "Dům přestane vypadat jako starý panelák. Hodnota vašeho bytu stoupne o statisíce.",
  },
]

/** Výběr přínosů z libovolného katalogu pro vybrané projekty, seřazený podle impactu (sestupně). */
export function selectBenefits(
  catalog: NonFinancialBenefit[],
  projectIds: readonly ProjectId[],
): NonFinancialBenefit[] {
  const selected = new Set(projectIds)
  // Celostavební přínosy (projectId === null) dávají smysl jen u komplexní renovace (3+ projektů).
  const isKomplexniRenovace = projectIds.length >= 3
  return catalog
    .filter((benefit) =>
      benefit.projectId === null ? isKomplexniRenovace : selected.has(benefit.projectId),
    )
    .sort((a, b) => b.impact - a.impact)
}

/** Přínosy pro vybrané projekty ze statického katalogu, seřazené podle impactu (sestupně). */
export function benefitsForProjects(projectIds: readonly ProjectId[]): NonFinancialBenefit[] {
  return selectBenefits(NON_FINANCIAL_BENEFITS, projectIds)
}

/** Seskupení přínosů podle kategorie (zachová pořadí dle impactu). */
export function groupBenefitsByCategory(
  benefits: NonFinancialBenefit[],
): Partial<Record<BenefitCategory, NonFinancialBenefit[]>> {
  const grouped: Partial<Record<BenefitCategory, NonFinancialBenefit[]>> = {}
  for (const benefit of benefits) {
    const bucket = grouped[benefit.category] ?? []
    bucket.push(benefit)
    grouped[benefit.category] = bucket
  }
  return grouped
}

/** Které kategorie přínosů daný archetyp nejvíc ocení (seřazeno dle priority). */
export const ARCHETYPE_BENEFIT_AFFINITY: Record<PersonaType, BenefitCategory[]> = {
  skrblik: ["nezavislost", "bezpecnost", "hodnota"],
  investor: ["hodnota", "nezavislost", "komfort"],
  technik: ["bezpecnost", "nezavislost", "komfort"],
  ekolog: ["prostredi", "zdravi", "nezavislost"],
  lhostejny: ["komfort", "hluk", "zdravi"],
  novacek: ["komfort", "zdravi", "bezpecnost"],
}

/** Přínosy seřazené podle afinit archetypu (pak impactu); bez typu vrací řazení dle impactu. */
export function rankBenefitsForPersona(
  benefits: NonFinancialBenefit[],
  personaType?: PersonaType,
): NonFinancialBenefit[] {
  if (!personaType) {
    return [...benefits].sort((a, b) => b.impact - a.impact)
  }

  const affinity = ARCHETYPE_BENEFIT_AFFINITY[personaType]
  // Nižší rank = vyšší priorita; kategorie mimo afinitu jdou na konec.
  const rankOf = (category: BenefitCategory) => {
    const index = affinity.indexOf(category)
    return index === -1 ? affinity.length : index
  }

  return [...benefits].sort((a, b) => {
    const rankDiff = rankOf(a.category) - rankOf(b.category)
    if (rankDiff !== 0) return rankDiff
    return b.impact - a.impact
  })
}
