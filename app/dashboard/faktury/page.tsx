"use client"

import { useEffect, useRef, useState } from "react"
import {
  Receipt,
  FileUp,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Trash2,
  Eye,
  X,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type ExtractedData = {
  dodavatel?: string
  druh?: string
  obdobi?: string
  castka?: string
  splatnost?: string
  cislo_faktury?: string
  polozky?: string[]
}

type InvoiceRow = {
  id: string
  file_name: string
  mime_type: string
  size_bytes: number
  summary: string | null
  extracted: ExtractedData | null
  summary_generated_at: string | null
  created_at: string
}

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]
const MAX_SIZE = 10 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FakturyPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [summarizingId, setSummarizingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ url: string; mime: string } | null>(
    null
  )

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      supabase
        .from("invoices")
        .select(
          "id, file_name, mime_type, size_bytes, summary, extracted, summary_generated_at, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setInvoices((data ?? []) as InvoiceRow[])
          setLoading(false)
        })
    })
  }, [tick])

  // Lock body scroll + Escape-to-close while the viewer modal is open.
  useEffect(() => {
    if (!viewer) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [viewer])

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return

    const valid: File[] = []
    for (const file of list) {
      if (!ALLOWED_MIME.includes(file.type)) {
        alert(
          `Soubor „${file.name}" má nepodporovaný formát. Povolené jsou PDF, JPG, PNG nebo WEBP.`
        )
        continue
      }
      if (file.size > MAX_SIZE) {
        alert(`Soubor „${file.name}" je příliš velký. Maximum je 10 MB.`)
        continue
      }
      valid.push(file)
    }

    if (valid.length === 0) return

    setUploading(true)
    for (const file of valid) {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/invoices", { method: "POST", body: form })
      if (!res.ok) {
        let error: string | undefined
        try {
          const body = await res.json()
          error = body?.error
        } catch {
          /* ignore parse errors */
        }
        alert(`Nahrání selhalo: ${error ?? res.status}`)
      }
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
    setTick((t) => t + 1)
  }

  async function openViewer(inv: InvoiceRow) {
    const res = await fetch(`/api/invoices/${inv.id}/view`)
    if (res.ok) {
      const { url } = await res.json()
      setViewer({ url, mime: inv.mime_type })
    } else {
      alert("Náhled se nepodařilo otevřít. Zkuste to prosím znovu.")
    }
  }

  async function summarize(id: string) {
    setSummarizingId(id)
    try {
      const res = await fetch(`/api/invoices/${id}/summarize`, {
        method: "POST",
      })
      if (res.ok) {
        const { summary, extracted } = (await res.json()) as {
          summary: string
          extracted: ExtractedData | null
        }
        const now = new Date().toISOString()
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, summary, extracted, summary_generated_at: now }
              : i
          )
        )
        setExpandedId(id)
      } else {
        let error: string | undefined
        try {
          const body = await res.json()
          error = body?.error
        } catch {
          /* ignore parse errors */
        }
        alert(error ?? "Shrnutí se nepodařilo vygenerovat.")
      }
    } finally {
      setSummarizingId(null)
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Opravdu smazat tuto fakturu?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i.id !== id))
      } else {
        alert("Smazání selhalo. Zkuste to prosím znovu.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-primary/8 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 -right-40 -z-10 size-96 rounded-full bg-emerald-500/8 blur-[120px]"
        />
        {/* Header */}
        <div>
          <div className="h-2.5 w-36 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-8 w-28 animate-pulse rounded bg-muted" />
          <div className="mt-1.5 h-3 w-96 animate-pulse rounded bg-muted" />
        </div>
        {/* Dropzone skeleton */}
        <div className="h-40 w-full animate-pulse rounded-2xl border bg-muted/40" />
        {/* List skeleton */}
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-40 -z-10 size-96 rounded-full bg-primary/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -right-40 -z-10 size-96 rounded-full bg-emerald-500/8 blur-[120px]"
      />

      {/* Header */}
      <div
        className="anim-in"
        style={{ "--ai-y": "-20px", "--ai-dur": "0.6s" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-7 bg-primary/60" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            Energie a náklady
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Faktury
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Nahrajte faktury SVJ (energie, služby, dodávky). Soubory vidíte jen
          vy — jsou vázané na váš dům.
        </p>
      </div>

      {/* Dropzone */}
      <div
        className="anim-in rounded-2xl border bg-background/60 p-4 backdrop-blur-sm"
        style={
          {
            "--ai-y": "28px",
            "--ai-dur": "0.6s",
            "--ai-delay": "0.15s",
          } as React.CSSProperties
        }
      >
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (!uploading) uploadFiles(e.dataTransfer.files)
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors sm:px-6 sm:py-10",
            dragOver
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border-border hover:bg-muted/40",
            uploading && "pointer-events-none opacity-70"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files)
            }}
          />
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm font-medium">Nahrávám…</p>
            </>
          ) : (
            <>
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FileUp className="size-5" />
              </div>
              <p className="text-sm font-medium">
                Přetáhněte faktury sem nebo klikněte pro výběr
              </p>
              <p className="text-xs text-muted-foreground">
                PDF nebo obrázek (JPG, PNG, WEBP), max 10 MB
              </p>
            </>
          )}
        </label>
      </div>

      {/* Invoice list */}
      <div
        className="anim-in"
        style={
          {
            "--ai-y": "28px",
            "--ai-dur": "0.6s",
            "--ai-delay": "0.23s",
          } as React.CSSProperties
        }
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Nahrané faktury
          </p>
        </div>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-background/60 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Receipt className="size-5" />
            </div>
            <p className="text-sm font-medium">
              Zatím jste nenahráli žádné faktury
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Nahrajte první fakturu výše a budete ji mít po ruce.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {invoices.map((inv) => {
              const isImage = inv.mime_type.startsWith("image/")
              const Icon = isImage ? ImageIcon : FileText
              const hasDetail = Boolean(inv.summary || inv.extracted)
              const expanded = expandedId === inv.id
              return (
                <div key={inv.id}>
                  <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-4 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {inv.file_name}
                      </p>
                      <p className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        {formatBytes(inv.size_bytes)} ·{" "}
                        {new Date(inv.created_at).toLocaleDateString("cs-CZ")}
                        {inv.summary_generated_at && (
                          <span className="flex items-center gap-1 text-primary">
                            <span className="text-muted-foreground/50">·</span>
                            <Sparkles className="size-3" />
                            shrnuto
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => openViewer(inv)}
                      title="Zobrazit"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => summarize(inv.id)}
                      disabled={summarizingId === inv.id}
                      title="Shrnout obsah"
                    >
                      {summarizingId === inv.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => remove(inv.id)}
                      disabled={deletingId === inv.id}
                      title="Smazat"
                    >
                      {deletingId === inv.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                    {hasDetail && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() =>
                          setExpandedId(expanded ? null : inv.id)
                        }
                        title="Rozbalit shrnutí"
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform",
                            expanded && "rotate-180"
                          )}
                        />
                      </Button>
                    )}
                  </div>

                  {expanded && hasDetail && (
                    <div className="mt-1 rounded-xl bg-muted/50 p-4">
                      {inv.extracted && (
                        <div className="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2 sm:gap-x-6">
                          {(
                            [
                              ["Dodavatel", inv.extracted.dodavatel],
                              ["Druh", inv.extracted.druh],
                              ["Období", inv.extracted.obdobi],
                              ["Částka", inv.extracted.castka],
                              ["Splatnost", inv.extracted.splatnost],
                              ["Č. faktury", inv.extracted.cislo_faktury],
                            ] as const
                          ).map(([label, value]) => {
                            if (!value) return null
                            const muted =
                              value.toLowerCase() === "neuvedeno"
                            return (
                              <div
                                key={label}
                                className="flex items-baseline gap-2 text-sm"
                              >
                                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                                  {label}:
                                </span>
                                <span
                                  className={cn(
                                    "min-w-0 break-words",
                                    muted
                                      ? "text-muted-foreground/60 italic"
                                      : "font-medium"
                                  )}
                                >
                                  {value}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {inv.extracted?.polozky &&
                        inv.extracted.polozky.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {inv.extracted.polozky.map((item, i) => (
                              <span
                                key={i}
                                className="rounded-full border bg-background/70 px-2.5 py-1 text-xs text-foreground"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}

                      {inv.summary && (
                        <p className="mt-3 whitespace-pre-wrap text-sm">
                          {inv.summary}
                        </p>
                      )}

                      {inv.summary_generated_at && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Shrnuto{" "}
                          {new Date(
                            inv.summary_generated_at
                          ).toLocaleDateString("cs-CZ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* File viewer modal */}
      {viewer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="truncate text-sm font-medium">Náhled faktury</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewer(null)}
              title="Zavřít"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {viewer.mime === "application/pdf" ? (
              <iframe
                src={viewer.url}
                className="h-full w-full rounded-lg"
                title="Náhled faktury"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewer.url}
                alt="Náhled faktury"
                className="mx-auto max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
