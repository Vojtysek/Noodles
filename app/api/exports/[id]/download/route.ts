import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
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
    .from('exports')
    .select('storage_path, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (dbError) {
    if (dbError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[exports/download] DB error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

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

  return NextResponse.json(
    { url: data.signedUrl },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
