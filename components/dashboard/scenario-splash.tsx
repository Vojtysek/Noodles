"use client"

import { useEffect, useMemo } from "react"
import { ArrowRight, Flag, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  fmtCzk,
  fmtCzkShort,
  fmtDuration,
  projects,
  scenarios,
} from "@/lib/mock-data"

type BuildingData = {
  selected_renovations: string[]
  total_cost: number
  address?: string | null
}

const RENOVATION_LABEL_TO_PROJECT: Record<string, string> = {
  "Okna": "okna",
  "Zateplení fasády": "fasada",
  "Zateplení střechy": "strecha",
}

const START_YEAR = 2026
const START_MONTH = 0 // leden

// Genitiv pro „od ledna 2026" — stejně jako na Přehledu.
const MONTHS_CS = [
  "ledna",
  "února",
  "března",
  "dubna",
  "května",
  "června",
  "července",
  "srpna",
  "září",
  "října",
  "listopadu",
  "prosince",
]

function monthLabel(offsetMonths: number): string {
  const total = START_MONTH + offsetMonths
  return `od ${MONTHS_CS[total % 12]} ${START_YEAR + Math.floor(total / 12)}`
}

type Milestone = {
  title: string
  period: string
  duration: string
  /** Kolik bude celkem utraceno po dokončení tohoto kroku. */
  cumulativeSpent: number
}

type SplashCard = {
  id: string
  name: string
  tone: "emerald" | "blue"
  kicker: string
  photo: { src: string; alt: string }
  /** Dvě hlavní čísla — tahák každé varianty. */
  heroStats: { label: string; value: number; format: (v: number) => string; sub: string }[]
  milestones: Milestone[]
  totalMonths: number
  totalCost: number
  finishLabel: string
}

/** Mock přípravné fáze — konzultace a projekt nejsou v rozpočtech projektů. */
const CONSULTATION_COST = 25_000

function buildCard(
  scenario: (typeof scenarios)[number],
  kicker: string,
  photo: { src: string; alt: string }
): SplashCard {
  const selected = scenario.projectIds
    .map((id) => projects.find((p) => p.id === id)!)
    .filter(Boolean)

  const budget = selected.reduce((sum, p) => sum + p.budget, 0)
  const savingsPerYear = selected.reduce((sum, p) => sum + p.savingsPerYear, 0)
  const fundIncreasePerFlat = selected.reduce((sum, p) => sum + p.fundIncreasePerFlat, 0)
  const energySavingPct = selected.reduce((sum, p) => sum + p.energySavingPct, 0)

  // Přípravné fáze — délka a cena projektové dokumentace roste s rozsahem scénáře.
  const docsMonths = selected.length > 1 ? 3 : 2
  const docsCost = Math.round((budget * 0.03) / 10_000) * 10_000
  const totalCost = CONSULTATION_COST + docsCost + budget

  let offset = 0
  let spent = 0
  const milestones: Milestone[] = []

  const push = (title: string, months: number, cost: number) => {
    spent += cost
    milestones.push({
      title,
      period: monthLabel(offset),
      duration: fmtDuration(months),
      cumulativeSpent: spent,
    })
    offset += months
  }

  push("Konzultace s energetikem", 1, CONSULTATION_COST)
  push("Projektová dokumentace", docsMonths, docsCost)
  for (const p of selected) push(p.name, p.durationMonths, p.budget)

  const totalMonths = offset
  const isQuick = selected.length === 1

  return {
    id: scenario.id,
    name: scenario.name,
    tone: scenario.tone === "amber" ? "blue" : scenario.tone,
    kicker,
    photo,
    heroStats: isQuick
      ? [
          {
            label: "Celkem zaplatíte",
            value: totalCost,
            format: fmtCzkShort,
            sub: `jen ${fmtCzk(fundIncreasePerFlat)} měsíčně navíc na byt`,
          },
          {
            label: "Hotovo za",
            value: totalMonths,
            format: (v) => fmtDuration(Math.round(v)),
            sub: "nejrychlejší cesta k opravenému domu",
          },
        ]
      : [
          {
            label: "Dům ušetří ročně",
            value: savingsPerYear,
            format: fmtCzkShort,
            sub: "na energiích a údržbě, každý rok",
          },
          {
            label: "Úspora energií",
            value: energySavingPct,
            format: (v) => `${Math.round(v)} %`,
            sub: "dům hotový na desítky let dopředu",
          },
        ],
    milestones,
    totalMonths,
    totalCost,
    finishLabel: monthLabel(totalMonths).replace("od ", ""),
  }
}

