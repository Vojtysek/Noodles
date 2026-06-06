"use client"

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import { Check, ExternalLink, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fmtDuration } from "@/lib/mock-data"
import type { RoadmapItem } from "@/components/dashboard/roadmap"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StepKind = "process" | "renovation" | "finish"

type HintItem = {
  text: string
  action?: { label: string; href: string }
}

type HarmonogramStep = {
  id: string
  kind: StepKind
  label: string
  sublabel?: string
  /** For the combined renovation step: list of parallel projects */
  subItems?: string[]
  hints: HintItem[]
}

// ---------------------------------------------------------------------------
// Static pre-steps — always the same regardless of scenario
// ---------------------------------------------------------------------------

const PRE_STEPS: HarmonogramStep[] = [
  {
    id: "svj-1",
    kind: "process",
    label: "Schůzka SVJ",
    sublabel: "1 měsíc",
    hints: [
      {
        text: "Připravte prezentaci s klíčovými čísly — co se bude rekonstruovat, kolik to stojí a kdy se vyplatí.",
      },
      {
        text: "Pro schválení renovace potřebujete nadpoloviční většinu vlastníků na schůzi SVJ.",
      },
      {
        text: "Dejte rezidentům export s argumenty před schůzkou do schránky — každý si ho může doma a v klidu prostudovat.",
        action: {
          label: "Vytvořit export pro rezidenty",
          href: "/dashboard/exporty",
        },
      },
    ],
  },
  {
    id: "renovacni-pas",
    kind: "process",
    label: "Renovační pas",
    sublabel: "1 měsíc",
    hints: [
      {
        text: "Renovační pas je povinný dokument pro čerpání dotací NZÚ — zajistěte ho u certifikovaného energetického specialisty.",
      },
      {
        text: "Pošlete projektantovi stručné informace o domu a plánovaných projektech — ušetříte čas při přípravě dokumentace.",
        action: {
          label: "Vytvořit export pro projektanta",
          href: "/dashboard/exporty",
        },
      },
    ],
  },
  {
    id: "stavebni-povoleni",
    kind: "process",
    label: "Stavební povolení",
    sublabel: "3 měsíce",
    hints: [
      {
        text: "Stavební povolení trvá typicky 2–3 měsíce — podejte žádost co nejdříve, abyste nezpomalili celý harmonogram.",
      },
      {
        text: "Potřebujete projektovou dokumentaci od certifikovaného projektanta a souhlas vlastníků.",
      },
    ],
  },
  {
    id: "dotace-nzu",
    kind: "process",
    label: "Dotace NZÚ",
    sublabel: "1 měsíc",
    hints: [
      {
        text: "Dotace Nová zelená úsporám pokrývá až 50 % uznatelných nákladů na zateplení a výměnu oken.",
      },
      {
        text: "Žádost podávejte paralelně se stavebním povolením — oba procesy lze vést souběžně a ušetříte měsíc i více.",
      },
    ],
  },
  {
    id: "vyber-firmy",
    kind: "process",
    label: "Výběr firmy",
    sublabel: "1 měsíc",
    hints: [
      {
        text: "Oslovte minimálně 3 firmy a srovnejte nabídky. Nejlevnější nemusí být nejlepší — sledujte reference a pojistku odpovědnosti.",
      },
      {
        text: "Zkontrolujte záruční podmínky, platební milníky a pokuty za prodlení — předejdete pozdějším sporům.",
      },
    ],
  },
  {
    id: "svj-2",
    kind: "process",
    label: "Schůzka SVJ",
    sublabel: "1 měsíc",
    hints: [
      {
        text: "Na druhé schůzi odsouhlaste výběr stavební firmy, konečné ceny a harmonogram prací.",
      },
      {
        text: "Připravte odpovědi na nejčastější námitky — cena, délka stavby, rušení klidu. Export pro rezidenty pomůže s argumentací.",
        action: {
          label: "Vytvořit export pro rezidenty",
          href: "/dashboard/exporty",
        },
      },
    ],
  },
]

