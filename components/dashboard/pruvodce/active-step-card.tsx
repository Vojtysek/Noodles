"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, PartyPopper } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  FINISH_INDEX,
  type StepAction,
  type WizardStep,
} from "@/lib/pruvodce/steps"

/**
 * Hero karta aktuálního kroku — proč je tenhle krok na řadě a hlavní akce.
 * U kroku „Financování" je hlavní akcí CTA do banky (klíčový byznysový cíl).
 * Konkrétní „co je potřeba" žije v časové ose, ne tady.
 */
export function ActiveStepCard({
  step,
  index,
  onOpenFinancing,
}: {
  step: WizardStep
  index: number
  onOpenFinancing: () => void
}) {
  const isFinish = index >= FINISH_INDEX
  const isFinance = step.kind === "finance"
  const Icon = isFinish ? PartyPopper : step.icon
  const eyebrow = isFinish ? "Hotovo" : "Teď je na řadě"

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border p-6 sm:p-8 md:p-10",
        isFinish
          ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-emerald-50/40 to-transparent dark:border-emerald-900/60 dark:from-emerald-950/40"
          : "border-primary/15 bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent"
      )}
    >
      {/* Měkká záře v rohu */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -right-16 -z-10 size-72 rounded-full blur-[100px]",
          isFinish ? "bg-emerald-500/15" : "bg-primary/15"
        )}
      />

      {/* Re-mount na změnu kroku → jemný vstupní přechod */}
      <div
        key={step.id}
        className="flex animate-in flex-col items-center text-center duration-500 fade-in slide-in-from-bottom-3"
      >
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase",
            isFinish
              ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-3.5" />
          {eyebrow}
        </span>

        <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {step.title}
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {step.description}
        </p>

        {step.highlights && step.highlights.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border bg-background/70 px-4 py-3 backdrop-blur-sm sm:gap-5">
            {step.highlights.map((h) => (
              <span
                key={h}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-7 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {step.action && (
              <StepActionButton
                action={step.action}
                tone={isFinish ? "finish" : "primary"}
                onOpenFinancing={onOpenFinancing}
              />
            )}
            {step.secondaryAction && (
              <StepActionButton
                action={step.secondaryAction}
                tone="secondary"
                onOpenFinancing={onOpenFinancing}
              />
            )}
            {!step.action && isFinish && (
              <StepActionButton
                action={{
                  label: "Sdílet výsledky s vlastníky",
                  href: "/dashboard/exporty",
                }}
                tone="finish"
                onOpenFinancing={onOpenFinancing}
              />
            )}
          </div>

          {isFinance && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Ve spolupráci s</span>
              <Image
                src="/sporitelna-logo.png"
                alt="Česká spořitelna"
                width={100}
                height={100}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StepActionButton({
  action,
  tone,
  onOpenFinancing,
}: {
  action: StepAction
  tone: "primary" | "secondary" | "finish"
  onOpenFinancing: () => void
}) {
  const className = cn(
    "group h-12 rounded-full px-7 text-sm font-semibold",
    tone === "primary" && "shadow-xl shadow-primary/20",
    tone === "finish" && "shadow-xl shadow-emerald-500/20"
  )
  const variant = tone === "secondary" ? "outline" : "default"
  const inner = (
    <>
      {action.label}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </>
  )

  if (action.modal === "financing") {
    return (
      <Button
        size="lg"
        variant={variant}
        onClick={onOpenFinancing}
        className={className}
      >
        {inner}
      </Button>
    )
  }

  return (
    <Button asChild size="lg" variant={variant} className={className}>
      <Link
        href={action.href ?? "#"}
        {...(action.external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {inner}
      </Link>
    </Button>
  )
}
