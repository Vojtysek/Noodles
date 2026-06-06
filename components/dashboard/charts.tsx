"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

/** Řádek tooltipu s vlastním formátováním hodnoty (Kč apod.). */
function tooltipRow(label: React.ReactNode, value: string, color?: string) {
  return (
    <>
      <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
      <div className="flex flex-1 items-center justify-between gap-4 leading-none">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground tabular-nums">{value}</span>
      </div>
    </>
  )
}

/** Horizontální sloupcový rozpad — podíly položek na celku. */
export function BreakdownBars({
  data,
  formatValue,
}: {
  data: { label: string; value: number }[]
  formatValue: (value: number) => string
}) {
  const rows = data.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }))
  const config = { value: { label: "Částka" } } satisfies ChartConfig

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: rows.length * 44 + 8 }}
    >
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 8 }} accessibilityLayer>
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={150}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) =>
                tooltipRow(item.payload?.label, formatValue(Number(value)), item.payload?.fill)
              }
            />
          }
        />
        <Bar dataKey="value" radius={6} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export type ComparisonSeries = {
  label: string
  color: string
  points: { year: string; value: number }[]
}

/**
 * Průsečík dvou vykreslených lomených čar (0–1 podél osy X), interpolovaný
 * mezi vzorky — značka bodu zlomu tak sedí přesně na vizuální křivce.
 */
export function seriesCrossing(a: { value: number }[], b: { value: number }[]): number | null {
  for (let i = 0; i < a.length - 1; i++) {
    const d0 = a[i].value - b[i].value
    const d1 = a[i + 1].value - b[i + 1].value
    if (d0 > 0 && d1 <= 0) {
      const frac = d0 / (d0 - d1)
      return (i + frac) / (a.length - 1)
    }
  }
  return null
}

/**
 * Index roku bodu zlomu z plných ročních kumulativních polí (0 = výchozí rok),
 * interpolovaný mezi roky. Na rozdíl od seriesCrossing pracuje s plným
 * rozlišením, takže výsledný rok nezávisí na vzorkování grafu. `withArr` je
 * scénář s rekonstrukcí (kvůli investici startuje výš), `withoutArr` bez ní.
 */
export function crossingYearIndex(
  withArr: number[],
  withoutArr: number[]
): number | null {
  const n = Math.min(withArr.length, withoutArr.length)
  for (let i = 0; i < n - 1; i++) {
    const d0 = withArr[i] - withoutArr[i]
    const d1 = withArr[i + 1] - withoutArr[i + 1]
    if (d0 > 0 && d1 <= 0) {
      const frac = d0 / (d0 - d1)
      return i + frac
    }
  }
  return null
}

/**
 * Dvouvrstvý spojnicový graf — porovnání vývoje dvou scénářů v čase
 * (např. s rekonstrukcí vs. bez ní). Obě řady sdílí stejnou osu let.
 * Najetím myší se zobrazí detail obou hodnot v daném roce.
 */
export function ComparisonLineChart({
  series,
  formatValue,
  marker,
}: {
  series: [ComparisonSeries, ComparisonSeries]
  formatValue: (value: number) => string
  /** Svislá značka, např. bod zlomu. `position` je 0–1 podél osy X. */
  marker?: { position: number; label: string } | null
}) {
  const rows = series[0].points.map((p, i) => ({
    year: Number(p.year),
    a: series[0].points[i].value,
    b: series[1].points[i].value,
  }))
  const minYear = rows[0].year
  const maxYear = rows[rows.length - 1].year
  // Číselná osa X → značka bodu zlomu leží přesně na průsečíku křivek.
  const markerYear = marker ? minYear + marker.position * (maxYear - minYear) : null

  const config = {
    a: { label: series[0].label, color: series[0].color },
    b: { label: series[1].label, color: series[1].color },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-44 w-full sm:h-52 md:h-56">
      <LineChart data={rows} margin={{ left: 8, right: 8, top: 8 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="year"
          type="number"
          domain={[minYear, maxYear]}
          ticks={rows.map((r) => r.year)}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={68}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => formatValue(v)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => `Rok ${payload?.[0]?.payload?.year ?? ""}`}
              formatter={(value, name, item) =>
                tooltipRow(
                  config[name as keyof typeof config]?.label ?? name,
                  formatValue(Number(value)),
                  item.color
                )
              }
            />
          }
        />
        {markerYear !== null && marker && (
          <ReferenceLine
            x={markerYear}
            stroke="var(--foreground)"
            strokeDasharray="4 4"
            opacity={0.35}
            label={{
              value: marker.label,
              position: "insideTopLeft",
              fontSize: 11,
              fill: "var(--muted-foreground)",
            }}
          />
        )}
        <Line
          dataKey="a"
          type="linear"
          stroke="var(--color-a)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-a)" }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
        <Line
          dataKey="b"
          type="linear"
          stroke="var(--color-b)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-b)" }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  )
}

