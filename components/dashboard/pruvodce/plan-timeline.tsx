"use client"

import Link from "next/link"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/dashboard/pruvodce/badge"
import {
  FINISH_INDEX,
  WIZARD_STEPS,
  type WizardStep,
} from "@/lib/pruvodce/steps"
import { PARTNERS, PARTNER_ACCENT } from "@/lib/pruvodce/partners"

/**
 * Svislý plán celého procesu. Hotové kroky jsou sbalené a odškrtnuté,
 * nadcházející jen naznačené. Aktivní krok je rozbalený a nese vše, co je
 * pro něj relevantní — checklist „co je potřeba", tip a navázaného pomocníka.
 */
export function PlanTimeline({
  currentIndex,
  onMarkDone,
  onSelectStep,
  onReset,
}: {
  currentIndex: number
  onMarkDone: () => void
  onSelectStep: (index: number) => void
  onReset: () => void
}) {
  return (
    <section className="rounded-3xl border bg-background/60 p-5 backdrop-blur-sm sm:p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Váš plán</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Krok {Math.min(currentIndex + 1, WIZARD_STEPS.length)} z{" "}
            {WIZARD_STEPS.length}
          </p>
        </div>
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={onReset}
            title="Začít znovu od prvního kroku"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      </header>

      <ol className="flex flex-col">
        {WIZARD_STEPS.map((step, i) => (
          <PlanRow
            key={step.id}
            step={step}
            index={i}
            currentIndex={currentIndex}
            isLast={i === WIZARD_STEPS.length - 1}
            onMarkDone={onMarkDone}
            onSelectStep={onSelectStep}
          />
        ))}
      </ol>
    </section>
  )
}

function PlanRow({
  step,
  index,
  currentIndex,
  isLast,
  onMarkDone,
  onSelectStep,
}: {
  step: WizardStep
  index: number
  currentIndex: number
  isLast: boolean
  onMarkDone: () => void
  onSelectStep: (index: number) => void
}) {
  const isDone = index < currentIndex
  const isActive = index === currentIndex
  const isBuild = step.kind === "build"
  const isFinishStep = step.kind === "finish"
  const accent = isBuild ? "amber" : isFinishStep ? "emerald" : "blue"

  return (
    <li className="flex gap-3.5 sm:gap-4">
      {/* Rail */}
      <div className="flex flex-col items-center">
        <Dot
          index={index}
          isDone={isDone}
          isActive={isActive}
          accent={accent}
        />
        {!isLast && (
          <span
            className={cn(
              "w-0.5 flex-1 rounded-full transition-colors duration-500",
              isDone ? "bg-emerald-500" : "bg-border"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-5")}>
        {/* Clickable header — title left, status/duration right */}
        <button
          type="button"
          onClick={() => onSelectStep(index)}
          className="group flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "font-medium transition-colors",
                isActive ? "text-xl font-semibold" : "truncate text-base",
                isDone && "text-muted-foreground line-through",
                isActive &&
                  (isBuild
                    ? "text-amber-600 dark:text-amber-400"
                    : isFinishStep
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-foreground"),
                !isDone && !isActive && "text-foreground/80"
              )}
            >
              {step.title}
            </span>
            {step.badge && !isDone && (
              <Badge tone={isBuild ? "amber" : "blue"}>{step.badge}</Badge>
            )}
          </span>

          <span
            className={cn(
              "shrink-0 text-sm font-medium",
              isDone && "text-emerald-600 dark:text-emerald-400",
              isActive &&
                (isBuild
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-primary"),
              !isDone && !isActive && "text-muted-foreground"
            )}
          >
            {isDone
              ? "Dokončeno"
              : isActive
                ? step.duration
                  ? `Aktivní · ${step.duration}`
                  : "Aktivní"
                : (step.duration ?? "")}
          </span>
        </button>

        {/* Expanded detail for the active step only */}
        {isActive && (
          <div className="mt-3 animate-in rounded-2xl border bg-card/70 p-4 duration-300 fade-in slide-in-from-top-1">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Co je potřeba
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {step.checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base">
                  <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            {step.tip && (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-amber-500/10 px-3.5 py-3 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{step.tip}</span>
              </div>
            )}

            {step.partner && step.partner !== "bank" && (
              <PartnerInline partnerId={step.partner} />
            )}

            {/* Action row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {!isFinishStep ? (
                <Button
                  size="sm"
                  onClick={onMarkDone}
                  className={cn(
                    "h-9 gap-1.5 rounded-full px-4 text-xs font-semibold",
                    isBuild &&
                      "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600"
                  )}
                >
                  <Check className="size-3.5" />
                  Označit jako hotovo
                </Button>
              ) : (
                <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  Celý proces dokončen
                </p>
              )}
              {index < FINISH_INDEX && (
                <span className="text-xs text-muted-foreground">
                  Další: {WIZARD_STEPS[index + 1]?.short}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  )
}

function Dot({
  index,
  isDone,
  isActive,
  accent,
}: {
  index: number
  isDone: boolean
  isActive: boolean
  accent: "blue" | "amber" | "emerald"
}) {
  const base =
    "relative flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300"

  if (isDone) {
    return (
      <span className={cn(base, "bg-emerald-600 text-white dark:bg-emerald-500")}>
        <Check className="size-3.5" />
      </span>
    )
  }

  if (isActive) {
    const fill =
      accent === "amber"
        ? "bg-amber-500"
        : accent === "emerald"
          ? "bg-emerald-600 dark:bg-emerald-500"
          : "bg-primary"
    const ping =
      accent === "amber"
        ? "bg-amber-500/40"
        : accent === "emerald"
          ? "bg-emerald-500/40"
          : "bg-primary/30"
    return (
      <span className={cn(base, "text-white", fill)}>
        <span className={cn("absolute inset-0 animate-ping rounded-full", ping)} />
        <span className="relative">{index + 1}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(base, "border-2 border-border bg-background text-muted-foreground")}
    >
      {index + 1}
    </span>
  )
}

function PartnerInline({ partnerId }: { partnerId: keyof typeof PARTNERS }) {
  const partner = PARTNERS[partnerId]
  const accent = PARTNER_ACCENT[partner.accent]
  const Icon = partner.icon
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border bg-background/60 p-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          accent.iconWrap
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{partner.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {partner.tagline}
        </p>
      </div>
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="h-8 shrink-0 gap-1 rounded-full px-3 text-xs"
      >
        <Link href={partner.href ?? "#pomocnici"}>
          {partner.cta}
          <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  )
}
