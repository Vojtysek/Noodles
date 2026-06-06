import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_BYTES = 10 * 1024 * 1024

/**
 * POST /api/invoices
 *
 * Multipart form upload (field: file). Stores the invoice in private Storage
 * and inserts a DB record. Accepts PDF / JPEG / PNG / WebP up to 10 MB.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const ext = ALLOWED[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 })
  }

  const invoiceId = crypto.randomUUID()
  const storagePath = `${user.id}/${invoiceId}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('invoices')
    .upload(storagePath, file, { contentType: file.type })

  if (upErr) {
    console.error('[invoices] Storage upload failed:', upErr)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data, error: insErr } = await supabase
    .from('invoices')
    .insert({
      id: invoiceId,
      user_id: user.id,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select(
      'id, file_name, mime_type, size_bytes, summary, extracted, summary_generated_at, created_at'
    )
    .single()

  if (insErr) {
    await supabase.storage.from('invoices').remove([storagePath])
    console.error('[invoices] DB insert failed:', insErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
