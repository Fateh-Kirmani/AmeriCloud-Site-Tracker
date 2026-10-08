import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; rowId: string }> }
) {
  const { id, rowId } = await params
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('crew_members')
      .delete()
      .eq('id', rowId)
      .eq('project_id', id)
    if (error) {
      console.error('[DELETE /api/projects/[id]/crew/[rowId]]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