/** Donut — čerpání rozpočtu. */
export function DonutChart({ percent, label }: { percent: number; label: string }) {
  const clamped = Math.min(Math.max(percent, 0), 100)
  const config = {
    spent: { label: "Vyčerpáno", color: "var(--chart-3)" },
    rest: { label: "Zbývá", color: "var(--muted)" },
  } satisfies ChartConfig
  const data = [
    { name: "spent", value: clamped, fill: "var(--color-spent)" },
    { name: "rest", value: 100 - clamped, fill: "var(--color-rest)" },
  ]

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
      <ChartContainer config={config} className="aspect-square h-28">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name, item) =>
                  tooltipRow(
                    config[name as keyof typeof config]?.label ?? name,
                    `${Number(value).toLocaleString("cs-CZ")} %`,
                    item.payload?.fill
                  )
                }
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={36}
            outerRadius={50}
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
            isAnimationActive={false}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground text-sm font-semibold tabular-nums"
                    >
                      {clamped.toLocaleString("cs-CZ")} %
                    </text>
                  )
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{clamped.toLocaleString("cs-CZ")} %</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/**
 * Donut zdrojů financování — segmenty (kapitál, NZÚ, komerční úvěr…) s celkovou
 * částkou uprostřed a legendou vpravo. Každý segment má vlastní barvu a v legendě
 * se zobrazí jeho částka i podíl na celku.
 */
export function FinancingDonut({
  segments,
  total,
  formatValue,
  centerLabel,
}: {
  segments: { key: string; label: string; value: number; color: string }[]
  total: number
  formatValue: (value: number) => string
  centerLabel: string // popisek pod částkou uprostřed, např. "celková investice"
}) {
  const config = segments.reduce<ChartConfig>((acc, s) => {
    acc[s.key] = { label: s.label, color: s.color }
    return acc
  }, {})
  const data = segments.map((s) => ({ ...s, fill: s.color }))

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <ChartContainer config={config} className="aspect-square h-44">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name, item) => {
                  const v = Number(value)
                  const pct = total > 0 ? Math.round((v / total) * 100) : 0
                  return tooltipRow(
                    config[name as keyof typeof config]?.label ?? name,
                    `${formatValue(v)} · ${pct} %`,
                    item.payload?.fill
                  )
                }}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius={60}
            outerRadius={85}
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
            isAnimationActive={false}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan
                        x={viewBox.cx}
                        dy="-0.3em"
                        className="fill-foreground text-base font-semibold tabular-nums"
                      >
                        {formatValue(total)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        dy="1.4em"
                        className="fill-muted-foreground text-[10px]"
                      >
                        {centerLabel}
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-1 flex-col gap-3">
        {segments.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
          return (
            <div key={s.key} className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="flex-1 text-sm">{s.label}</span>
              <span className="text-right">
                <span className="block font-medium tabular-nums">{formatValue(s.value)}</span>
                <span className="block text-xs text-muted-foreground tabular-nums">{pct} %</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
