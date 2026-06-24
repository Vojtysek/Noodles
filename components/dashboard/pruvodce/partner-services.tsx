"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, LifeBuoy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PARTNER_LIST, PARTNER_ACCENT } from "@/lib/pruvodce/partners"

/**
 * Pomocníci na cestě — banka a doplňkové poradenské služby. Pojaté jako
 * nápověda, ne reklama: každá služba řeší konkrétní krok procesu. Banka
 * (financování) je hlavní a otevírá lead formulář přímo v aplikaci.
 */
export function PartnerServices({
  onOpenFinancing,
}: {
  onOpenFinancing: () => void
}) {
  return (
    <section id="pomocnici" className="scroll-mt-24">
      <div className="mb-5 border-t border-border/60 pt-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LifeBuoy className="size-5" />
          </span>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Pomocníci na cestě
          </h2>
        </div>
      </div>
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        Nemusíte na nic sami. Ke každému kroku vám rádi doporučíme prověřené
        partnery, kteří proces zrychlí a sejmou z vás starosti.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PARTNER_LIST.map((partner) => {
          const accent = PARTNER_ACCENT[partner.accent]
          const Icon = partner.icon
          const isBank = partner.id === "bank"
          return (
            <article
              key={partner.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-background/60 p-5 backdrop-blur-sm transition-colors",
                isBank
                  ? "border-primary/25 bg-primary/[0.03] sm:col-span-2"
                  : accent.ring
              )}
            >
              <div className="flex items-start gap-3.5">
                {isBank ? (
                  <span className="block size-12 shrink-0 overflow-hidden rounded-xl border">
                    <Image
                      src="/sporitelna-logo-small.jpg"
                      alt="Česká spořitelna"
                      width={48}
                      height={48}
                      className="size-full object-cover"
                    />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      accent.iconWrap
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{partner.name}</h3>
                    {isBank && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                        Hlavní partner
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {partner.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex">
                {partner.modal === "financing" ? (
                  <Button
                    onClick={onOpenFinancing}
                    size="sm"
                    className="group h-9 gap-1.5 rounded-full px-4 text-xs font-semibold"
                  >
                    {partner.cta}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="group h-9 gap-1.5 rounded-full px-4 text-xs font-medium"
                  >
                    <Link href={partner.href ?? "#"}>
                      {partner.cta}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
