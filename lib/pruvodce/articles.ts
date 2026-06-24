// Vzdělávací články pro uživatele, kteří se chtějí do tématu ponořit hlouběji.
// Statický obsah (žádný CMS) — renderuje se na /dashboard/pruvodce/clanky/[slug].
import { Landmark, Leaf, Stamp, Users, type LucideIcon } from "lucide-react"

export type ArticleSection = {
  heading: string
  paragraphs: string[]
  /** Volitelný odrážkový seznam pod odstavci. */
  bullets?: string[]
}

export type Article = {
  slug: string
  title: string
  /** Krátký perex do karty. */
  excerpt: string
  readingTime: string
  icon: LucideIcon
  accent: "blue" | "emerald" | "violet" | "amber"
  /** Úvodní odstavec na detailu. */
  lead: string
  sections: ArticleSection[]
}

export const ARTICLES: Article[] = [
  {
    slug: "financovani-rekonstrukce",
    title: "Jak financovat rekonstrukci bytového domu",
    excerpt:
      "Úvěr, fond oprav i dotace — jak poskládat financování tak, aby rekonstrukci utáhl rozpočet SVJ.",
    readingTime: "6 min čtení",
    icon: Landmark,
    accent: "blue",
    lead: "Komplexní renovace panelového domu vyjde na miliony korun. Dobrá zpráva je, že je málokdy platíte z vlastní kapsy najednou — chytře poskládané financování rozloží náklady do let a z velké části ho pokryjí úspory na energiích.",
    sections: [
      {
        heading: "Tři zdroje, ze kterých se renovace platí",
        paragraphs: [
          "Financování renovace stojí prakticky vždy na kombinaci tří zdrojů. Každý pokrývá jinou část a má jiná pravidla.",
        ],
        bullets: [
          "Fond oprav — peníze, které už SVJ má naspořené. Tvoří první vrstvu a snižují potřebnou výši úvěru.",
          "Úvěr pro SVJ — bankovní úvěr, který pokryje zbytek nákladů. Splácí se z navýšeného příspěvku do fondu oprav.",
          "Dotace (NZÚ) — nevratná podpora státu, která může pokrýt až polovinu uznatelných nákladů u komplexní renovace.",
        ],
      },
      {
        heading: "Úvěr pro SVJ",
        paragraphs: [
          "Úvěr pro společenství vlastníků je jiný produkt než hypotéka jednotlivce. Ručí se jím budoucími příjmy fondu oprav, nikoli konkrétními byty — žádný z vlastníků tedy neručí svým bytem.",
          "Banky tyto úvěry poskytují běžně a rády, protože jde o nízkorizikové financování s předvídatelným splácením. Splátka se rozpočítá na jednotky a hradí se měsíčně spolu s příspěvkem do fondu oprav.",
        ],
      },
      {
        heading: "Splátka, kterou z velké části zaplatí úspory",
        paragraphs: [
          "Klíčové číslo je rozdíl mezi navýšením příspěvku do fondu a úsporou na energiích. Po zateplení, výměně oken a modernizaci vytápění klesnou náklady na teplo často o desítky procent.",
          "U dobře nastaveného projektu pokryje úspora na energiích podstatnou část splátky úvěru. Reálné navýšení nákladů pro vlastníka je tak výrazně nižší, než kolik činí samotná splátka.",
        ],
      },
      {
        heading: "Jak postupovat",
        paragraphs: [
          "Nejdřív si nechte spočítat rozpočet a potřebnou výši úvěru po odečtení dotace a fondu oprav. Pak oslovte banku s nabídkou — ideálně partnera, který se na úvěry pro SVJ specializuje a provede vás žádostí.",
          "Nabídku financování si vyžádejte nezávazně. Dá vám konkrétní sazbu a splátku, se kterou pak můžete jít za vlastníky na schůzi SVJ.",
        ],
      },
    ],
  },
  {
    slug: "dotace-nzu",
    title: "Nová zelená úsporám: kompletní průvodce dotací",
    excerpt:
      "Kdo má na dotaci nárok, co všechno pokryje a jak žádost podat, aby prošla bez zdržení.",
    readingTime: "7 min čtení",
    icon: Leaf,
    accent: "emerald",
    lead: "Nová zelená úsporám (NZÚ) je hlavní dotační program pro energetické renovace v Česku. U bytových domů dokáže pokrýt podstatnou část nákladů — ale jen když žádost připravíte správně a ve správném pořadí.",
    sections: [
      {
        heading: "Co dotace pokrývá",
        paragraphs: [
          "Program podporuje opatření, která snižují energetickou náročnost domu. Čím komplexnější renovace, tím vyšší míra podpory — bonus za to, že se opatření kombinují.",
        ],
        bullets: [
          "Zateplení fasády, střechy a stropů",
          "Výměna oken a vstupních dveří",
          "Tepelná čerpadla a moderní zdroje vytápění",
          "Řízené větrání s rekuperací tepla",
          "Fotovoltaické elektrárny",
        ],
      },
      {
        heading: "Renovační pas otevírá vyšší dotace",
        paragraphs: [
          "Pro nejvyšší míru podpory u komplexní renovace potřebujete renovační pas — dokument od energetického specialisty, který navrhne opatření a jejich pořadí.",
          "Vyplatí se ho pořídit hned na začátku. Nejen že odemyká vyšší dotaci, ale dá celé renovaci jasný plán a uchrání vás před tím, abyste dělali věci ve špatném pořadí.",
        ],
      },
      {
        heading: "Pořadí kroků, na kterém záleží",
        paragraphs: [
          "Nejčastější chyba je podat žádost pozdě nebo začít stavět dřív, než je vše doloženo. Držte se ověřeného postupu:",
        ],
        bullets: [
          "Nechte zpracovat PENB a renovační pas",
          "Připravte projektovou dokumentaci",
          "Podejte žádost o dotaci — ideálně souběžně se stavebním povolením",
          "Po realizaci doložte skutečné provedení a vyúčtujte dotaci",
        ],
      },
      {
        heading: "Na co si dát pozor",
        paragraphs: [
          "Uznatelné jsou jen náklady na opatření uvedená v žádosti — improvizace během stavby se do dotace nedostane. Veďte pečlivou dokumentaci a faktury si schovávejte od první koruny.",
          "Termíny programu se mění. Než žádost podáte, ověřte si aktuální podmínky a výši podpory u specialisty nebo přímo na stránkách programu.",
        ],
      },
    ],
  },
  {
    slug: "stavebni-povoleni",
    title: "Jak získat stavební povolení pro rekonstrukci",
    excerpt:
      "Kdy ho potřebujete, jakou dokumentaci doložit a jak vyřízení nezdržet.",
    readingTime: "5 min čtení",
    icon: Stamp,
    accent: "amber",
    lead: "Stavební povolení bývá z celé přípravy nejzdlouhavější krok. Když ale víte, co úřad chce a v jakém pořadí, dá se vyřídit hladce a souběžně s ostatními kroky — aniž by brzdil celý harmonogram.",
    sections: [
      {
        heading: "Kdy povolení potřebujete a kdy stačí ohlášení",
        paragraphs: [
          "Ne každá úprava vyžaduje plné stavební povolení. Drobnější zásahy, které nemění nosné konstrukce ani vzhled v rozporu s předpisy, často stačí ohlásit. Komplexní renovace se zateplením, výměnou oken nebo zásahem do technických rozvodů už ale obvykle povolení vyžaduje.",
          "Hranici nejlépe posoudí projektant podle konkrétního rozsahu prací. Vyplatí se to ověřit hned na začátku — ušetříte si pozdější komplikace.",
        ],
      },
      {
        heading: "Co budete potřebovat",
        paragraphs: [
          "Stavební úřad rozhoduje na základě doložené dokumentace. Připravte si zejména:",
        ],
        bullets: [
          "Projektovou dokumentaci od autorizovaného projektanta",
          "Souhlas vlastníků (usnesení ze schůze SVJ)",
          "Vyjádření dotčených orgánů a správců sítí",
          "Případně stanovisko památkářů, leží-li dům v chráněné zóně",
        ],
      },
      {
        heading: "Jak dlouho to trvá",
        paragraphs: [
          "Vyřízení trvá typicky dva až tři měsíce od podání kompletní žádosti. Nejčastější zdržení nezpůsobuje úřad, ale chybějící přílohy nebo vyjádření, která je nutné shánět dodatečně.",
          "Proto se vyplatí dát dokumentaci dohromady najednou a podat ji kompletní. Žádost veďte souběžně s přípravou dotace — oba procesy běží nezávisle a ušetříte tím týdny.",
        ],
      },
      {
        heading: "Tipy, jak vyřízení nezdržet",
        paragraphs: [
          "Komunikujte s úřadem aktivně a reagujte na výzvy obratem. Dobrý projektant navíc úřad zná a dokáže žádost připravit tak, aby prošla napoprvé.",
          "Než stavební úřad rozhodne, můžete mezitím vybírat realizační firmu a chystat financování. Příprava tak neztrácí tempo a na povolení nečekáte se založenýma rukama.",
        ],
      },
    ],
  },
  {
    slug: "presvedcit-svj",
    title: "Jak přesvědčit sousedy na schůzi SVJ",
    excerpt:
      "Rekonstrukci schvalují vlastníci hlasováním. Jak připravit argumenty a získat většinu.",
    readingTime: "5 min čtení",
    icon: Users,
    accent: "violet",
    lead: "Nejlepší plán je k ničemu, dokud ho neschválí vlastníci. Schůze SVJ rozhoduje hlasováním a často právě tady projekty padají — ne kvůli číslům, ale kvůli obavám, které nikdo nerozptýlil.",
    sections: [
      {
        heading: "Lidé se nebojí čísel, ale nejistoty",
        paragraphs: [
          "Většina námitek na schůzi nepramení z toho, že by renovace byla špatný nápad. Pramení z nejistoty: kolik mě to bude stát, jak dlouho to potrvá, co když se to prodraží.",
          "Vaším úkolem není přehlušit pochybnosti nadšením, ale rozptýlit je konkrétními odpověďmi. Připravený předkladatel působí důvěryhodně sám o sobě.",
        ],
      },
      {
        heading: "Mluvte řečí každého typu souseda",
        paragraphs: [
          "Ve výboru i mezi vlastníky najdete různé typy lidí a každý slyší na něco jiného. Stejný projekt umíte podat několika způsoby:",
        ],
        bullets: [
          "Šetřivý soused chce slyšet o splátce, kterou pokryjí úspory na energiích",
          "Investor ocení růst hodnoty bytu",
          "Technik chce detaily o životnosti a zárukách",
          "Rodina s dětmi slyší na zdravé bydlení a konec plísní",
        ],
      },
      {
        heading: "Připravte podklady předem",
        paragraphs: [
          "Rozhodnutí na schůzi je těžké udělat z hlavy. Dejte vlastníkům materiály do schránky pár dní předem, ať si je v klidu projdou doma.",
          "Stručný přehled s klíčovými čísly, harmonogramem a odpověďmi na časté námitky udělá většinu práce za vás. Na schůzi pak řešíte rozhodnutí, ne vysvětlování základů.",
        ],
      },
      {
        heading: "Počítejte s většinou, ne s jednomyslností",
        paragraphs: [
          "Pro schválení potřebujete nadpoloviční většinu, ne souhlas úplně všech. Nesnažte se přesvědčit každého za každou cenu — soustřeďte se na nerozhodnuté.",
          "Mějte připravené odpovědi na tři nejčastější námitky: cenu, délku stavby a omezení během prací. Kdo má odpověď i na ně, většinu obvykle získá.",
        ],
      },
    ],
  },
]

export function articleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}
