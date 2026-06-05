import { Flag } from "lucide-react"

import { cn } from "@/lib/utils"

export type RoadmapItem = {
  title: string
  /** Kdy etapa začíná, např. „od ledna 2026". */
  period: string
  /** Délka lidskou řečí, např. „5 měsíců". */
  duration: string
  /** Cena etapy, např. „3,2 mil. Kč". */
  cost: string
  /** Délka v měsících — určuje šířku etapy na časové ose. */
  months: number
}

/**
 * Jednoduchá časová osa scénáře — linka zleva doprava, jedna zastávka na etapu,
 * vlajka na konci. Šířka etap odpovídá jejich délce. Na mobilu se osa otáčí
 * do svislé podoby.
 */
export function Roadmap({ items, finishLabel }: { items: RoadmapItem[]; finishLabel: string }) {
  return (
    <>
      {/* Vodorovná osa (od sm výš) */}
      <div className="hidden sm:flex">
        {items.map((item, i) => (
          <div
            key={item.title}
            className="flex min-w-0 flex-col"
            style={{ flexGrow: item.months, flexBasis: 0 }}
          >
            <div className="flex items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-semibold text-primary",
                  i === 0 && "bg-primary text-primary-foreground"
                )}
              >
                {i + 1}
              </span>
              <span className="h-0.5 flex-1 bg-border" />
            </div>
            <div className="mt-2.5 pr-4">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.period} · {item.duration}
              </p>
              <p className="mt-0.5 text-xs font-medium tabular-nums">{item.cost}</p>
            </div>
          </div>
        ))}
        <div className="flex shrink-0 flex-col">
          <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-primary-foreground dark:bg-emerald-500">
            <Flag className="size-3.5" />
          </span>
          <div className="mt-2.5">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Hotovo</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{finishLabel}</p>
          </div>
        </div>
      </div>

      {/* Svislá osa (mobil) */}
      <div className="flex flex-col sm:hidden">
        {items.map((item, i) => (
          <div key={item.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-semibold text-primary",
                  i === 0 && "bg-primary text-primary-foreground"
                )}
              >
                {i + 1}
              </span>
              <span className="w-0.5 flex-1 bg-border" />
            </div>
            <div className="pb-5">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.period} · {item.duration}
              </p>
              <p className="mt-0.5 text-xs font-medium tabular-nums">{item.cost}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-primary-foreground dark:bg-emerald-500">
            <Flag className="size-3.5" />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Hotovo</p>
            <p className="text-xs text-muted-foreground">{finishLabel}</p>
          </div>
        </div>
      </div>
    </>
  )
}
