# Export History (Poslední exporty) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After generating a PDF export, upload it to Supabase Storage and persist a record so users can re-download past exports from the "Poslední exporty" section.

**Architecture:** The API route generates the PDF, uploads the buffer to a private Supabase Storage bucket at `{user_id}/{export_id}.pdf`, inserts a metadata row into the `exports` table, then still streams the PDF back to the client for the immediate download. A separate `GET /api/exports/[id]/download` route generates a short-lived signed URL and returns it as JSON; the client uses it to trigger a re-download. The `ExportyPage` fetches the user's export history from Supabase and refreshes it after every successful generate.

**Tech Stack:** Next.js App Router, Supabase (Postgres + Storage), `@supabase/ssr`, TypeScript

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260606140000_create_exports_table.sql` | Create | `exports` table, Storage bucket, RLS policies |
| `app/api/exports/route.ts` | Modify | Upload PDF to Storage + insert DB record after generation |
| `app/api/exports/[id]/download/route.ts` | Create | Return signed URL for re-download |
| `app/dashboard/exporty/page.tsx` | Modify | Fetch + display history list, trigger refresh after generate |

---

## Task 1: Migration — `exports` table + Storage bucket

**Files:**
- Create: `supabase/migrations/20260606140000_create_exports_table.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260606140000_create_exports_table.sql

-- Create exports table
CREATE TABLE exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  format      TEXT NOT NULL DEFAULT 'PDF',
  project     TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own exports"
  ON exports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exports"
  ON exports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own folder
CREATE POLICY "Users can upload own exports"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own exports"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own exports"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db push
# or if using local dev:
npx supabase migration up
```

Expected: no errors; `exports` table and `exports` storage bucket exist in the Supabase dashboard.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260606140000_create_exports_table.sql
git commit -m "feat: add exports table and storage bucket migration"
```

---

## Task 2: Download route — `GET /api/exports/[id]/download`

**Files:**
- Create: `app/api/exports/[id]/download/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// app/api/exports/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: record } = await supabase
    .from('exports')
    .select('storage_path, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabase.storage
    .from('exports')
    .createSignedUrl(record.storage_path, 300, {
      download: `${record.name}.pdf`,
    })

  if (error || !data) {
    console.error('[exports/download] Signed URL error:', error)
    return NextResponse.json({ error: 'Storage error' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
```

- [ ] **Step 2: Verify the file builds**

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add app/api/exports/[id]/download/route.ts
git commit -m "feat: add export download route (signed URL)"
```

---

## Task 3: Save to Storage + DB in the export API route

**Files:**
- Modify: `app/api/exports/route.ts`

- [ ] **Step 1: Replace the file contents**

Full replacement of `app/api/exports/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { compileData } from './utils/data-compiler'
import { generateInsights } from './utils/openai-insights'
import { generatePDF } from '@/lib/pdf-generator'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const VALID_EXPORT_TYPES = ['overall-brief', 'persona', 'overall-detail', 'presentation'] as const
type ExportType = (typeof VALID_EXPORT_TYPES)[number]

const TYPE_LABELS: Record<ExportType, string> = {
  'overall-brief': 'Stručný přehled',
  'overall-detail': 'Detailní report',
  presentation: 'Prezentace',
  persona: 'Personalizovaný export',
}

function isValidExportType(value: string): value is ExportType {
  return VALID_EXPORT_TYPES.includes(value as ExportType)
}

function buildExportName(exportType: ExportType, personaName?: string): string {
  const base = TYPE_LABELS[exportType]
  if (exportType === 'persona' && personaName) {
    return `${base} — ${personaName}`
  }
  return base
}

/**
 * POST /api/exports
 *
 * Body: { exportType, personaId?, scenarioId? }
 *
 * Workflow:
 *   1. compileData      — gather projects, scenario, persona from mock-data + Supabase
 *   2. generateInsights — OpenAI persuasion arguments (persona exports only)
 *   3. generatePDF      — PDFKit programmatic rendering
 *   4. Upload to Supabase Storage + insert DB record (non-fatal if it fails)
 *   5. Stream PDF       — attachment response
 */
