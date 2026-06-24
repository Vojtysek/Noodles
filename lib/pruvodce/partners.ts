// Partneři a poradenské služby, na které Průvodce odkazuje. Nejsou to reklamy —
// jsou to pomocníci navázaní na konkrétní krok procesu. Banka (financování) je
// hlavní byznysový cíl, ostatní jsou doplňkové služby, které uživateli ušetří
// čas a starosti.
import {
  Landmark,
  Gauge,
  PencilRuler,
  HardHat,
  Scale,
  type LucideIcon,
} from "lucide-react"

export type PartnerId = "bank" | "energy" | "designer" | "firms" | "legal"

/** Odkaz na úvěry pro SVJ a bytová družstva u České spořitelny. */
export const CSAS_LOANS_URL =
  "https://www.csas.cz/cs/osobni-finance/pujcky/uvery-usporne-bydleni"

export type Partner = {
  id: PartnerId
  /** Krátký název služby. */
  name: string
  /** Jednou větou, k čemu pomáhá. */
  tagline: string
  /** Doplňující popis (1–2 věty). */
  description: string
  /** Text tlačítka. */
  cta: string
  icon: LucideIcon
  /** Barevný akcent (Tailwind base color name). */
  accent: "blue" | "emerald" | "violet" | "amber" | "sky"
  /**
   * Banka otevírá lead formulář v aplikaci (modal). Ostatní vedou na
   * (zatím zástupný) odkaz partnera. */
  modal?: "financing"
  href?: string
}

export const PARTNERS: Record<PartnerId, Partner> = {
  bank: {
    id: "bank",
    name: "Financování přes Českou spořitelnu",
    tagline: "Úvěr pro SVJ za nejlepší sazby na trhu.",
    description:
      "Dotaci Nová zelená úsporám čerpáte formou bezúročného úvěru. Doplňkové financování zařídíme přes Českou spořitelnu.",
    cta: "Získat nabídku financování",
    icon: Landmark,
    accent: "blue",
    modal: "financing",
  },
  energy: {
    id: "energy",
    name: "Energetický specialista",
    tagline: "Průkaz energetické náročnosti a renovační pas.",
    description:
      "Certifikovaný specialista připraví PENB i renovační pas — povinné dokumenty pro čerpání dotace NZÚ.",
    cta: "Najít specialistu",
    icon: Gauge,
    accent: "emerald",
    href: "/dashboard/pruvodce#pomocnici",
  },
  designer: {
    id: "designer",
    name: "Projektant / architekt",
    tagline: "Projektová dokumentace pro stavební povolení.",
    description:
      "Zpracuje dokumentaci potřebnou pro stavební úřad i pro výběrové řízení na realizační firmu.",
    cta: "Poptat projektanta",
    icon: PencilRuler,
    accent: "violet",
    href: "/dashboard/pruvodce#pomocnici",
  },
  firms: {
    id: "firms",
    name: "Prověřené realizační firmy",
    tagline: "Srovnejte nabídky ověřených dodavatelů.",
    description:
      "Oslovte několik prověřených firem najednou a porovnejte ceny, reference i záruční podmínky.",
    cta: "Porovnat firmy",
    icon: HardHat,
    accent: "amber",
    href: "/dashboard/pruvodce#pomocnici",
  },
  legal: {
    id: "legal",
    name: "Právní a SVJ poradenství",
    tagline: "Hlasování, smlouvy a souhlasy bez chyb.",
    description:
      "Poradce ohlídá správný průběh hlasování na schůzi i smlouvy s dodavateli — předejdete pozdějším sporům.",
    cta: "Poradit se",
    icon: Scale,
    accent: "sky",
    href: "/dashboard/pruvodce#pomocnici",
  },
}

export const PARTNER_LIST: Partner[] = [
  PARTNERS.bank,
  PARTNERS.energy,
  PARTNERS.designer,
  PARTNERS.firms,
  PARTNERS.legal,
]

/** Tailwind třídy pro akcent partnera (ikona pozadí + barva). */
export const PARTNER_ACCENT: Record<
  Partner["accent"],
  { iconWrap: string; ring: string }
> = {
  blue: { iconWrap: "bg-blue-500/10 text-blue-600 dark:text-blue-400", ring: "hover:border-blue-300/70" },
  emerald: { iconWrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", ring: "hover:border-emerald-300/70" },
  violet: { iconWrap: "bg-violet-500/10 text-violet-600 dark:text-violet-400", ring: "hover:border-violet-300/70" },
  amber: { iconWrap: "bg-amber-500/10 text-amber-600 dark:text-amber-400", ring: "hover:border-amber-300/70" },
  sky: { iconWrap: "bg-sky-500/10 text-sky-600 dark:text-sky-400", ring: "hover:border-sky-300/70" },
}
