"use client"

import type { SceneState } from "./building-scene"

const BRAND = "#5b56e0"

function num(value: number | undefined | null, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  const v = num(value, min)
  return Math.min(max, Math.max(min, v))
}

function gradeColor(grade: string | null): string {
  if (!grade) return "#94a3b8"
  const g = grade.trim().toUpperCase()
  if (g.startsWith("A") || g === "B") return "#10b981"
  if (g === "C" || g === "D") return "#f59e0b"
  if (g === "E" || g === "F" || g === "G") return "#ef4444"
  return "#94a3b8"
}

export default function BuildingSceneFallback({
  state,
  className,
}: {
  state: SceneState
  className?: string
}) {
  const storeys = clamp(Math.round(num(state.floors, 3)), 2, 14)
  const accent = gradeColor(state.energyGrade)
  const letter = state.energyGrade
    ? state.energyGrade.trim().toUpperCase().charAt(0) || "?"
    : "?"

  const storeyHeight = 22
  const buildingWidth = 96
  const buildingHeight = storeys * storeyHeight
  const padTop = 56
  const padBottom = 40
  const vbHeight = buildingHeight + padTop + padBottom
  const vbWidth = 220
  const baseX = (vbWidth - buildingWidth) / 2
  const baseY = padTop

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      >
        <defs>
          <linearGradient id="bsf-facade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4f5fa" />
            <stop offset="100%" stopColor="#dfe2ee" />
          </linearGradient>
          <linearGradient id="bsf-accent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity="0.9" />
            <stop offset="100%" stopColor={BRAND} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* ground halo */}
        <ellipse
          cx={vbWidth / 2}
          cy={baseY + buildingHeight + 14}
          rx={buildingWidth / 2 + 26}
          ry={12}
          fill={accent}
          opacity={0.28}
        />

        {/* roof cap */}
        <rect
          x={baseX - 5}
          y={baseY - 8}
          width={buildingWidth + 10}
          height={9}
          rx={3}
          fill="url(#bsf-accent)"
        />

        {/* building body */}
        <rect
          x={baseX}
          y={baseY}
          width={buildingWidth}
          height={buildingHeight}
          rx={6}
          fill="url(#bsf-facade)"
          stroke={accent}
          strokeWidth={1.5}
        />

        {/* storey windows */}
        {Array.from({ length: storeys }).map((_, s) => {
          const rowY = baseY + s * storeyHeight + 6
          return (
            <g key={s}>
              {[0, 1, 2].map((c) => (
                <rect
                  key={c}
                  x={baseX + 12 + c * 26}
                  y={rowY}
                  width={16}
                  height={11}
                  rx={2}
                  fill={BRAND}
                  opacity={0.32}
                />
              ))}
            </g>
          )
        })}

        {/* grade badge */}
        <g>
          <rect
            x={vbWidth - 46}
            y={10}
            width={34}
            height={34}
            rx={9}
            fill={accent}
          />
          <text
            x={vbWidth - 29}
            y={28}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="20"
            fontWeight="700"
            fill="#ffffff"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {letter}
          </text>
        </g>
      </svg>

      <span
        className="text-muted-foreground"
        style={{
          position: "absolute",
          bottom: 6,
          fontSize: 11,
          letterSpacing: "0.04em",
        }}
      >
        {storeys} podlaží
      </span>
    </div>
  )
}
