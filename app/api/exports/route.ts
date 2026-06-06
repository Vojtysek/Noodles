import { NextRequest, NextResponse } from 'next/server'
import { compileData } from './utils/data-compiler'
import { generateInsights } from './utils/openai-insights'
import { generatePDF } from '@/lib/pdf-generator'

export const maxDuration = 60

const VALID_EXPORT_TYPES = ['overall-brief', 'persona', 'overall-detail', 'presentation'] as const
type ExportType = (typeof VALID_EXPORT_TYPES)[number]

function isValidExportType(value: string): value is ExportType {
  return VALID_EXPORT_TYPES.includes(value as ExportType)
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
 *   4. Stream PDF       — attachment response
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
        // Non-fatal — PDF is generated without AI content
      }
    }

    // Step 3: Generate PDF
    const pdfBuffer = await generatePDF(exportType, context)

    // Step 4: Return as downloadable PDF
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