const KOLAUDACE_STEP: HarmonogramStep = {
  id: "kolaudace",
  kind: "process",
  label: "Kolaudace",
  sublabel: "závěr",
  hints: [
    {
      text: "Před kolaudací zajistěte revize všech nových instalací (elektro, plyn, TZB) — bez nich kolaudační souhlas nezískáte.",
    },
    {
      text: "Připravte dokumentaci pro pojišťovnu o zhodnocení nemovitosti — po renovaci zpravidla klesne pojistné.",
    },
  ],
}

const DOKONCENO_STEP: HarmonogramStep = {
  id: "dokonceno",
  kind: "finish",
  label: "Dokončeno",
  hints: [
    {
      text: "Gratulujeme — rekonstrukce je hotova! Dům je teď energeticky efektivnější a hodnotnější.",
    },
    {
      text: "Informujte rezidenty o výsledcích. Aktualizujte pojistnou smlouvu a provozní řád domu.",
    },
  ],
}

// ---------------------------------------------------------------------------
// Build the single "Realizace" step from scenario items
// ---------------------------------------------------------------------------

function isFVE(item: RoadmapItem): boolean {
  const t = item.title.toLowerCase()
  return t.includes("fotovoltai") || t.includes("fve") || t.includes("solár")
}

function buildRealizaceStep(items: RoadmapItem[]): HarmonogramStep {
  if (items.length === 0) {
    return {
      id: "realizace",
      kind: "renovation",
      label: "Realizace",
      sublabel: "dle zvoleného plánu",
      hints: [
        {
          text: "Zvolte scénář rekonstrukce výše pro zobrazení detailů realizace.",
        },
      ],
    }
  }

  const fveItem = items.find(isFVE)
  const nonFveItems = items.filter((i) => !isFVE(i))

  // Parallel works: the longest non-FVE project sets the base duration.
  // FVE is always installed last — its months are added on top.
  const maxNonFveMonths =
    nonFveItems.length > 0
      ? Math.max(...nonFveItems.map((i) => i.months))
      : Math.max(...items.map((i) => i.months))

  const totalMonths = fveItem
    ? maxNonFveMonths + fveItem.months
    : maxNonFveMonths

  const hints: HintItem[] = []
  if (items.length === 1) {
    hints.push({
      text: `Probíhá: ${items[0].title}. Koordinujte s dodavatelem průběžná přejímací řízení a platební milníky.`,
    })
  } else {
    const names = items.map((i) => i.title).join(", ")
    hints.push({
      text: `Práce probíhají souběžně: ${names}. Koordinujte dodavatele tak, aby si navzájem nepřekáželi.`,
    })
  }
  hints.push({
    text: "Platební zálohy uvolňujte až po splnění smluvních etap. Každou závadu dokumentujte fotograficky.",
  })
  if (fveItem) {
    hints.push({
      text: "Fotovoltaika se instaluje jako poslední — vyžaduje připravenou střešní konstrukci a souhlas distributora elektřiny. Podejte žádost o připojení co nejdříve (čekací doby bývají 2–4 měsíce).",
    })
  }

  return {
    id: "realizace",
    kind: "renovation",
    label: "Realizace",
    sublabel: fmtDuration(totalMonths),
    subItems: items.map((i) => i.title),
    hints,
  }
}

// Total step count is always fixed: 6 pre + realizace + kolaudace + dokonceno = 9
const TOTAL_STEPS = PRE_STEPS.length + 3

function buildSteps(items: RoadmapItem[]): HarmonogramStep[] {
  return [
    ...PRE_STEPS,
    buildRealizaceStep(items),
    KOLAUDACE_STEP,
    DOKONCENO_STEP,
  ]
}

// ---------------------------------------------------------------------------
// Step dot — takes a callback ref so we can measure its position
// ---------------------------------------------------------------------------

