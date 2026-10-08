import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createSupabaseClient } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'
import { isProjectCreator } from '@/lib/permissions'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; editorId: string }> }
) {
  const { id, editorId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const creator = await isProjectCreator(id, session.user.email)
  if (!creator) return NextResponse.json({ error: 'Only the project creator can manage access.' }, { status: 403 })

  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('project_editors')
      .delete()
      .eq('id', editorId)
      .eq('project_id', id)
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
