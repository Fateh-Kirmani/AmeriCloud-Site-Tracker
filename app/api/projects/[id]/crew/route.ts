import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createSupabaseClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[GET /api/projects/[id]/crew]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ crew_members: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { crew_members, deleted_ids } = body as { crew_members: unknown; deleted_ids: unknown }
  if (!Array.isArray(crew_members) || !Array.isArray(deleted_ids)) {
    return NextResponse.json({ error: 'Invalid body shape' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    if (deleted_ids.length > 0) {
      const { error } = await supabase.from('crew_members').delete().eq('project_id', id).in('id', deleted_ids)
      if (error) {
        console.error('[PUT /api/projects/[id]/crew] delete error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    if (crew_members.length > 0) {
      const rows = (crew_members as Record<string, unknown>[]).map((m, i) => ({
        ...(m.id ? { id: m.id } : {}),
        project_id: id,
        name: (m.name as string) || null,
        email: (m.email as string) || null,
        task: (m.task as string) || null,
        date_from: (m.date_from as string) || null,
        date_to: (m.date_to as string) || null,
        sort_order: (m.sort_order as number) ?? i,
      }))
      const { error } = await supabase.from('crew_members').upsert(rows)
      if (error) {
        console.error('[PUT /api/projects/[id]/crew] upsert error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true })

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ crew_members: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