interface StepDotProps {
  kind: StepKind
  index: number
  isCurrent: boolean
  isDone: boolean
  dotRef: (el: HTMLSpanElement | null) => void
}

function StepDot({ kind, index, isCurrent, isDone, dotRef }: StepDotProps) {
  const base =
    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300"

  if (isDone) {
    return (
      <span
        ref={dotRef}
        className={cn(base, "bg-emerald-600 text-white dark:bg-emerald-500")}
      >
        <Check className="size-3.5" />
      </span>
    )
  }

  if (isCurrent) {
    const ping =
      kind === "finish"
        ? "bg-emerald-500"
        : kind === "renovation"
          ? "bg-amber-500"
          : "bg-blue-500"
    const fill =
      kind === "finish"
        ? "bg-emerald-600 dark:bg-emerald-500"
        : kind === "renovation"
          ? "bg-amber-500"
          : "bg-blue-600 dark:bg-blue-500"
    const label = kind === "finish" ? "✓" : index + 1
    return (
      <span
        ref={dotRef}
        className="relative flex size-7 shrink-0 items-center justify-center"
      >
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-25",
            ping
          )}
        />
        <span className={cn(base, "relative text-white", fill)}>{label}</span>
      </span>
    )
  }

  if (kind === "finish") {
    return (
      <span
        ref={dotRef}
        className={cn(
          base,
          "border-2 border-emerald-400 bg-background text-emerald-500 dark:border-emerald-700"
        )}
      >
        ✓
      </span>
    )
  }

  return (
    <span
      ref={dotRef}
      className={cn(
        base,
        "border-2 bg-background",
        kind === "renovation"
          ? "border-amber-400 text-amber-500"
          : "border-border text-muted-foreground"
      )}
    >
      {index + 1}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Chat bubble
// ---------------------------------------------------------------------------

function ChatBubble({ hint, delay }: { hint: HintItem; delay: number }) {
  return (
    <div
      className="flex animate-in items-start gap-3 fade-in slide-in-from-bottom-2"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
        animationDuration: "280ms",
      }}
    >
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-background">
        AI
      </div>

      <div className="flex-1 space-y-2">
        <div className="relative max-w-prose rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
          <span
            aria-hidden
            className="absolute top-2.5 -left-1 size-3 rotate-45 bg-muted"
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
          />
          {hint.text}
        </div>

        {hint.action && (
          <div className="relative max-w-prose rounded-2xl rounded-tl-sm border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900 dark:bg-blue-950/40">
            <span
              aria-hidden
              className="absolute top-2.5 -left-px size-3 rotate-45 border-t border-l border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
            />
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Doporučená akce
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 rounded-full border-blue-300 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
              >
                <Link href={hint.action.href}>
                  {hint.action.label}
                  <ExternalLink className="size-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Harmonogram({
  items,
  finishLabel,
  storageKey = "harmonogram-current-step",
}: {
  items: RoadmapItem[]
  finishLabel: string
  storageKey?: string
}) {
  // Steps rebuilt whenever the scenario changes; count always = TOTAL_STEPS
  const steps = useMemo(() => buildSteps(items), [items])

  const [currentStep, setCurrentStep] = useState(0)
  const [hintsKey, setHintsKey] = useState(0)
  // X position (px from container left) where the speech-bubble pointer points
  const [pointerX, setPointerX] = useState(40)

  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLSpanElement | null)[]>(
    new Array(TOTAL_STEPS).fill(null)
  )

  // ── Restore from localStorage ────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw !== null) {
        const idx = parseInt(raw, 10)
        if (!isNaN(idx) && idx >= 0 && idx < TOTAL_STEPS) {
          startTransition(() => setCurrentStep(idx))
        }
      }
    } catch {}
  }, [storageKey])

  // ── Measure dot position → update speech-bubble pointer ─────────────────
  const updatePointer = useCallback(() => {
    const container = containerRef.current
    const dot = dotRefs.current[currentStep]
    if (!container || !dot) return
    const cR = container.getBoundingClientRect()
    const dR = dot.getBoundingClientRect()
    const x = dR.left + dR.width / 2 - cR.left
    // Clamp so the tail stays well inside the panel's rounded-2xl corners (16 px radius).
    // The tail is size-5 rotated — visual half-width ≈ 14 px; add 4 px margin → 30 px.
    setPointerX(Math.max(30, Math.min(x, cR.width - 30)))
  }, [currentStep])

  useEffect(() => {
    const raf = requestAnimationFrame(updatePointer)
    const tl = timelineRef.current
    const onScroll = () => requestAnimationFrame(updatePointer)
    const onResize = () => requestAnimationFrame(updatePointer)
    tl?.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      tl?.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
    }
  }, [updatePointer])

  // ── Auto-scroll timeline to keep current dot centred ────────────────────
  useEffect(() => {
    const dot = dotRefs.current[currentStep]
    const tl = timelineRef.current
    if (!dot || !tl) return
    const dR = dot.getBoundingClientRect()
    const tR = tl.getBoundingClientRect()
    const delta = dR.left + dR.width / 2 - (tR.left + tR.width / 2)
    tl.scrollBy({ left: delta, behavior: "smooth" })
    // Re-measure after the scroll animation settles (~300 ms)
    const t = setTimeout(updatePointer, 350)
    return () => clearTimeout(t)
  }, [currentStep, updatePointer])

  // ── Actions ──────────────────────────────────────────────────────────────
  const markDone = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, TOTAL_STEPS - 1)
      try {
        localStorage.setItem(storageKey, String(next))
      } catch {}
      return next
    })
    setHintsKey((k) => k + 1)
  }, [storageKey])

  const reset = useCallback(() => {
    setCurrentStep(0)
    setHintsKey((k) => k + 1)
    try {
      localStorage.removeItem(storageKey)
    } catch {}
  }, [storageKey])

  const activeStep = steps[currentStep]
  const isFinished = currentStep >= TOTAL_STEPS - 1
  const accent = isFinished
    ? "emerald"
    : activeStep.kind === "renovation"
      ? "amber"
      : "blue"

  return (
    <div ref={containerRef} className="flex flex-col">
      {/* ── Timeline ───────────────────────────────────────────────────────
          overflow-x:auto also clips overflow-y (browser spec).
          pt-5 gives 20 px headroom so the animate-ping ring (~14 px above
          the dot centre) is never clipped by the scroll container.
          scrollbar-width:none hides the scrollbar on supporting browsers.
      ─────────────────────────────────────────────────────────────────── */}
      <div
        ref={timelineRef}
        className="overflow-x-auto px-2 pt-5 pb-3 sm:px-3"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`.harmonogram-tl::-webkit-scrollbar{display:none}`}</style>
        <div className="harmonogram-tl flex min-w-full items-start px-0.5">
          {steps.map((step, i) => {
            const isDone = i < currentStep
            const isCurrent = i === currentStep
            return (
              <div
                key={step.id}
                className="flex flex-col"
                style={{
                  flex: "1 1 0",
                  minWidth:
                    step.kind === "renovation"
                      ? 112
                      : step.kind === "finish"
                        ? 64
                        : 80,
                }}
              >
                {/* Dot + connecting line */}
                <div className="flex items-center">
                  <StepDot
                    kind={step.kind}
                    index={i}
                    isCurrent={isCurrent}
                    isDone={isDone}
                    dotRef={(el) => {
                      dotRefs.current[i] = el
                    }}
                  />
                  {i < steps.length - 1 && (
                    <span
                      className={cn(
                        "h-px min-w-3 flex-1 transition-colors duration-500",
                        isDone ? "bg-emerald-500" : "bg-border"
                      )}
                    />
                  )}
                </div>

                {/* Label block */}
                <div className="mt-2 pr-2">
                  <p
                    className={cn(
                      "text-[11px] leading-tight font-medium transition-colors",
                      isDone && "text-muted-foreground/50 line-through",
                      isCurrent &&
                        step.kind === "renovation" &&
                        "text-amber-600 dark:text-amber-400",
                      isCurrent &&
                        step.kind === "process" &&
                        "text-blue-600 dark:text-blue-400",
                      isCurrent &&
                        step.kind === "finish" &&
                        "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.sublabel && (
                    <p className="mt-px text-[10px] leading-tight text-muted-foreground/70">
                      {step.sublabel}
                    </p>
                  )}
                  {step.kind === "renovation" &&
                    step.subItems &&
                    step.subItems.length > 0 && (
                      <p className="mt-0.5 max-w-30 truncate text-[9px] leading-tight text-muted-foreground/50">
                        {step.subItems.join(" · ")}
                      </p>
                    )}
                  {step.kind === "renovation" && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-900/40 dark:text-amber-400">
                      stavba
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Speech-bubble panel ─────────────────────────────────────────────
          Classic rotated-square tail: border-l + border-t show as the ∧ sides,
          the rest is hidden under the panel. bg-background covers the panel's
          top border at the tail location — no visible seam.
          rounded-sm softens the tip into a gentle curve.
          Spring CSS transition follows the active dot.
      ─────────────────────────────────────────────────────────────────── */}
      <div className="relative mt-1">
        {/* Tail */}
        <div
          aria-hidden
          className={cn(
            "absolute z-10 size-6 rotate-45 rounded-sm border-t border-l",
            accent === "emerald"
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
              : "border-border bg-background"
          )}
          style={{
            top: -12,
            left: pointerX - 12,
            transition: "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        {/* Panel */}
        <div
          className={cn(
            "rounded-2xl border p-4 sm:p-5",
            accent === "emerald"
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
              : "border-border bg-background"
          )}
        >
          {/* Header row */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                  {isFinished ? "Hotovo" : "Teď je na řadě"}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-px text-[10px] font-medium tabular-nums",
                    accent === "emerald"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : accent === "amber"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                  )}
                >
                  {currentStep + 1}&thinsp;/&thinsp;{TOTAL_STEPS}
                </span>
              </div>
              <h3
                className={cn(
                  "mt-0.5 text-base font-semibold",
                  accent === "amber" &&
                    !isFinished &&
                    "text-amber-600 dark:text-amber-400",
                  accent === "emerald" &&
                    "text-emerald-700 dark:text-emerald-400"
                )}
              >
                {activeStep.label}
              </h3>
              {activeStep.sublabel && !isFinished && (
                <p className="mt-px text-xs text-muted-foreground">
                  {activeStep.sublabel}
                </p>
              )}
            </div>

            {currentStep > 0 && (
              <button
                onClick={reset}
                title="Resetovat harmonogram na začátek"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
          </div>

          {/* Chat bubbles */}
          <div key={hintsKey} className="flex flex-col gap-3">
            {activeStep.hints.map((hint, i) => (
              <ChatBubble key={i} hint={hint} delay={i * 90} />
            ))}
          </div>

          {/* CTA footer */}
          {!isFinished ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="truncate text-xs text-muted-foreground">
                {currentStep < TOTAL_STEPS - 2
                  ? `Další: ${steps[currentStep + 1]?.label ?? ""}`
                  : "Poslední krok před dokončením."}
              </p>
              <Button
                onClick={markDone}
                size="sm"
                className={cn(
                  "h-8 shrink-0 gap-1.5 rounded-full px-4 text-xs font-semibold",
                  accent === "amber" &&
                    "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600"
                )}
              >
                <Check className="size-3.5" />
                Označit jako hotovo
              </Button>
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-1.5 text-center">
              <span className="text-3xl">🏠</span>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Rekonstrukce dokončena
              </p>
              <p className="text-xs text-muted-foreground">{finishLabel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
