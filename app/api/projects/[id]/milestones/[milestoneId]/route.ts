import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createSupabaseClient } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'
import { canEditProject } from '@/lib/permissions'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id, milestoneId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const authorized = await canEditProject(id, session.user.email)
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
