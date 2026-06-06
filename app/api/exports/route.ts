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
        const insights = await generateInsights(
          context.persona,
          {
            id: context.scenarioId,
            name: context.scenarioName,
            tagline: context.scenarioTagline,
            tone: 'emerald',
            projectIds: context.projects.map((p) => p.id as any),
          },
          {
            budget: context.totalBudget,
            savingsPerYear: context.totalSavingsPerYear,
            breakEvenYear: context.breakEvenYear ?? null,
            savingsPctOfCosts: context.savingsPctOfCosts ?? 0,
            fundMonthlyPerUnit: context.fundMonthlyPerUnit ?? 0,
            energySavingMonthlyPerUnit: context.energySavingMonthlyPerUnit ?? 0,
            units: context.units ?? 0,
          },
          context.benefits.map((b) => ({ title: b.title, description: b.description, meetingPitch: b.meetingPitch }))
        )
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
          .upload(storagePath, new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), {
            contentType: 'application/pdf',
          })

        if (uploadError) {
          console.error('[exports] Storage upload failed:', uploadError)
        } else {
          const personaName = context.persona?.name
          const { error: insertError } = await supabase.from('exports').insert({
            id: exportId,
            user_id: user.id,
            name: buildExportName(exportType, personaName),
            type: TYPE_LABELS[exportType],
            format: 'PDF',
            project: context.scenarioName || 'Celkový přehled',
            storage_path: storagePath,
            size_bytes: pdfBuffer.length,
          })
          if (insertError) {
            console.error('[exports] DB insert failed:', insertError)
          }
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
