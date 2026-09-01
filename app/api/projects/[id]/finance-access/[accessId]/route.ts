import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createSupabaseClient } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; accessId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, accessId } = await params
  const supabase = createSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, created_by')
    .eq('id', id)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const userEmail = session.user.email.toLowerCase()
  const isOwner = !project.created_by || project.created_by.toLowerCase() === userEmail
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('finance_access')
    .delete()
    .eq('id', accessId)
    .eq('project_id', id)

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ success: true })
}