function buildCardFromBuilding(data: BuildingData): SplashCard {
  const selectedIds = data.selected_renovations
    .map((label) => RENOVATION_LABEL_TO_PROJECT[label])
    .filter((id): id is string => Boolean(id))

  const selected = selectedIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)

  if (selected.length === 0) {
    // Fallback to the cheapest mock scenario when renovations can't be mapped.
    return buildCard(
      scenarios.find((s) => s.id === "nejnutnejsi")!,
      "Varianta A — váš plán",
      {
        src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop",
        alt: "Řemeslníci při opravě domu",
      }
    )
  }

  const mockTotal = selected.reduce((sum, p) => sum + p.budget, 0)
  const scale = mockTotal > 0 ? data.total_cost / mockTotal : 1

  const scaledSavingsPerYear = selected.reduce((sum, p) => sum + p.savingsPerYear * scale, 0)
  const scaledFundIncrease = selected.reduce((sum, p) => sum + p.fundIncreasePerFlat * scale, 0)

  const docsMonths = selected.length > 1 ? 3 : 2
  const docsCost = Math.round((data.total_cost * 0.03) / 10_000) * 10_000
  const totalCost = CONSULTATION_COST + docsCost + data.total_cost

  let offset = 0
  let spent = 0
  const milestones: Milestone[] = []

  const push = (title: string, months: number, cost: number) => {
    spent += cost
    milestones.push({
      title,
      period: monthLabel(offset),
      duration: fmtDuration(months),
      cumulativeSpent: spent,
    })
    offset += months
  }

  push("Konzultace s energetikem", 1, CONSULTATION_COST)
  push("Projektová dokumentace", docsMonths, docsCost)
  for (const p of selected) push(p.name, p.durationMonths, Math.round(p.budget * scale))

  const totalMonths = offset

  return {
    id: "custom",
    name: "Váš plán",
    tone: "emerald",
    kicker: "Varianta A — váš plán",
    photo: {
      src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop",
      alt: "Řemeslníci při opravě domu",
    },
    heroStats: [
      {
        label: "Celkem zaplatíte",
        value: totalCost,
        format: fmtCzkShort,
        sub: `navýšení fondu o ${Math.round(scaledFundIncrease).toLocaleString("cs-CZ")} Kč/byt/měs`,
      },
      {
        label: "Dům ušetří ročně",
        value: Math.round(scaledSavingsPerYear),
        format: fmtCzkShort,
        sub: "na energiích a údržbě, každý rok",
      },
    ],
    milestones,
    totalMonths,
    totalCost,
    finishLabel: monthLabel(totalMonths).replace("od ", ""),
  }
}

const SUSTAINABILITY_CARD: SplashCard = {
  id: "sustainability",
  name: "Energie nula",
  tone: "blue",
  kicker: "Varianta B — udržitelnost na prvním místě",
  photo: {
    src: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=1600&auto=format&fit=crop",
    alt: "Solární panely na střeše budovy",
  },
  heroStats: [
    {
      label: "CO₂ ušetříte ročně",
      value: 12.4,
      format: (v) => `${v.toFixed(1)} t`,
      sub: "méně emisí každý rok",
    },
    {
      label: "Úspora energií",
      value: 62,
      format: (v) => `${Math.round(v)} %`,
      sub: "z třídy D na energeticky soběstačný dům",
    },
  ],
  milestones: [
    {
      title: "Energetický audit a konzultace",
      period: "od ledna 2026",
      duration: "1 měsíc",
      cumulativeSpent: 25_000,
    },
    {
      title: "Projekt + PENB certifikát",
      period: "od února 2026",
      duration: "3 měsíce",
      cumulativeSpent: 515_000,
    },
    {
      title: "Zateplení obálky budovy",
      period: "od května 2026",
      duration: "9 měsíců",
      cumulativeSpent: 8_915_000,
    },
    {
      title: "Výměna oken a dveří",
      period: "od února 2027",
      duration: "4 měsíce",
      cumulativeSpent: 13_815_000,
    },
    {
      title: "Zateplení střešního pláště",
      period: "od června 2027",
      duration: "5 měsíců",
      cumulativeSpent: 17_015_000,
    },
  ],
  totalMonths: 22,
  totalCost: 17_015_000,
  finishLabel: "listopadu 2027",
}

