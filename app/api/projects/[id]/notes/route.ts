import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createSupabaseClient } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('project_notes')
      .select('id, text, created_at, author_name, author_email')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params
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
    const { data, error } = await supabase
      .from('project_notes')
      .insert({
        project_id: id,
        text: text.trim(),
        author_name: session?.user?.name ?? null,
        author_email: session?.user?.email ?? null,
      })
      .select('id, text, created_at, author_name, author_email')
      .single()
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
