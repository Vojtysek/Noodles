"use client"

import { useActionState, useEffect } from "react"
import { ArrowUpRight, CheckCircle2, Landmark, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { fmtCzk } from "@/lib/mock-data"
import { CSAS_LOANS_URL } from "@/lib/pruvodce/partners"

export type FinancingLeadResult = { error?: string; success?: boolean }

export type BuildingContext = {
  address: string | null
  units: number | null
  totalCost: number | null
}

/**
 * Lead formulář pro financování přes partnerskou banku — hlavní byznysový
 * funnel. Předvyplní známé údaje o domě a odešle nezávaznou poptávku.
 */
export function FinancingLeadModal({
  open,
  onClose,
  building,
  action,
}: {
  open: boolean
  onClose: () => void
  building: BuildingContext | null
  action: (
    prev: FinancingLeadResult | null,
    formData: FormData
  ) => Promise<FinancingLeadResult>
}) {
  const [state, formAction, pending] = useActionState(action, null)

  // ESC zavírá, zamkne scroll pozadí.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="financing-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-in bg-black/50 backdrop-blur-sm duration-200 fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[92svh] w-full max-w-lg animate-in flex-col overflow-hidden rounded-t-3xl border bg-card shadow-2xl duration-300 fade-in zoom-in-95 slide-in-from-bottom-4 sm:rounded-3xl sm:slide-in-from-bottom-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Zavřít"
          className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8">
          {state?.success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-7" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">Děkujeme!</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Vaši poptávku jsme přijali. Specialista na financování vás
                kontaktuje s nezávaznou nabídkou pro vaše SVJ.
              </p>
              <Button onClick={onClose} className="mt-6 rounded-full px-6">
                Zavřít
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Landmark className="size-5" />
                </span>
                <div>
                  <h2 id="financing-title" className="text-lg font-semibold">
                    Financování přes Českou spořitelnu
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Nezávazně a zdarma — dotace formou bezúročného úvěru.
                  </p>
                </div>
              </div>

              {building && (building.units || building.totalCost || building.address) && (
                <div className="mt-5 rounded-2xl border bg-muted/40 p-4">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Údaje o vašem domě
                  </p>
                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                    {building.address && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Adresa</dt>
                        <dd className="font-medium">{building.address}</dd>
                      </div>
                    )}
                    {building.units ? (
                      <div>
                        <dt className="text-xs text-muted-foreground">Jednotek</dt>
                        <dd className="font-medium tabular-nums">{building.units}</dd>
                      </div>
                    ) : null}
                    {building.totalCost ? (
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Odhad nákladů
                        </dt>
                        <dd className="font-medium tabular-nums">
                          {fmtCzk(building.totalCost)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              )}

              <form action={formAction} className="mt-5 flex flex-col gap-3.5">
                <input
                  type="hidden"
                  name="units"
                  value={building?.units ?? ""}
                />
                <input
                  type="hidden"
                  name="total_cost"
                  value={building?.totalCost ?? ""}
                />
                <input
                  type="hidden"
                  name="address"
                  value={building?.address ?? ""}
                />

                <Field label="Jméno a příjmení" htmlFor="lead-name">
                  <input
                    id="lead-name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Jan Novák"
                    className={inputClass}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="E-mail" htmlFor="lead-email">
                    <input
                      id="lead-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="jan@example.cz"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Telefon" htmlFor="lead-phone">
                    <input
                      id="lead-phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="+420 777 123 456"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Poznámka (volitelné)" htmlFor="lead-note">
                  <textarea
                    id="lead-note"
                    name="note"
                    rows={2}
                    placeholder="Cokoli, co bychom měli vědět…"
                    className={`${inputClass} h-auto min-h-16 resize-none py-2`}
                  />
                </Field>

                <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    className="mt-0.5 size-4 rounded border-border accent-primary"
                  />
                  <span>
                    Souhlasím, aby mě partner kontaktoval s nabídkou financování.
                    Údaje slouží jen k tomuto účelu.
                  </span>
                </label>

                {state?.error && (
                  <p className="text-sm text-destructive">{state.error}</p>
                )}

                <Button
                  type="submit"
                  disabled={pending}
                  size="lg"
                  className="mt-1 h-12 rounded-full text-sm font-semibold shadow-lg shadow-primary/20"
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {pending ? "Odesílám…" : "Odeslat nezávaznou poptávku"}
                </Button>

                <a
                  href={CSAS_LOANS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mx-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Více o úvěrech pro SVJ u České spořitelny
                  <ArrowUpRight className="size-3.5" />
                </a>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
