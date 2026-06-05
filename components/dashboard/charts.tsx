import { cn } from "@/lib/utils"

const CHART_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

/** Horizontální sloupcový rozpad — podíly položek na celku. */
export function BreakdownBars({
  data,
  formatValue,
}: {
  data: { label: string; value: number }[]
  formatValue: (value: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-muted-foreground">{d.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{formatValue(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", CHART_COLORS[i % CHART_COLORS.length])}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Jednoduchý spojnicový graf (SVG) — vývoj hodnoty v čase. */
export function LineChart({
  data,
  formatValue,
}: {
  data: { year: string; value: number }[]
  formatValue: (value: number) => string
}) {
  const W = 600
  const H = 180
  const PAD = 8
  const min = Math.min(...data.map((d) => d.value))
  const max = Math.max(...data.map((d) => d.value))
  const range = max - min || 1

  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2)

  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ")
  const area = `${PAD},${H - PAD} ${points} ${W - PAD},${H - PAD}`
  const zeroY = min < 0 && max > 0 ? y(0) : null

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Vývoj hodnoty v čase">
        {zeroY !== null && (
          <line
            x1={PAD}
            x2={W - PAD}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}
        <polygon points={area} fill="var(--chart-2)" opacity="0.12" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--chart-3)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <circle key={d.year} cx={x(i)} cy={y(d.value)} r="3.5" fill="var(--chart-4)">
            <title>{`${d.year}: ${formatValue(d.value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-xs text-muted-foreground tabular-nums">
        {data.map((d) => (
          <span key={d.year}>{d.year}</span>
        ))}
      </div>
    </div>
  )
}

/** Donut — čerpání rozpočtu. */
export function DonutChart({ percent, label }: { percent: number; label: string }) {
  const R = 42
  const C = 2 * Math.PI * R
  const clamped = Math.min(Math.max(percent, 0), 100)
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="size-24 -rotate-90" role="img" aria-label={label}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="var(--chart-3)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * C} ${C}`}
        />
      </svg>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{clamped.toLocaleString("cs-CZ")} %</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
