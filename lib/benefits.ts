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
    description: "Po zateplení jsou obvodové zdi na dotek teplé a byt se prohřeje rovnoměrně. Konec táhnoucího chladu od stěn.",
    impact: 3,
    meetingPitch:
      "Znáte ten pocit, když si v zimě sednete k obvodové zdi a táhne na vás chlad? Po zateplení budou zdi na dotek teplé. Byt se prohřeje rovnoměrně.",
  },
  {
    id: "fasada-konec-plisni",
    projectId: "fasada",
    category: "zdravi",
    title: "Konec plísní a vlhkých stěn",
    description: "Odstranění tepelných mostů a kondenzace znamená zdravější vzduch a žádné mapy vlhkosti.",
    impact: 3,
  },
  {
    id: "fasada-reprezentativni-vzhled",
    projectId: "fasada",
    category: "hodnota",
    title: "Reprezentativní vzhled domu",
    description: "Nová fasáda zvedne celkový dojem z domu i tržní hodnotu jednotlivých bytů.",
    impact: 2,
  },
  {
    id: "fasada-nizsi-emise",
    projectId: "fasada",
    category: "prostredi",
    title: "Nižší emise z vytápění",
    description: "Menší spotřeba energie na topení znamená nižší uhlíkovou stopu celého domu.",
    impact: 2,
  },

  // Okna
  {
    id: "okna-mene-hluku",
    projectId: "okna",
    category: "hluk",
    title: "Výrazně méně hluku z ulice",
    description: "Izolační trojskla utlumí hluk dopravy i ruchu z okolí. Doma je konečně klid.",
    impact: 3,
    meetingPitch:
      "Konečně se vyspíte. Nová okna dokonale odhlučí ulici. I když projede sanitka nebo popeláři, uvnitř uslyšíte jen ticho.",
  },
  {
    id: "okna-konec-pruvanu",
    projectId: "okna",
    category: "komfort",
    title: "Konec průvanu a studených míst",
    description: "Těsná okna odstraní studené sálání i nepříjemný průvan v blízkosti oken.",
    impact: 3,
  },
  {
    id: "okna-bezpecnostni-kovani",
    projectId: "okna",
    category: "bezpecnost",
    title: "Bezpečnostní kování",
    description: "Moderní kování výrazně ztíží vloupání a zvyšuje pocit bezpečí, zejména v nižších patrech.",
    impact: 2,
  },
  {
    id: "okna-atraktivita-bytu",
    projectId: "okna",
    category: "hodnota",
    title: "Vyšší atraktivita bytů",
    description: "Nová okna patří k prvním věcem, které kupci ocení — zvyšují prodejnost i hodnotu bytu.",
    impact: 2,
  },

  // Střecha
  {
    id: "strecha-ochrana-pred-zatekanim",
    projectId: "strecha",
    category: "bezpecnost",
    title: "Ochrana před zatékáním",
    description: "Nová střecha ukončí havárie a škody v horních patrech způsobené zatékáním.",
    impact: 3,
  },
  {
    id: "strecha-prijemnejsi-klima",
    projectId: "strecha",
    category: "komfort",
    title: "Příjemnější klima v horních bytech",
    description: "Zateplená střecha zabrání letnímu přehřívání podkroví a horních pater.",
    impact: 2,
    meetingPitch:
      "Sousedé pod střechou už nebudou mít v létě v bytě 35 stupňů a v zimě jim nebude unikat teplo. Navíc nová izolace znamená, že nám do domu další desítky let nezateče.",
  },
  {
    id: "strecha-prodlouzeni-zivotnosti",
    projectId: "strecha",
    category: "hodnota",
    title: "Prodloužení životnosti domu",
    description: "Kvalitní střešní plášť chrání konstrukci domu a oddálí nákladné opravy.",
    impact: 2,
  },

  // Výtah
  {
    id: "vytah-tichy-provoz",
    projectId: "vytah",
    category: "komfort",
    title: "Tichý a spolehlivý provoz",
    description: "Moderní výtah jezdí tiše a plynule, bez častých poruch a nečekaných odstávek.",
    impact: 3,
  },
  {
    id: "vytah-bezpecnostni-prvky",
    projectId: "vytah",
    category: "bezpecnost",
    title: "Moderní bezpečnostní prvky",
    description: "Nouzová komunikace a plynulé dojezdy zvyšují bezpečí všech obyvatel domu.",
    impact: 3,
    meetingPitch:
      "Nikdo z nás nechce uvíznout ve starém výtahu mezi patry a marně bouchat na dveře. Nový výtah si v případě poruchy sám přivolá pomoc a vy se hned spojíte se službou.",
  },
  {
    id: "vytah-bezbarierovy-pristup",
    projectId: "vytah",
    category: "komfort",
    title: "Bezbariérový přístup",
    description: "Pohodlí pro seniory, rodiče s kočárky i běžné nošení nákupů do vyšších pater.",
    impact: 2,
  },

  // Venkovní žaluzie
  {
    id: "zaluzie-leto-bez-klimatizace",
    projectId: "zaluzie",
    category: "komfort",
    title: "Léto bez klimatizace",
    description: "Venkovní stínění zastaví přehřívání interiéru dřív, než teplo pronikne dovnitř.",
    impact: 3,
    meetingPitch:
      "Už žádné přehřáté byty v červenci. Žaluzie zastaví slunce ještě před oknem. A v noci vám nebudou svítit lampy z ulice přímo do postele.",
  },
  {
    id: "zaluzie-lepsi-spanek",
    projectId: "zaluzie",
    category: "zdravi",
    title: "Lepší spánek díky zatemnění",
    description: "Plné zatemnění místnosti podpoří kvalitnější a klidnější spánek.",
    impact: 2,
  },
  {
    id: "zaluzie-vice-soukromi",
    projectId: "zaluzie",
    category: "komfort",
    title: "Více soukromí",
    description: "Žaluzie spolehlivě cloní pohledy zvenčí a zvyšují pocit soukromí v bytě.",
    impact: 2,
  },

  // Tepelné čerpadlo
  {
    id: "tepelne-cerpadlo-nezavislost-na-plynu",
    projectId: "tepelne-cerpadlo",
    category: "nezavislost",
    title: "Nezávislost na cenách plynu",
    description: "Vytápění tepelným čerpadlem odpojí dům od kolísání cen plynu a jeho dodávek.",
    impact: 3,
  },
  {
    id: "tepelne-cerpadlo-nizsi-uhlikova-stopa",
    projectId: "tepelne-cerpadlo",
    category: "prostredi",
    title: "Výrazně nižší uhlíková stopa",
    description: "Vytápění čerpadlem výrazně snižuje emise oproti spalování plynu.",
    impact: 3,
  },
  {
    id: "tepelne-cerpadlo-bezobsluzny-provoz",
    projectId: "tepelne-cerpadlo",
    category: "komfort",
    title: "Bezobslužné a stabilní vytápění",
    description: "Systém pracuje automaticky a udržuje stabilní teplo bez nutnosti zásahů.",
    impact: 2,
  },
  {
    id: "tepelne-cerpadlo-ochrana-pred-havarii",
    projectId: "tepelne-cerpadlo",
    category: "bezpecnost",
    title: "Ochrana před havárií",
    description: "Konec rizika výpadku přesluhujícího kotle nebo výměníku. Nový zdroj tepla je spolehlivý a hlídaný.",
    impact: 2,
    meetingPitch:
      "Náš starý kotel (nebo výměník) přesluhuje. Nechceme přece řešit, že se nám uprostřed ledna rozbije a my budeme tři týdny v mrazech čekat na náhradní díly.",
  },

  // Vytápění
  {
    id: "vytapeni-rovnomerne-teplo",
    projectId: "vytapeni",
    category: "komfort",
    title: "Rovnoměrné teplo ve všech bytech",
    description: "Vyvážená soustava a termostatické hlavice zajistí stejné teplo v celém domě.",
    impact: 3,
    meetingPitch:
      "Konec věčných dohadů, kdo si přetápí a komu naopak pořád zima. Po vyvážení soustavy bude mít každý byt přesně tolik tepla, kolik potřebuje, a topíme spravedlivě.",
  },
  {
    id: "vytapeni-mene-havarii",
    projectId: "vytapeni",
    category: "bezpecnost",
    title: "Méně havárií a odstávek",
    description: "Modernizovaná soustava je spolehlivější a méně náchylná k poruchám a odstávkám.",
    impact: 2,
  },
  {
    id: "vytapeni-efektivnejsi-provoz",
    projectId: "vytapeni",
    category: "prostredi",
    title: "Efektivnější provoz s nižšími emisemi",
    description: "Optimalizovaný systém spotřebuje méně energie a produkuje nižší emise.",
    impact: 2,
  },

  // Rekuperace
  {
    id: "rekuperace-cerstvy-vzduch",
    projectId: "rekuperace",
    category: "zdravi",
    title: "Čerstvý vzduch bez otevírání oken",
    description: "Řízené větrání s filtrací pylu a prachu přivádí čistý vzduch i při zavřených oknech.",
    impact: 3,
    meetingPitch:
      "Budete dýchat čerstvý vzduch 24 hodin denně, i když zapomenete vyvětrat. Pylové filtry navíc uleví všem alergikům v domě a navždy se zbavíme vlhkosti a plísní v rozích.",
  },
  {
    id: "rekuperace-mene-co2",
    projectId: "rekuperace",
    category: "zdravi",
    title: "Méně CO₂ a vlhkosti v bytě",
    description: "Nižší koncentrace CO₂ a stabilní vlhkost podpoří lepší spánek i koncentraci.",
    impact: 2,
  },
  {
    id: "rekuperace-vetrani-bez-hluku",
    projectId: "rekuperace",
    category: "hluk",
    title: "Větrání bez hluku z ulice",
    description: "Vzduch se vyměňuje bez otevírání oken, takže do bytu neproniká hluk z ulice.",
    impact: 2,
  },
  {
    id: "rekuperace-zadny-pruvan",
    projectId: "rekuperace",
    category: "komfort",
    title: "Žádný průvan při větrání",
    description: "Čerstvý vzduch proudí rovnoměrně a nenápadně, bez nepříjemného průvanu.",
    impact: 2,
  },

  // Fotovoltaika
  {
    id: "fotovoltaika-vlastni-elektrina",
    projectId: "fotovoltaika",
    category: "nezavislost",
    title: "Vlastní elektřina ze střechy",
    description: "Výroba vlastní energie snižuje závislost na dodavatelích i na růstu cen elektřiny.",
    impact: 3,
    meetingPitch:
      "Vyrábíme si vlastní energii na vlastní střeše. Nejsme už stoprocentně závislí na tom, co si diktují velké energetické firmy. Zvyšujeme naši energetickou bezpečnost.",
  },
  {
    id: "fotovoltaika-cista-energie",
    projectId: "fotovoltaika",
    category: "prostredi",
    title: "Čistá energie s nulovými emisemi",
    description: "Sluneční elektřina nahrazuje energii z fosilních zdrojů bez produkce emisí.",
    impact: 3,
  },
  {
    id: "fotovoltaika-atraktivita-domu",
    projectId: "fotovoltaika",
    category: "hodnota",
    title: "Atraktivita domu pro kupce i banky",
    description: "Vlastní zdroj energie zvyšuje hodnotu domu a zlepšuje jeho postavení u kupců i bank.",
    impact: 2,
  },

  // Celostavební přínosy — projeví se až u komplexní renovace celého domu
  {
    id: "dum-rust-hodnoty",
    projectId: null,
    category: "hodnota",
    title: "Skokový růst hodnoty bytu",
    description: "Komplexní renovace zvedne tržní hodnotu všech bytů v domě naráz — z paneláku se stává moderní novostavba.",
    impact: 3,
    meetingPitch:
      "Dům už nebude vypadat jako starý panelák, ale jako moderní novostavba. Pokud budete chtít byt někdy prodat nebo odkázat dětem, jeho tržní hodnota stoupne o statisíce.",
  },
  {
    id: "dum-reprezentativni-bydleni",
    projectId: null,
    category: "hodnota",
    title: "Reprezentativní bydlení",
    description: "Celkový vzhled domu i okolí se promění — čisté, krásné a moderní prostředí, do kterého se rádi vracíte.",
    impact: 2,
    meetingPitch:
      "Zlepšíme vzhled celého našeho okolí. Budeme se vracet do čistého, krásného a moderního domu, za který se nebudeme muset před návštěvami stydět.",
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
