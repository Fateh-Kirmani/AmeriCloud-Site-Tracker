import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { id, noteId } = await params
  try {
    const supabase = createSupabaseClient()
    const { data: note } = await supabase
      .from('project_notes')
      .select('id')
      .eq('id', noteId)
      .eq('project_id', id)
      .maybeSingle()
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    const { error } = await supabase.from('project_notes').delete().eq('id', noteId)
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
