"use client"

import { useState } from "react"
import { FileText, Presentation, Download, Loader2, Check, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { exportTypes, exportHistory, personas, projects } from "@/lib/mock-data"

export default function ExportyPage() {
  const [personaId, setPersonaId] = useState(personas[0].id)
  const [projectId, setProjectId] = useState<string>("all")
  const [generating, setGenerating] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  // Mock generování — pouze vizuální stav, žádný skutečný export.
  function generate(id: string) {
    setGenerating(id)
    setDone(null)
    setTimeout(() => {
      setGenerating(null)
      setDone(id)
      setTimeout(() => setDone((d) => (d === id ? null : d)), 2500)
    }, 1200)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Exporty</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalizované výstupy z agregovaných dat — materiály pro různé situace a publika. Zatím
          mock bez skutečného generování.
        </p>
      </div>

      {/* Context filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Kontext exportu:</span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">Všechny projekty</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Export type cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {exportTypes.map((exp) => (
          <div key={exp.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {exp.format === "PPTX" ? (
                    <Presentation className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{exp.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.format} · {exp.pages}
                  </p>
                </div>
              </div>
            </div>

            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              {exp.description}
            </p>

            {exp.needsPersona && (
              <div className="flex items-center gap-2">
                <User className="size-3.5 shrink-0 text-muted-foreground" />
                <select
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  className="h-8 flex-1 rounded-lg border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant={done === exp.id ? "secondary" : "outline"}
              onClick={() => generate(exp.id)}
              disabled={generating !== null}
              className="w-full"
            >
              {generating === exp.id ? (
                <Loader2 className="animate-spin" />
              ) : done === exp.id ? (
                <Check />
              ) : (
                <Download />
              )}
              {generating === exp.id
                ? "Generuji…"
                : done === exp.id
                  ? "Připraveno (mock)"
                  : "Vygenerovat"}
            </Button>
          </div>
        ))}
      </div>

      {/* Export history */}
      <div>
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Poslední exporty
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Název</th>
                <th className="px-4 py-2.5 font-medium">Typ</th>
                <th className="px-4 py-2.5 font-medium">Projekt</th>
                <th className="px-4 py-2.5 font-medium">Vytvořeno</th>
                <th className="px-4 py-2.5 text-right font-medium">Velikost</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {exportHistory.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {row.format === "PPTX" ? (
                        <Presentation className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="font-medium">{row.name}</span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          row.format === "PPTX"
                            ? "bg-chart-1/20 text-chart-3"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {row.format}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.project}</td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                    {new Date(row.createdAt).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                    {row.size}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button variant="ghost" size="icon-sm" aria-label={`Stáhnout ${row.name}`}>
                      <Download />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
