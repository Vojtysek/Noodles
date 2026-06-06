import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/ai/client'
import { buildSummarizeInvoicePrompt } from '@/lib/ai/instructions/summarizeInvoice'

export const maxDuration = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: record, error: dbError } = await supabase
    .from('invoices')
    .select('storage_path, file_name, mime_type')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (dbError) {
    if (dbError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[invoices/summarize] DB error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: blob, error: dlErr } = await supabase.storage
    .from('invoices')
    .download(record.storage_path)

  if (dlErr || !blob) {
    console.error('[invoices/summarize] Storage error:', dlErr)
    return NextResponse.json({ error: 'Storage error' }, { status: 500 })
  }

  const base64 = Buffer.from(await blob.arrayBuffer()).toString('base64')
  const isPdf = record.mime_type === 'application/pdf'

  const filePart = isPdf
    ? {
        type: 'input_file' as const,
        filename: record.file_name,
        file_data: `data:application/pdf;base64,${base64}`,
      }
    : {
        type: 'input_image' as const,
        detail: 'auto' as const,
        image_url: `data:${record.mime_type};base64,${base64}`,
      }

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o',
      instructions: buildSummarizeInvoicePrompt(),
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Shrň tuto fakturu podle pokynů a vrať pouze JSON.' },
            filePart,
          ],
        },
      ],
      max_output_tokens: 800,
    })

    const raw = response.output_text ?? ''

    if (!raw.trim()) {
      return NextResponse.json(
        { error: 'Shrnutí se nepodařilo vygenerovat' },
        { status: 502 }
      )
    }

    let parsed: { summary?: string; extracted?: unknown }
    try {
      const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { summary: raw, extracted: null }
    }

    const summary = parsed.summary ?? raw
    const extracted = parsed.extracted ?? null

    await supabase
      .from('invoices')
      .update({
        summary,
        extracted,
        summary_generated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ summary, extracted })
  } catch (error) {
    console.error('[invoices/summarize] Summarization error:', error)
    const name = error instanceof Error ? error.constructor.name : ''
    if (name === 'AuthError' || name === 'APIError') {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 })
  }
}
