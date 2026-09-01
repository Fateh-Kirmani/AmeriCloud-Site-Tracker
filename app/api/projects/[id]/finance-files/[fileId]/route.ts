import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id, fileId } = await params
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { notes, status } = body as { notes: unknown; status: unknown }
  try {
    const supabase = createSupabaseClient()
    const { data: file } = await supabase
      .from('finance_files')
      .select('id')
      .eq('id', fileId)
      .eq('project_id', id)
      .maybeSingle()
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    const { error } = await supabase
      .from('finance_files')
      .update({
        notes: typeof notes === 'string' ? notes || null : null,
        status: typeof status === 'string' ? status || null : undefined,
      })
      .eq('id', fileId)
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id, fileId } = await params
  try {
    const supabase = createSupabaseClient()
    const { data: file } = await supabase
      .from('finance_files')
      .select('*')
      .eq('id', fileId)
      .eq('project_id', id)
      .maybeSingle()
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([file.storage_path])

    if (storageError) {
      console.error('[DELETE /api/projects/[id]/finance-files/[fileId]] storage error:', storageError.message)
    }

    const { error } = await supabase.from('finance_files').delete().eq('id', fileId)
    if (error) {
      console.error('[DELETE /api/projects/[id]/finance-files/[fileId]] db error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