const TONE = {
  emerald: {
    wash: "bg-emerald-500/14 dark:bg-emerald-500/10",
    kicker: "text-emerald-600 dark:text-emerald-400",
    kickerLine: "bg-emerald-500/60",
    accentText: "text-emerald-600 dark:text-emerald-400",
    node: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
    nodeFill: "bg-emerald-500",
    line: "bg-gradient-to-b from-emerald-500 to-emerald-500/25",
    cta: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400",
  },
  blue: {
    wash: "bg-blue-500/14 dark:bg-blue-500/10",
    kicker: "text-blue-600 dark:text-blue-400",
    kickerLine: "bg-blue-500/60",
    accentText: "text-blue-600 dark:text-blue-400",
    node: "border-blue-500 text-blue-700 dark:text-blue-400",
    nodeFill: "bg-blue-500",
    line: "bg-gradient-to-b from-blue-500 to-blue-500/25",
    cta: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:text-blue-950 dark:hover:bg-blue-400",
  },
} as const

/**
 * Celoobrazovkový splash po dokončení onboardingu — dvě vertikální karty
 * (rychlá a levná vs. kompletní obnova) s klíčovými čísly a svislou časovou
 * osou s milníky a kumulativní útratou. Vizuálně navazuje na landing page:
 * fotky s tmavým přechodem, asymetrické rohy, rounded-full akce.
 * Logiku spuštění po onboardingu řeší jiný tým; komponenta jen dostane
 * onClose / onSelect.
 */
