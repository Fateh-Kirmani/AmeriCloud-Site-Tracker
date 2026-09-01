import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createSupabaseClient } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, noteId } = await params
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { text } = body as { text: unknown }
  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  try {
    const supabase = createSupabaseClient()
    const { data: note } = await supabase
      .from('project_notes')
      .select('id, author_email')
      .eq('id', noteId)
      .eq('project_id', id)
      .maybeSingle()
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    if (note.author_email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data, error } = await supabase
      .from('project_notes')
      .update({ text: text.trim() })
      .eq('id', noteId)
      .select('id, text, created_at, author_name, author_email')
      .single()
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, noteId } = await params
  try {
    const supabase = createSupabaseClient()
    const { data: note } = await supabase
      .from('project_notes')
      .select('id, author_email')
      .eq('id', noteId)
      .eq('project_id', id)
      .maybeSingle()
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    if (note.author_email !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { error } = await supabase.from('project_notes').delete().eq('id', noteId)
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
