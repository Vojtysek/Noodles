"use client"

import {
  HeartPulse,
  Leaf,
  PlugZap,
  Shield,
  Sparkles,
  Thermometer,
  TrendingUp,
  VolumeX,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  BENEFIT_CATEGORIES,
  type BenefitCategory,
  type NonFinancialBenefit,
} from "@/lib/benefits"

const CATEGORY_ICON: Record<BenefitCategory, LucideIcon> = {
  komfort: Thermometer,
  zdravi: HeartPulse,
  prostredi: Leaf,
  hodnota: TrendingUp,
  bezpecnost: Shield,
  hluk: VolumeX,
  nezavislost: PlugZap,
}

const CATEGORY_ACCENT: Record<BenefitCategory, string> = {
  komfort: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  zdravi: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  prostredi: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  hodnota: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  bezpecnost: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  hluk: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  nezavislost: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

/**
 * Nefinanční přínosy vybraného plánu — proč do renovace jít i mimo úspory.
 * Zobrazí nejsilnější přínosy jako přehledné karty.
 */
export function LifeQuality({
  benefits,
  limit = 3,
}: {
  benefits: NonFinancialBenefit[]
  limit?: number
}) {
  if (benefits.length === 0) return null
  const shown = benefits.slice(0, limit)

  return (
    <section>
      <div className="mb-1.5 flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h2 className="text-base font-semibold">Zlepšíme kvalitu vašeho života</h2>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Renovace se nevyplatí jen finančně — tohle pocítíte v domě každý den.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {shown.map((b) => {
          const Icon = CATEGORY_ICON[b.category]
          return (
            <article
              key={b.id}
              className="flex flex-col rounded-2xl border bg-background/60 p-5 backdrop-blur-sm transition-colors hover:border-foreground/15"
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  CATEGORY_ACCENT[b.category]
                )}
              >
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3.5 text-base font-semibold">{b.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {b.description}
              </p>
              <p className="mt-3 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                {BENEFIT_CATEGORIES[b.category].label}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
