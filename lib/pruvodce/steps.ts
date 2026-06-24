// Jádro Průvodce — celý proces rekonstrukce bytového domu rozdělený do tří fází
// (Plánování → Financování → Realizace) a deseti konkrétních kroků. Každý krok
// nese jen to, co je relevantní právě pro něj: co je potřeba zařídit, jeden
// praktický tip a případnou akci nebo navázaného partnera.
import {
  Users,
  FileBadge,
  Stamp,
  Landmark,
  HardHat,
  ClipboardCheck,
  PartyPopper,
  type LucideIcon,
} from "lucide-react"
import type { PartnerId } from "@/lib/pruvodce/partners"

export type PhaseId = "planovani" | "financovani" | "realizace"

export type Phase = {
  id: PhaseId
  label: string
}

export const PHASES: Phase[] = [
  { id: "planovani", label: "Plánování" },
  { id: "financovani", label: "Financování" },
  { id: "realizace", label: "Realizace" },
]

export type StepKind = "process" | "finance" | "build" | "finish"

export type StepAction = {
  label: string
  /** Interní/externí odkaz. */
  href?: string
  external?: boolean
  /** Místo odkazu otevře v aplikaci modal (lead formulář financování). */
  modal?: "financing"
}

export type WizardStep = {
  id: string
  phase: PhaseId
  kind: StepKind
  icon: LucideIcon
  /** Plný název kroku (hero). */
  title: string
  /** Krátký název do časové osy. */
  short: string
  /** Očekávaná doba trvání, lidskou řečí. */
  duration?: string
  /** Volitelný štítek do osy (např. STAVBA). */
  badge?: string
  /** 1–2 věty do hero karty — co tenhle krok znamená. */
  description: string
  /** Zvýrazněné benefity v hero kartě (max 2) — jen u silných kroků. */
  highlights?: string[]
  /** Konkrétní „co je potřeba" — žije v aktivním kroku časové osy. */
  checklist: string[]
  /** Jeden praktický tip k tomuto kroku. */
  tip?: string
  /** Hlavní akce kroku (tlačítko v hero kartě). */
  action?: StepAction
  /** Volitelná vedlejší akce (druhé, méně výrazné tlačítko v hero kartě). */
  secondaryAction?: StepAction
  /** Navázaný pomocník/partner pro tento krok. */
  partner?: PartnerId
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "svj-zamer",
    phase: "planovani",
    kind: "process",
    icon: Users,
    title: "Schválení záměru na schůzi SVJ",
    short: "Schůzka SVJ",
    duration: "1 měsíc",
    description:
      "Než se cokoli rozjede, potřebujete souhlas vlastníků. Představte záměr, klíčová čísla a získejte mandát pokračovat.",
    checklist: [
      "Svolejte schůzi a zařaďte rekonstrukci na program",
      "Připravte stručný přehled: co, kolik a kdy se vyplatí",
      "Pro schválení potřebujete nadpoloviční většinu vlastníků",
    ],
    tip: "Pošlete sousedům podklady do schránky pár dní předem — na schůzi pak řešíte rozhodnutí, ne základní fakta.",
    action: { label: "Vytvořit podklady pro schůzi", href: "/dashboard/exporty" },
    secondaryAction: { label: "Vytvořit argumentaci", href: "/dashboard/rezidenti" },
    partner: "legal",
  },
  {
    id: "renovacni-pas",
    phase: "planovani",
    kind: "process",
    icon: FileBadge,
    title: "Průkaz energetické náročnosti a renovační pas",
    short: "Renovační pas",
    duration: "1 měsíc",
    description:
      "Energetický specialista posoudí dům a navrhne nejúčinnější opatření. Renovační pas je navíc povinný pro čerpání dotace NZÚ.",
    checklist: [
      "Objednejte PENB u certifikovaného specialisty",
      "Nechte zpracovat renovační pas s návrhem opatření",
      "Připravte informace o domě a plánovaných úpravách",
    ],
    tip: "Renovační pas si nechte vystavit hned na začátku — odemyká vyšší dotace a usměrní celý plán.",
    action: {
      label: "Najít energetického specialistu",
      href: "#pomocnici",
    },
    partner: "energy",
  },
  {
    id: "stavebni-povoleni",
    phase: "planovani",
    kind: "process",
    icon: Stamp,
    title: "Projekt a stavební povolení",
    short: "Stavební povolení",
    duration: "2–3 měsíce",
    description:
      "Projektant zpracuje dokumentaci a podáte žádost na stavební úřad. Vyřízení trvá nejdéle z celé přípravy — začněte včas.",
    checklist: [
      "Zajistěte projektovou dokumentaci od projektanta",
      "Doložte souhlas vlastníků a podejte žádost na úřad",
      "Počítejte s vyřízením typicky 2–3 měsíce",
    ],
    tip: "Žádost o stavební povolení a žádost o dotaci veďte souběžně — ušetříte měsíc i víc.",
    action: {
      label: "Jak získat stavební povolení",
      href: "/dashboard/pruvodce/clanky/stavebni-povoleni",
    },
    partner: "designer",
  },
  {
    id: "financovani",
    phase: "financovani",
    kind: "finance",
    icon: Landmark,
    title: "Financování a dotace",
    short: "Financování a dotace",
    duration: "2–4 týdny",
    description:
      "Dotaci Nová zelená úsporám dnes čerpáte formou bezúročného úvěru. Jako partner České spořitelny vám pomůžeme zajistit financování celé rekonstrukce za nejlepší sazby na trhu — dotace i úvěr na jednom místě.",
    highlights: ["Dotace formou bezúročného úvěru"],
    checklist: [
      "Spočítejte potřebnou výši financování po odečtení dotace",
      "Získejte nezávaznou nabídku od České spořitelny",
      "Doložte podklady SVJ — provedeme vás celým procesem",
    ],
    tip: "Splátku z velké části pokryje úspora na energiích — reálné navýšení nákladů pro vlastníka je nižší, než se na první pohled zdá.",
    action: { label: "Získat nabídku financování", modal: "financing" },
    partner: "bank",
  },
  {
    id: "vyber-firmy",
    phase: "realizace",
    kind: "process",
    icon: HardHat,
    title: "Výběr realizační firmy",
    short: "Výběr firmy",
    duration: "1 měsíc",
    description:
      "Oslovte několik prověřených firem a srovnejte nabídky. Nejlevnější nemusí být nejlepší — rozhoduje poměr ceny, referencí a záruk.",
    checklist: [
      "Oslovte minimálně 3 firmy a srovnejte nabídky",
      "Ověřte reference a pojištění odpovědnosti",
      "Zkontrolujte záruky, platební milníky a pokuty za prodlení",
    ],
    tip: "Dejte si pozor na příliš nízké ceny — často skrývají vícenáklady. Sledujte poměr cena/reference.",
    action: { label: "Porovnat realizační firmy", href: "#pomocnici" },
    partner: "firms",
  },
  {
    id: "svj-finalni",
    phase: "realizace",
    kind: "process",
    icon: Users,
    title: "Finální schválení na schůzi SVJ",
    short: "Finální schválení",
    duration: "1 měsíc",
    description:
      "Na druhé schůzi vlastníci odsouhlasí konkrétní firmu, konečnou cenu a harmonogram prací. Pak už se staví.",
    checklist: [
      "Odsouhlaste výběr firmy a konečnou cenu",
      "Schvalte harmonogram a způsob financování",
      "Připravte odpovědi na časté námitky vlastníků",
    ],
    tip: "Mějte po ruce argumenty na cenu, délku stavby a omezení provozu — předejdete zdržení hlasování.",
    action: { label: "Připravit prezentaci na schůzi", href: "/dashboard/exporty" },
    partner: "legal",
  },
  {
    id: "realizace",
    phase: "realizace",
    kind: "build",
    icon: HardHat,
    title: "Realizace stavby",
    short: "Realizace stavby",
    duration: "6–8 měsíců",
    badge: "Stavba",
    description:
      "Samotná rekonstrukce. Koordinujte dodavatele, hlídejte platební milníky a každou odchylku dokumentujte.",
    checklist: [
      "Uvolňujte zálohy až po splnění smluvních etap",
      "Veďte stavební deník a fotodokumentaci",
      "Pravidelně kontrolujte postup s dozorem",
    ],
    tip: "Fotovoltaiku nechte na závěr — vyžaduje hotovou střechu a souhlas distributora. Žádost o připojení podejte včas.",
  },
  {
    id: "kolaudace",
    phase: "realizace",
    kind: "process",
    icon: ClipboardCheck,
    title: "Kolaudace a předání",
    short: "Kolaudace",
    duration: "1 měsíc",
    description:
      "Závěrečné revize a kolaudační souhlas. Bez revizí nových instalací kolaudaci nezískáte — naplánujte je s předstihem.",
    checklist: [
      "Zajistěte revize elektro, plynu a TZB",
      "Proveďte přejímku prací a soupis případných vad",
      "Vyžádejte si záruční listy a dokumentaci skutečného provedení",
    ],
    tip: "Po renovaci aktualizujte pojistnou smlouvu — zhodnocený dům bývá levnější na pojistném.",
  },
  {
    id: "dokonceno",
    phase: "realizace",
    kind: "finish",
    icon: PartyPopper,
    title: "Hotovo — užívejte si nový dům",
    short: "Dokončeno",
    description:
      "Gratulujeme! Dům je energeticky úspornější, hodnotnější a příjemnější k bydlení. Zbývá pár formalit.",
    checklist: [
      "Informujte vlastníky o výsledcích a úsporách",
      "Aktualizujte provozní řád a pojistnou smlouvu",
      "Sledujte reálné úspory oproti plánu",
    ],
    tip: "Změřte spotřebu po první sezóně a porovnejte s odhadem — skvělý argument pro další domy ve vašem okolí.",
  },
]

export const FINISH_INDEX = WIZARD_STEPS.length - 1

/** Index kroku podle id (–1 když neexistuje). */
export function stepIndexById(id: string): number {
  return WIZARD_STEPS.findIndex((s) => s.id === id)
}

export type PhaseStatus = "done" | "active" | "upcoming"

/** Stav fáze vzhledem k aktuálnímu kroku. */
export function phaseStatus(phase: PhaseId, currentIndex: number): PhaseStatus {
  const indices = WIZARD_STEPS.reduce<number[]>((acc, s, i) => {
    if (s.phase === phase) acc.push(i)
    return acc
  }, [])
  const last = indices[indices.length - 1]
  const first = indices[0]
  if (currentIndex > last) return "done"
  if (currentIndex >= first) return "active"
  return "upcoming"
}
