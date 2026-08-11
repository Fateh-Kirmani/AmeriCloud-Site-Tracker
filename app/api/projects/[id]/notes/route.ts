import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('project_notes')
      .select('id, text, created_at')
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
      .insert({ project_id: id, text: text.trim() })
      .select('id, text, created_at')
      .single()
    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