export function ScenarioSplash({
  onClose,
  onSelect,
  buildingData,
  buildingId,
}: {
  onClose: () => void
  /** Volá se s 'custom' nebo 'sustainability'. */
  onSelect?: (scenarioId: string) => void
  buildingData?: BuildingData
  buildingId?: string
}) {
  const cards = useMemo(() => {
    const variantA = buildingData
      ? buildCardFromBuilding(buildingData)
      : buildCard(
          scenarios.find((s) => s.id === "nejnutnejsi")!,
          "Varianta A — rychle a levně",
          {
            src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop",
            alt: "Řemeslníci při opravě domu",
          }
        )
    return [variantA, SUSTAINABILITY_CARD]
  }, [buildingData])

  // Zámek scrollu pozadí + zavření Escapem po dobu zobrazení.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Doporučené scénáře rekonstrukce"
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      {/* Pozadí — jemné barevné nádechy za oběma kartami (fixní, nescrolluje) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 size-[70%] rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute -right-1/4 -bottom-1/4 size-[70%] rounded-full bg-blue-500/8 blur-[120px]" />
      </div>

      {/* Zavření — fixně v rohu, viditelné i při scrollu */}
      <button
        onClick={onClose}
        aria-label="Zavřít a prozkoumat aplikaci"
        className="fixed top-5 right-5 z-20 flex size-10 items-center justify-center rounded-full border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-foreground sm:top-6 sm:right-6"
      >
        <X className="size-4" />
      </button>

      {/* Obsah — min. celá výška, při delším obsahu scrolluje celá stránka */}
      <div className="relative z-10 flex min-h-svh flex-col">
        {/* Hlavička */}
        <div className="animate-in fade-in slide-in-from-top-4 fill-mode-both shrink-0 px-5 pt-6 pb-4 text-center duration-500 sm:pt-8">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {buildingData?.address ?? "Vaše SVJ"}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            Máme to spočítané.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dvě cesty, jak dům opravit — vyberte si, nebo si vše projděte v klidu sami.
          </p>
        </div>

        {/* Dvě vertikální karty — jeden grid řádek = vždy stejná výška obou karet */}
        <div className="grid flex-1 grid-cols-1 gap-4 px-4 pb-4 sm:px-6 sm:pb-6 lg:grid-cols-2 lg:gap-5">
        {cards.map((card, cardIdx) => {
          const tone = TONE[card.tone]
          const first = cardIdx === 0
          return (
            <div
              key={card.id}
              style={{ animationDelay: `${cardIdx * 150}ms` }}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-700",
                "relative flex flex-col overflow-hidden border bg-card shadow-xl",
                // Asymetrické rohy jako na landingu — karty se „otevírají" od sebe.
                first
                  ? "rounded-[1.75rem] lg:rounded-bl-[4.5rem]"
                  : "rounded-[1.75rem] lg:rounded-br-[4.5rem]"
              )}
            >
              {/* Foto v hlavičce karty — ilustrace s tmavým přechodem */}
              <div className="relative h-40 shrink-0 overflow-hidden sm:h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.photo.src}
                  alt={card.photo.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.18em] text-white/80 uppercase">
                    <span className={cn("h-px w-7", tone.kickerLine)} />
                    {card.kicker}
                  </p>
                  <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {card.name}
                  </h2>
                </div>
              </div>

              {/* Jemný barevný nádech těla karty */}
              <div className={cn("pointer-events-none absolute inset-0 opacity-30", tone.wash)} />

              <div className="relative flex flex-1 flex-col gap-5 p-5 sm:p-6">
                {/* Dvě hlavní čísla — bez rámečků, oddělená linkou */}
                <div className="grid grid-cols-2 divide-x divide-border">
                  {card.heroStats.map((stat, statIdx) => (
                    <div
                      key={stat.label}
                      className={cn(statIdx === 0 ? "pr-5" : "pl-5")}
                    >
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p
                        className={cn(
                          "mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl",
                          tone.accentText
                        )}
                      >
                        {stat.format(stat.value)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Svislá časová osa s útratou — roztahuje se podle výšky karty,
                    takže kratší scénář má milníky dál od sebe a karty lícují. */}
                <div className="flex flex-1 flex-col border-t pt-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Jak to půjde a kolik bude utraceno
                  </p>
                  <div className="relative mt-4 flex flex-1 flex-col">
                    {/* Linka */}
                    <span
                      className={cn("absolute top-3 bottom-3 left-[13px] w-0.5", tone.line)}
                    />
                    <div className="flex flex-1 flex-col justify-between gap-4">
                      {card.milestones.map((m, i) => (
                        <div
                          key={m.title}
                          className="flex items-start gap-3.5"
                        >
                          <span
                            className={cn(
                              "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-background text-xs font-semibold",
                              tone.node,
                              i === 0 && cn(tone.nodeFill, "border-transparent text-white")
                            )}
                          >
                            {i + 1}
                          </span>
                          <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{m.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {m.period} · {m.duration}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold tabular-nums">
                                {fmtCzkShort(m.cumulativeSpent)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">celkem utraceno</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Cíl */}
                      <div className="flex items-start gap-3.5">
                        <span
                          className={cn(
                            "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-white",
                            tone.nodeFill
                          )}
                        >
                          <Flag className="size-3.5" />
                        </span>
                        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                          <div>
                            <p className={cn("text-sm font-semibold", tone.accentText)}>Hotovo</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {card.finishLabel} · za {fmtDuration(card.totalMonths)}
                            </p>
                          </div>
                          <p
                            className={cn(
                              "shrink-0 text-sm font-bold tabular-nums",
                              tone.accentText
                            )}
                          >
                            {fmtCzkShort(card.totalCost)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    onSelect?.(card.id)
                    if (buildingId) {
                      createClient()
                        .from("buildings")
                        .update({ selected_scenario: card.id })
                        .eq("id", buildingId)
                        .then(() => {})
                    }
                    onClose()
                  }}
                  className={cn(
                    "animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-300 duration-500",
                    "group mt-auto flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition-colors",
                    tone.cta
                  )}
                >
                  Chci tuhle cestu
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
