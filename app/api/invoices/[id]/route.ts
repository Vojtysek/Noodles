import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
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
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (dbError) {
    if (dbError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[invoices/delete] DB error:', dbError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await supabase.storage.from('invoices').remove([record.storage_path])
  await supabase.from('invoices').delete().eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
