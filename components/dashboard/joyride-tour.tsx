"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { X } from "lucide-react"
import {
  Joyride,
  ACTIONS,
  EVENTS,
  STATUS,
  type EventData,
  type Step,
  type TooltipRenderProps,
} from "react-joyride"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "noodles_tour_seen"

const STEP_ROUTES: Record<number, string> = {
  0: "/dashboard/prehled",
  1: "/dashboard/prehled",
  2: "/dashboard/rezidenti",
  3: "/dashboard/rezidenti",
  4: "/dashboard/financials",
  5: "/dashboard/projects",
  6: "/dashboard/exporty",
}

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    skipBeacon: true,
    title: "Vítejte v Noodles",
    content:
      "Ukážeme vám základy aplikace za méně než minutu. Můžete kdykoli přeskočit.",
  },
  {
    target: '[data-joyride="prehled-hero"]',
    skipBeacon: true,
    title: "Základní informace budovy",
    content:
      "Energetická třída, počet bytových jednotek, odhadovaná měsíční splátka na byt a roční úspora na energiích — vše na jednom místě.",
  },
  {
    target: '[data-joyride="rezidenti-archetypes"]',
    skipBeacon: true,
    title: "Rezidenti — typy sousedů",
    content:
      "Vyberte typ souseda ze vestavěných archetypů nebo přidejte vlastní personu popisem vlastními slovy — AI z toho vytvoří profil.",
  },
  {
    target: '[data-joyride="rezidenti-strategie"]',
    skipBeacon: true,
    title: "Argumentační strategie",
    content:
      "Zde vidíte profil vybraného souseda — jeho motivace, námitky a co odmítá. Tlačítkem Vygenerovat strategie necháte AI připravit konkrétní argumenty pro přesvědčení tohoto typu souseda ve vašem scénáři rekonstrukce.",
  },
  {
    target: '[data-joyride="finance-main"]',
    skipBeacon: true,
    title: "Finance",
    content:
      "Detailní finanční model celé rekonstrukce — klíčové ukazatele jako celkové náklady, roční úspora, návratnost investice a měsíční splátka na byt. Níže najdete graf vývoje nákladů, rozpad financování a scénáře na různé časové horizonty.",
  },
  {
    target: '[data-joyride="projekty-list"]',
    skipBeacon: true,
    title: "Výběr projektů",
    content:
      "Vyberte konkrétní rekonstrukce pro váš dům — fasáda, okna, střecha a další. U každé vidíte celkové náklady, dobu realizace a úsporu energie. Kliknutím projekt přidáte nebo odeberete z plánu.",
  },
  {
    target: '[data-joyride="exporty-cards"]',
    skipBeacon: true,
    title: "Exporty — materiály pro sousedy",
    content: (
      <div className="flex flex-col gap-2 text-sm">
        <p>Čtyři typy dokumentů připravených ke stažení:</p>
        <ul className="flex flex-col gap-1.5 pl-1">
          <li>
            <strong>Stručný přehled</strong> (PDF, 2–3 strany) — pro nástěnku
            nebo hromadný e-mail
          </li>
          <li>
            <strong>Personalizovaný export</strong> (PDF, 3–4 strany) —
            argumenty šité na míru konkrétnímu rezidentovi
          </li>
          <li>
            <strong>Detailní report</strong> (PDF, 10–15 stran) — pro
            analytické povahy
          </li>
          <li>
            <strong>Prezentace</strong> (PPTX, 8–10 snímků) — připravená k
            promítání na schůzi SVJ
          </li>
        </ul>
      </div>
    ),
  },
]

function CustomTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="relative w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-card/95 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-border"
    >
      {/* X skips the entire tour */}
      <button
        {...skipProps}
        className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Zavřít průvodce"
      >
        <X className="size-4" />
      </button>

      {/* Title */}
      {step.title && (
        <h3 className="mb-2 pr-8 text-base font-semibold tracking-tight text-foreground">
          {step.title as React.ReactNode}
        </h3>
      )}

      {/* Content */}
      <div className="text-sm leading-relaxed text-muted-foreground">
        {step.content as React.ReactNode}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          {...skipProps}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Přeskočit
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: size }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Zpět
            </button>
          )}
          <button
            {...primaryProps}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
          >
            {isLastStep ? "Hotovo" : "Další"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function JoyrideTour() {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setRun(true)
    }
  }, [])

  function stop() {
    localStorage.setItem(STORAGE_KEY, "1")
    setRun(false)
    setStepIndex(0)
  }

  function navigate(nextIndex: number) {
    const nextRoute = STEP_ROUTES[nextIndex]
    if (nextRoute && nextRoute !== pathname) {
      router.push(nextRoute)
    }
    setStepIndex(nextIndex)
  }

  function handleEvent(data: EventData) {
    const { type, status, index, action } = data

    if (type === EVENTS.STEP_BEFORE) {
      const target = STEPS[index]?.target
      if (typeof target === "string" && target !== "body") {
        document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }

    if (type === EVENTS.STEP_AFTER) {
      const isForward = action !== ACTIONS.PREV
      navigate(isForward ? index + 1 : index - 1)
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Target didn't appear within targetWaitTimeout — skip this step
      const nextIndex = index + 1
      if (nextIndex < STEPS.length) {
        navigate(nextIndex)
      } else {
        stop()
      }
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stop()
    }
  }

  return (
    <>
      {process.env.NODE_ENV === "development" && !run && (
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY)
            setStepIndex(0)
            router.push("/dashboard/prehled")
            setRun(true)
          }}
          className="fixed right-4 bottom-4 z-50 rounded-full border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground shadow transition-colors hover:text-foreground"
        >
          Tour
        </button>
      )}
      {run && (
        <Joyride
          steps={STEPS}
          run={run}
          stepIndex={stepIndex}
          continuous
          tooltipComponent={CustomTooltip}
          onEvent={handleEvent}
          options={{
            overlayColor: "rgba(0,0,0,0.5)",
            zIndex: 10000,
            targetWaitTimeout: 8000,
          }}
        />
      )}
    </>
  )
}
