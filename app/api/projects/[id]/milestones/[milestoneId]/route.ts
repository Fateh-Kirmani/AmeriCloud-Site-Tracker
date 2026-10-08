import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id, milestoneId } = await params
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('project_id', id)
    if (error) {
      console.error('[DELETE /api/projects/[id]/milestones/[milestoneId]]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
