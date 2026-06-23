"use client"

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { createClient } from "@/lib/supabase/client"
import { userScenarios } from "@/lib/scenarios"
import {
  NON_FINANCIAL_BENEFITS,
  selectBenefits,
  type NonFinancialBenefit,
} from "@/lib/benefits"
import { fetchNonFinancialBenefits } from "@/lib/benefits-db"
import {
  FINISH_INDEX,
  WIZARD_STEPS,
  type PhaseId,
} from "@/lib/pruvodce/steps"

import { PhaseStepper } from "@/components/dashboard/pruvodce/phase-stepper"
import { ActiveStepCard } from "@/components/dashboard/pruvodce/active-step-card"
import { PlanTimeline } from "@/components/dashboard/pruvodce/plan-timeline"
import { LifeQuality } from "@/components/dashboard/pruvodce/life-quality"
import { PartnerServices } from "@/components/dashboard/pruvodce/partner-services"
import { ArticlesSection } from "@/components/dashboard/pruvodce/articles-section"
import { FinancingLeadModal } from "@/components/dashboard/pruvodce/financing-lead-modal"
import { ScenarioSplash } from "@/components/dashboard/scenario-splash"
import { addInvite, submitFinancingLead } from "./actions"

type BuildingCalc = {
  id: string
  address: string | null
  units: number | null
  total_cost: number | null
  selected_renovations: string[] | null
}

export default function PruvodcePage() {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState<BuildingCalc | null>(null)
  const [benefits, setBenefits] = useState<NonFinancialBenefit[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [splashOpen, setSplashOpen] = useState(false)
  const [financingOpen, setFinancingOpen] = useState(false)

  const storageKey = `pruvodce-step-${building?.id ?? "default"}`

  // ── Load building + benefits ──────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const catalog = await fetchNonFinancialBenefits(supabase).catch(
          () => NON_FINANCIAL_BENEFITS
        )
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from("buildings")
            .select("id, address, units, total_cost, selected_renovations")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
          if (data) {
            const b = data as BuildingCalc
            setBuilding(b)
            const scenario = userScenarios(b.selected_renovations ?? [])[0]
            if (scenario) {
              setBenefits(selectBenefits(catalog, scenario.projectIds))
            }
          }
        }
      } catch {
        // ticho — průvodce funguje i bez uloženého plánu
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ── Restore progress + onboarding splash once building id is known ────────
  useEffect(() => {
    if (loading) return
    let restored: number | null = null
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw !== null) {
        const idx = parseInt(raw, 10)
        if (!isNaN(idx) && idx >= 0 && idx < WIZARD_STEPS.length) restored = idx
      }
    } catch {}
    const fromOnboarding =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("from") === "onboarding"
    // External (localStorage / URL) → React: batch in a transition.
    startTransition(() => {
      if (restored !== null) setCurrentStep(restored)
      if (fromOnboarding) setSplashOpen(true)
    })
  }, [loading, storageKey])

  const persist = useCallback(
    (idx: number) => {
      try {
        localStorage.setItem(storageKey, String(idx))
      } catch {}
    },
    [storageKey]
  )

  const markDone = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, FINISH_INDEX)
      persist(next)
      return next
    })
  }, [persist])

  const selectStep = useCallback(
    (idx: number) => {
      setCurrentStep(idx)
      persist(idx)
    },
    [persist]
  )

  const reset = useCallback(() => {
    setCurrentStep(0)
    try {
      localStorage.removeItem(storageKey)
    } catch {}
  }, [storageKey])

  const selectPhase = useCallback(
    (phase: PhaseId) => {
      const idx = WIZARD_STEPS.findIndex((s) => s.phase === phase)
      if (idx >= 0) selectStep(idx)
    },
    [selectStep]
  )

  const clearOnboardingParam = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("from") === "onboarding"
    ) {
      router.replace("/dashboard/pruvodce")
    }
  }, [router])

  // ── Entrance reveal ───────────────────────────────────────────────────────
  useGSAP(
    () => {
      if (loading) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from("[data-reveal]", {
        y: 24,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.09,
      })
    },
    { scope: rootRef, dependencies: [loading] }
  )

  const step = WIZARD_STEPS[currentStep]

  if (loading) return <PruvodceSkeleton />

  return (
    <div ref={rootRef} className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-[28rem] rounded-full bg-primary/10 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -right-40 -z-10 size-[28rem] rounded-full bg-blue-500/10 blur-[130px]"
      />

      {splashOpen && (
        <ScenarioSplash
          onClose={() => {
            setSplashOpen(false)
            clearOnboardingParam()
          }}
          onContinue={() => {
            setSplashOpen(false)
            clearOnboardingParam()
          }}
          buildingData={
            building
              ? {
                  selected_renovations: building.selected_renovations ?? [],
                  total_cost: building.total_cost ?? 0,
                  address: building.address,
                }
              : undefined
          }
        />
      )}

      {/* Phase stepper */}
      <div data-reveal className="pt-1">
        <PhaseStepper currentIndex={currentStep} onSelectPhase={selectPhase} />
      </div>

      {/* Active step hero */}
      <div data-reveal>
        <ActiveStepCard
          step={step}
          index={currentStep}
          onOpenFinancing={() => setFinancingOpen(true)}
        />
      </div>

      {/* Plan — full width */}
      <div data-reveal>
        <PlanTimeline
          currentIndex={currentStep}
          onMarkDone={markDone}
          onSelectStep={selectStep}
          onReset={reset}
        />
      </div>

      {/* Life quality — full-width band, why it pays off beyond money */}
      {benefits.length > 0 && (
        <div data-reveal>
          <LifeQuality benefits={benefits} />
        </div>
      )}

      {/* Partner services */}
      <div data-reveal>
        <PartnerServices onOpenFinancing={() => setFinancingOpen(true)} />
      </div>

      {/* Articles */}
      <div data-reveal>
        <ArticlesSection />
      </div>

      {/* Invite */}
      <div
        data-reveal
        className="rounded-2xl border bg-background/60 p-5 backdrop-blur-sm"
      >
        <p className="text-sm font-medium">Pozvat do projektu</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Zadejte e-mail — pozvaný uživatel uvidí tento plán po registraci.
        </p>
        <InviteForm />
      </div>

      <FinancingLeadModal
        open={financingOpen}
        onClose={() => setFinancingOpen(false)}
        building={
          building
            ? {
                address: building.address,
                units: building.units,
                totalCost: building.total_cost,
              }
            : null
        }
        action={submitFinancingLead}
      />
    </div>
  )
}

function InviteForm() {
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => addInvite(formData),
    null
  )

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <input
        name="email"
        type="email"
        required
        placeholder="email@example.cz"
        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-auto sm:flex-1"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {pending ? "..." : "Pozvat"}
      </button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Pozvánka přidána
        </p>
      )}
    </form>
  )
}

function PruvodceSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="mx-auto h-12 w-full max-w-xl animate-pulse rounded-full bg-muted/50" />
      <div className="h-64 w-full animate-pulse rounded-3xl bg-muted/50" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-3xl bg-muted/40" />
        <div className="h-80 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    </div>
  )
}