export async function POST(request: NextRequest) {
  let body: { exportType?: string; personaId?: string; scenarioId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { exportType, personaId, scenarioId } = body

  if (!exportType) {
    return NextResponse.json({ error: 'Missing exportType' }, { status: 400 })
  }

  if (!isValidExportType(exportType)) {
    return NextResponse.json(
      { error: `Invalid exportType. Must be one of: ${VALID_EXPORT_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  if (exportType === 'persona' && !personaId) {
    return NextResponse.json({ error: 'personaId is required for persona export' }, { status: 400 })
  }

  try {
    // Step 1: Compile data
    const context = await compileData(exportType, personaId, scenarioId)

    // Step 2: OpenAI insights for persona exports
    if (exportType === 'persona' && context.persona) {
      try {
        const insights = await generateInsights(context.persona, {
          id: context.scenarioId,
          name: context.scenarioName,
          tagline: context.scenarioTagline,
          tone: 'emerald',
          projectIds: context.projects.map((p) => p.id as any),
        })
        context.personaArguments = insights.personaArguments
        context.counterpoints = insights.counterpoints
      } catch (err) {
        console.error('[exports] OpenAI insights failed, continuing without:', err)
      }
    }

    // Step 3: Generate PDF
    const pdfBuffer = await generatePDF(exportType, context)

    // Step 4: Persist to Supabase (non-fatal)
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const exportId = crypto.randomUUID()
        const storagePath = `${user.id}/${exportId}.pdf`

        const { error: uploadError } = await supabase.storage
          .from('exports')
          .upload(storagePath, new Blob([pdfBuffer], { type: 'application/pdf' }), {
            contentType: 'application/pdf',
          })

        if (uploadError) {
          console.error('[exports] Storage upload failed:', uploadError)
        } else {
          const personaName = context.persona?.name
          await supabase.from('exports').insert({
            id: exportId,
            user_id: user.id,
            name: buildExportName(exportType, personaName),
            type: TYPE_LABELS[exportType],
            format: 'PDF',
            project: context.scenarioName || 'Celkový přehled',
            storage_path: storagePath,
            size_bytes: pdfBuffer.length,
          })
        }
      }
    } catch (err) {
      console.error('[exports] Persistence failed, continuing:', err)
    }

    // Step 5: Return as downloadable PDF
    const filename = `${exportType}-${new Date().toISOString().slice(0, 10)}.pdf`
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[exports] PDF generation error:', error)
    const name = error instanceof Error ? error.constructor.name : ''
    if (name === 'AuthError' || name === 'APIError') {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify builds**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/exports/route.ts
git commit -m "feat: save export PDF to Supabase Storage and persist history record"
```

---

## Task 4: Display export history in the page

**Files:**
- Modify: `app/dashboard/exporty/page.tsx`

The changes are:
1. Add `ExportRow` type and `formatBytes` helper above the component
2. Add `exportHistory` and `historyTick` state
3. Add `useEffect` to fetch history
4. After successful generate, increment `historyTick`
5. Replace the empty-state `<div>` (lines 644–653) with a conditional list

- [ ] **Step 1: Add `ExportRow` type and `formatBytes` — insert after the existing imports, before `const TYPE_ICONS`**

Find this line in `app/dashboard/exporty/page.tsx`:
```typescript
const TYPE_ICONS: Record<string, typeof FileText> = {
```

Insert before it:
```typescript
type ExportRow = {
  id: string
  name: string
  type: string
  format: string
  project: string
  size_bytes: number
  created_at: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

```

- [ ] **Step 2: Add state and fetch effect — insert after the existing `useState`/`useEffect` block**

Find this line (the last `useState` before the `useEffect`s):
```typescript
  const [done, setDone] = useState(false)
```

Insert after it:
```typescript
  const [exportHistory, setExportHistory] = useState<ExportRow[]>([])
  const [historyTick, setHistoryTick] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('exports')
      .select('id, name, type, format, project, size_bytes, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setExportHistory(data ?? []))
  }, [historyTick])
```

- [ ] **Step 3: Trigger history refresh after successful generate**

Find this line inside the `generate()` function:
```typescript
      setGenerating(false)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
```

Replace with:
```typescript
      setGenerating(false)
      setDone(true)
      setHistoryTick((t) => t + 1)
      setTimeout(() => setDone(false), 2500)
```

- [ ] **Step 4: Add `downloadExport` function — insert after `generate()`**

Find this line:
```typescript
  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
```

Insert before it:
```typescript
  async function downloadExport(id: string) {
    const res = await fetch(`/api/exports/${id}/download`)
    if (!res.ok) return
    const { url } = await res.json()
    const a = document.createElement('a')
    a.href = url
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

```

- [ ] **Step 5: Replace the empty-state div with a conditional history list**

Find and replace this block (lines 644–653):
```typescript
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-background/60 px-6 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Download className="size-5" />
          </div>
          <p className="text-sm font-medium">Zatím jste nic nevyexportovali</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Až vygenerujete dokument výše, najdete ho tady připravený ke
            stažení.
          </p>
        </div>
```

Replace with:
```typescript
        {exportHistory.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-background/60 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Download className="size-5" />
            </div>
            <p className="text-sm font-medium">Zatím jste nic nevyexportovali</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Až vygenerujete dokument výše, najdete ho tady připravený ke
              stažení.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {exportHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border bg-background/60 px-4 py-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.project} · {formatBytes(item.size_bytes)} ·{" "}
                    {new Date(item.created_at).toLocaleDateString("cs-CZ")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => downloadExport(item.id)}
                  title="Stáhnout"
                >
                  <Download className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
```

- [ ] **Step 6: Verify builds**

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/exporty/page.tsx
git commit -m "feat: display export history with re-download support"
```

---

## Manual Verification

After all tasks are complete:

1. Start the dev server: `npm run dev`
2. Log in and navigate to `/dashboard/exporty`
3. Generate any export type → the PDF should download immediately
4. The "Poslední exporty" section should now show the export as a row with name, project, size, and date
5. Click the download icon on a history row → the PDF should download again
6. Check the Supabase dashboard → `exports` table should have a row; Storage bucket `exports` should have the file at `{user_id}/{export_id}.pdf`
7. Generate a second export → history should show 2 rows, newest first
