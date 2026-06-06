// Vestavěné archetypy sousedů — statické profily pro argumentační přípravu.
// Žádné AI volání při výběru: profily jsou ručně psané a konzistentní.
// AI se používá až pro generování strategií a pro vlastní archetypy.
import { PERSONA_TYPES, type PersonaType } from "@/lib/persona-types"

export type ArchetypeProfile = {
  traits: string[]
  objections: string[]
  motivations: string[]
  rejects: string[]
}

export type Archetype = {
  id: PersonaType
  name: string
  imagePath: string
  /** Jednořádkový podtitul na kartě v galerii. */
  subtitle: string
  /** Delší popis v detailu — kdo to je a jak se na schůzích projevuje. */
  description: string
  profile: ArchetypeProfile
}

/** DB row from the `user_archetypes` table — column names match Supabase response (snake_case). */
export type UserArchetype = {
  id: string
  user_id: string
  name: string
  subtitle: string
  description: string
  profile: ArchetypeProfile
  image_path: string | null
  ai_hint: string | null
  created_at: string
}

const PROFILES: Record<
  PersonaType,
  Pick<Archetype, "subtitle" | "description" | "profile">
> = {
  skrblik: {
    subtitle: "Každá koruna se počítá",
    description:
      "Primárně ho motivují náklady. Každý výdaj mu přijde zbytečný, ptá se „kolik to stojí?“ a „nešlo by to levněji?“. Na schůzích opakovaně rozporuje cenu a výši fondu oprav.",
    profile: {
      traits: ["Citlivý na náklady", "Nedůvěřivý k rozpočtům", "Šetrný ze zásady"],
      objections: [
        "Zvýšení fondu oprav",
        "Příliš drahé řešení",
        "„Nešlo by to udělat levněji?“",
      ],
      motivations: [
        "Nižší účty za energie",
        "Dotace a spolufinancování",
        "Ochrana před dražšími haváriemi v budoucnu",
      ],
      rejects: ["Navýšení záloh bez jasné návratnosti", "Nadstandardní materiály"],
    },
  },
  investor: {
    subtitle: "Byt je pro něj investice",
    description:
      "Přemýšlí o nemovitosti jako o investici. Zajímá ho návratnost, zhodnocení bytu a efektivita nákladů. Je analytický, chce čísla a data — a schůze považuje za ztrátu času.",
    profile: {
      traits: ["Analytický", "Orientovaný na výnos", "Minimální osobní vazba na dům"],
      objections: [
        "Dlouhá návratnost",
        "Náklady bez vlivu na hodnotu bytu",
        "Zdlouhavé schvalování",
      ],
      motivations: ["Růst ceny bytu", "Vyšší nájemné", "Rychlé a věcné rozhodování"],
      rejects: ["Scénáře s návratností nad 15 let", "Investice bez dopadu na hodnotu bytu"],
    },
  },
  technik: {
    subtitle: "Chce vidět dokumentaci",
    description:
      "Má technické vzdělání nebo zálibu. Zpochybňuje kvalitu materiálů, odbornost zhotovitelů a navržená řešení. Není proti rekonstrukcím — ale bez podkladů nezvedne ruku.",
    profile: {
      traits: ["Technicky zdatný", "Detailista", "Nedůvěřivý k dodavatelům"],
      objections: [
        "Kvalita navržených materiálů",
        "Chybějící posudky a reference",
        "Výběr dodavatele bez soutěže",
      ],
      motivations: [
        "Nezávislý odborný posudek",
        "Kvalitní provedení s referencemi",
        "Transparentní výběrové řízení",
      ],
      rejects: ["Schválení bez technické dokumentace", "Nejlevnější nabídky bez referencí"],
    },
  },
  ekolog: {
    subtitle: "Zelená řešení na prvním místě",
    description:
      "Primárně ho zajímá ekologický dopad a udržitelnost. Prosazuje zateplení, fotovoltaiku a chytré měření. Spojenec rekonstrukcí — pokud nejsou jen kosmetické.",
    profile: {
      traits: ["Nadšený pro udržitelnost", "Informovaný", "Aktivní na schůzích"],
      objections: [
        "Scénář bez ekologického přínosu",
        "Promarněná šance na fotovoltaiku",
        "Krátkozraká levná řešení",
      ],
      motivations: [
        "Snížení spotřeby energií",
        "Moderní zelené technologie",
        "Dům připravený na budoucnost",
      ],
      rejects: ["Varianty bez zateplení", "Řešení bez ohledu na životní prostředí"],
    },
  },
  lhostejny: {
    subtitle: "Hlavně ať ho nikdo neobtěžuje",
    description:
      "Nemá zájem se angažovat. Na schůze nechodí, nebo mlčí. Schválí cokoliv, ale aktivně nepomáhá — a rozhoduje se pozdě a na poslední chvíli.",
    profile: {
      traits: ["Pasivní", "Nerozhodný", "Rozhoduje na poslední chvíli"],
      objections: ["„Proč to vůbec řešit?“", "Další schůze navíc", "Papírování a formuláře"],
      motivations: [
        "Minimální vlastní úsilí",
        "Hlasování per rollam nebo online",
        "Jasné doporučení od sousedů, kterým věří",
      ],
      rejects: ["Aktivní zapojení do příprav", "Dlouhé diskuse na schůzích"],
    },
  },
  novacek: {
    subtitle: "Teprve poznává dům i sousedy",
    description:
      "Čerstvě se nastěhoval, nezná ostatní ani historii domu. Klade základní otázky a potřebuje vysvětlit kontext. Je otevřený, ale nejistý — bojí se špatného rozhodnutí.",
    profile: {
      traits: ["Otevřený, ale nejistý", "Bez znalosti historie domu", "Zvídavý"],
      objections: [
        "Nerozumí souvislostem a historii",
        "Neví, komu věřit",
        "Obava ze špatného rozhodnutí",
      ],
      motivations: [
        "Srozumitelné vysvětlení od začátku",
        "Přehledná čísla a plán",
        "Pocit, že je součástí komunity",
      ],
      rejects: ["Hlasování bez vysvětlení kontextu", "Nátlak na rychlé rozhodnutí"],
    },
  },
}

export const ARCHETYPES: Archetype[] = (
  Object.keys(PERSONA_TYPES) as PersonaType[]
).map((id) => ({
  id,
  name: PERSONA_TYPES[id].name,
  imagePath: PERSONA_TYPES[id].imagePath,
  ...PROFILES[id],
}))

export function isArchetypeId(value: string): value is PersonaType {
  return value in PERSONA_TYPES
}

export function getArchetype(id: PersonaType): Archetype {
  return ARCHETYPES.find((a) => a.id === id)!
}
