"use client"

import { Fragment } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { PHASES, phaseStatus, type PhaseId } from "@/lib/pruvodce/steps"

/**
 * Tři makro-fáze procesu (Plánování → Financování → Realizace). Stav každé
 * fáze se odvozuje z aktuálního kroku. Spojnice mezi uzly se plynule plní.
 */
export function PhaseStepper({
  currentIndex,
  onSelectPhase,
}: {
  currentIndex: number
  /** Skok na první krok dané fáze (volitelné). */
  onSelectPhase?: (phase: PhaseId) => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl items-start">
      {PHASES.map((phase, i) => {
        const status = phaseStatus(phase.id, currentIndex)
        const number = i + 1
        return (
          <Fragment key={phase.id}>
            {i > 0 && (
              // Spojnice — zarovnaná na střed kruhu (half of size-9 = 18px).
              <div className="mt-[17px] h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                <span
                  className={cn(
                    "block h-full rounded-full bg-primary transition-[width] duration-700 ease-out",
                    phaseStatus(PHASES[i - 1].id, currentIndex) === "done"
                      ? "w-full"
                      : "w-0"
                  )}
                />
              </div>
            )}

            <div className="flex shrink-0 flex-col items-center">
              <button
                type="button"
                onClick={() => onSelectPhase?.(phase.id)}
                disabled={!onSelectPhase}
                aria-current={status === "active" ? "step" : undefined}
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                  onSelectPhase && "cursor-pointer",
                  status === "done" &&
                    "bg-emerald-600 text-white dark:bg-emerald-500",
                  status === "active" &&
                    "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                  status === "upcoming" &&
                    "border-2 border-border bg-background text-muted-foreground"
                )}
              >
                {status === "active" && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                )}
                <span className="relative">
                  {status === "done" ? <Check className="size-4" /> : number}
                </span>
              </button>

              <span
                className={cn(
                  "mt-2 max-w-[7rem] text-center text-xs font-medium transition-colors sm:text-sm",
                  status === "done" && "text-emerald-600 dark:text-emerald-400",
                  status === "active" && "text-foreground",
                  status === "upcoming" && "text-muted-foreground"
                )}
              >
                {phase.label}
              </span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
